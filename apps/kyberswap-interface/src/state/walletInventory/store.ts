import {
  isChainUnsupported,
  isWalletInventoryChain,
  markChainUnsupported as markUnsupportedForEveryone,
} from '@kyber/hooks'
import { InventoryRow, WalletInventoryResult } from 'services/walletInventory'

import { KD_API_URL } from 'constants/env'
import {
  INVENTORY_CATCHUP_TIMEOUT_MS,
  INVENTORY_RETRY_BACKOFF_MS,
  INVENTORY_RETRY_JITTER,
} from 'state/walletInventory/constants'

/**
 * Which (chain, account) inventories have a mounted consumer, plus the data and fetch bookkeeping for
 * each. Kept out of Redux like the token-price registry: membership churns as modals mount, the values
 * include bigints that do not belong in a serializable store, and every write here would otherwise
 * notify every `useAppSelector` in the app.
 */

export type InventoryStatus =
  /** Nothing fetched yet for this wallet. */
  | 'loading'
  /** Every held token is listed — the only state in which an absent token can be read as zero. */
  | 'settled'
  /** Some tokens are listed but the walk did not finish; absence proves nothing. */
  | 'partial'
  /** No usable data and the last attempt failed. */
  | 'error'

export type InventoryEntry = {
  /** Checksummed token address → row. Only tokens with a non-zero balance. */
  rows: Record<string, InventoryRow>
  status: InventoryStatus
  /** How far this inventory has caught up to the chain. */
  blockNumber: number
  fetchedAt: number
}

type Meta = {
  failures: number
  nextRetryAt: number
  /** Set by `expireInventory`; makes the next sweep pick this entry up whatever its TTL says. */
  forced: boolean
  /**
   * Block of a transaction the user just made. While the inventory's block is behind it the sweep
   * polls at the catch-up cadence instead of the TTL; the watch retires by itself once caught up or
   * on timeout.
   */
  awaitingBlock?: number
  awaitingUntil?: number
  /**
   * Tokens the watched transactions moved (checksummed). While the watch is on, consumers read
   * these straight from the chain and overlay the result, so the indexer's lag is not on screen for
   * exactly the balances that just changed.
   */
  touched?: string[]
}

const NO_ADDRESSES: string[] = []

const EMPTY_ROWS: Record<string, InventoryRow> = {}

const subscriptions = new Map<string, number>()
const entries = new Map<string, InventoryEntry>()
const meta = new Map<string, Meta>()

let version = 0
const listeners = new Set<() => void>()

const emit = () => {
  version += 1
  listeners.forEach(listener => listener())
}

export const subscribeStore = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const getStoreVersion = () => version

export const inventoryKey = (chainId: number, account: string) => `${chainId}:${account.toLowerCase()}`

/**
 * Whether the inventory layer can serve this chain: a host is configured, the chain is on the list,
 * and the service has not answered "unsupported chain" for it. The list and that set live in
 * `@kyber/hooks`, shared with the widget selectors, so a chain either side learns is off is off for both.
 */
export const isInventoryChain = (chainId: number): boolean => !!KD_API_URL && isWalletInventoryChain(chainId)

export const markChainUnsupported = (chainId: number) => {
  if (isChainUnsupported(chainId)) return
  markUnsupportedForEveryone(chainId)
  // Drop what was collected for the chain so nothing renders from a source we will never refresh.
  Array.from(entries.keys()).forEach(key => {
    if (key.startsWith(`${chainId}:`)) entries.delete(key)
  })
  emit()
}

export const register = (chainId: number, account: string) => {
  const key = inventoryKey(chainId, account)
  subscriptions.set(key, (subscriptions.get(key) ?? 0) + 1)
  emit()
}

export const unregister = (chainId: number, account: string) => {
  const key = inventoryKey(chainId, account)
  const next = (subscriptions.get(key) ?? 0) - 1
  if (next > 0) subscriptions.set(key, next)
  else subscriptions.delete(key)
  // The entry itself stays: reopening a modal must not refetch what we already hold.
  emit()
}

export const readSubscriptions = () => subscriptions
export const readEntry = (key: string) => entries.get(key)
export const readMeta = (key: string) => meta.get(key)

/**
 * Marks the wallet's inventory due on the next sweep, e.g. after a transaction of theirs confirms.
 * `touched` names the tokens that transaction moved; they are read live while the watch is on.
 */
export const expireInventory = (
  chainId: number,
  account: string,
  awaitingBlock?: number,
  touched: readonly string[] = NO_ADDRESSES,
) => {
  // Confirmed transactions arrive from every chain the app serves; only the indexed ones have an
  // inventory to refresh, and writing meta for the rest would accrete dead keys and wake subscribers
  // over data no sweep will ever fetch.
  if (!isInventoryChain(chainId)) return
  const key = inventoryKey(chainId, account)
  const entry = meta.get(key)
  // Touched tokens accumulate across the transactions of one watch; the array only changes when a
  // new address joins, so consumers keyed on it do not re-subscribe for nothing.
  const previousTouched = entry?.touched ?? NO_ADDRESSES
  const added = touched.filter(address => !previousTouched.includes(address))
  meta.set(key, {
    failures: entry?.failures ?? 0,
    nextRetryAt: 0,
    forced: true,
    awaitingBlock: awaitingBlock ?? entry?.awaitingBlock,
    awaitingUntil: awaitingBlock ? Date.now() + INVENTORY_CATCHUP_TIMEOUT_MS : entry?.awaitingUntil,
    touched: added.length ? [...previousTouched, ...added] : entry?.touched,
  })
  emit()
}

/** Tokens to read live for this wallet: those its watched transactions moved, while the watch is on. */
export const readTouchedTokens = (key: string, now: number): string[] =>
  isAwaitingBlock(key, now) ? meta.get(key)?.touched ?? NO_ADDRESSES : NO_ADDRESSES

/** True while we are still chasing a transaction's block for this wallet. */
export const isAwaitingBlock = (key: string, now: number): boolean => {
  const entry = meta.get(key)
  if (!entry?.awaitingBlock) return false
  if (entry.awaitingUntil && now > entry.awaitingUntil) return false
  return (entries.get(key)?.blockNumber ?? 0) < entry.awaitingBlock
}

/** Field-level equality for the render-relevant parts of two row maps. */
const rowsEqual = (a: Record<string, InventoryRow>, b: Record<string, InventoryRow>): boolean => {
  const aKeys = Object.keys(a)
  if (aKeys.length !== Object.keys(b).length) return false
  for (const key of aKeys) {
    const x = a[key]
    const y = b[key]
    if (!y) return false
    if (x.rawBalance !== y.rawBalance || x.blockNumber !== y.blockNumber) return false
    if (x.decimals !== y.decimals || x.symbol !== y.symbol) return false
  }
  return true
}

export const commitResult = (key: string, result: WalletInventoryResult) => {
  const now = Date.now()
  const previous = entries.get(key)

  const status: InventoryStatus = result.complete ? 'settled' : 'partial'

  // Every result commits, including one fetched inside the indexer's lag after a transaction: it
  // matches what is already on screen, so it lands in the unchanged fast-path below and repaints
  // nothing, while the awaiting-block watch (read by the sweep, not by this function) keeps polling
  // until a row is stamped at or past the transaction's block. Per-row block monotonicity is the only
  // ordering guard needed — it also covers two in-flight walks resolving out of order.
  const rows: Record<string, InventoryRow> = {}
  result.rows.forEach(row => {
    const existing = previous?.rows[row.address]
    rows[row.address] = existing && existing.blockNumber > row.blockNumber ? existing : row
  })

  // The steady-state poll usually returns exactly what is already on screen. Committing it as a new
  // object would ripple identity changes all the way to a full re-sort of the token list every TTL
  // tick, so an unchanged result only touches bookkeeping (in place — none of it is rendered) and
  // wakes no subscribers at all. Fetch timing still advances, so the TTL does not refire early.
  // Any awaiting-block watch is preserved across commits on purpose: a result fetched inside the
  // indexer's lag commits (silently, below) without satisfying it, and it retires by itself the
  // moment `isAwaitingBlock` sees the entry's block reach the watched one.
  if (previous && previous.status === status && rowsEqual(previous.rows, rows)) {
    previous.fetchedAt = now
    previous.blockNumber = Math.max(result.blockNumber, previous.blockNumber)
    meta.set(key, { ...meta.get(key), failures: 0, nextRetryAt: 0, forced: false })
    return
  }

  entries.set(key, {
    rows,
    status,
    blockNumber: Math.max(result.blockNumber, previous?.blockNumber ?? 0),
    fetchedAt: now,
  })
  meta.set(key, { ...meta.get(key), failures: 0, nextRetryAt: 0, forced: false })
  emit()
}

export const commitFailure = (key: string) => {
  const previous = meta.get(key)
  const failures = (previous?.failures ?? 0) + 1
  const base = INVENTORY_RETRY_BACKOFF_MS[Math.min(failures - 1, INVENTORY_RETRY_BACKOFF_MS.length - 1)]
  meta.set(key, {
    ...previous,
    failures,
    // Jittered so tabs that failed together do not all retry on the same tick.
    nextRetryAt: Date.now() + base * (1 + Math.random() * INVENTORY_RETRY_JITTER),
    forced: false,
  })

  // Stale-while-revalidate: an entry that already has data keeps serving it; only a wallet with
  // nothing at all is marked failed, which is what tells consumers to use the multicall path.
  const entry = entries.get(key)
  if (!entry) {
    entries.set(key, { rows: EMPTY_ROWS, status: 'error', blockNumber: 0, fetchedAt: 0 })
  }
  emit()
}

/** Test-only: drop all subscriptions, data and bookkeeping. */
export const resetInventoryStore = () => {
  subscriptions.clear()
  entries.clear()
  meta.clear()
  version = 0
  listeners.clear()
}
