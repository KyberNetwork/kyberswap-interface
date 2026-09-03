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
  /**
   * Checksummed token address → row, as merged across walks. Includes zero rows a live read
   * established (tombstones): they hold their place against the index's lagging amount until it
   * catches up. Readers take them as absent; see `resolveInventory`.
   */
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
   * The catch-up watch opened by a transaction the user just made. While it is on, the sweep polls
   * at the catch-up cadence and asks the service to read `touched` from the node (`liveAddrs`), so
   * the balances that just changed are right before the index has caught up. It retires when the
   * index reaches `awaitingBlock`, or at `awaitingUntil` when there is no block to chase (a Safe
   * receipt carries none).
   */
  awaitingBlock?: number
  awaitingUntil?: number
  /** Checksummed tokens the watched transactions moved. */
  touched?: string[]
}

/** Live reads per catch-up poll are node reads on the service; a session of trading must not pile up. */
const TOUCHED_CAP = 32

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
  const now = Date.now()
  const key = inventoryKey(chainId, account)
  const entry = meta.get(key)
  // Tokens accumulate across the transactions of one watch and are dropped with it: the list is the
  // current transactions', not the session's. It only changes when an address joins, so consumers
  // keyed on it do not re-subscribe for nothing.
  const carried = entry && isCatchingUp(key, now) ? entry.touched ?? NO_ADDRESSES : NO_ADDRESSES
  const added = touched.filter(address => !carried.includes(address))
  const carriedBlock = carried.length ? entry?.awaitingBlock : undefined
  meta.set(key, {
    failures: entry?.failures ?? 0,
    nextRetryAt: 0,
    forced: true,
    awaitingBlock: awaitingBlock !== undefined ? Math.max(awaitingBlock, carriedBlock ?? 0) : carriedBlock,
    awaitingUntil: now + INVENTORY_CATCHUP_TIMEOUT_MS,
    touched: added.length ? [...carried, ...added].slice(-TOUCHED_CAP) : carried.length ? entry?.touched : undefined,
  })
  emit()
}

/**
 * True while the inventory is still chasing a transaction of this wallet's: until the index reaches
 * the transaction's block, or, when the receipt carried none, until the window runs out.
 */
export const isCatchingUp = (key: string, now: number): boolean => {
  const entry = meta.get(key)
  if (!entry?.awaitingUntil || now > entry.awaitingUntil) return false
  return entry.awaitingBlock === undefined || (entries.get(key)?.blockNumber ?? 0) < entry.awaitingBlock
}

/** Tokens to read live for this wallet: those its watched transactions moved, while the watch is on. */
export const readTouchedTokens = (key: string, now: number): string[] =>
  isCatchingUp(key, now) ? meta.get(key)?.touched ?? NO_ADDRESSES : NO_ADDRESSES

/**
 * Field-level equality for the rendered parts of two row maps. The block stamp is bookkeeping, not
 * rendered: a live read re-stamped at every catch-up poll must not wake every consumer over a
 * balance that did not move.
 */
const rowsEqual = (a: Record<string, InventoryRow>, b: Record<string, InventoryRow>): boolean => {
  const aKeys = Object.keys(a)
  if (aKeys.length !== Object.keys(b).length) return false
  for (const key of aKeys) {
    const x = a[key]
    const y = b[key]
    if (!y) return false
    if (x.rawBalance !== y.rawBalance || x.decimals !== y.decimals || x.symbol !== y.symbol) return false
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
    if (existing && existing.blockNumber > row.blockNumber) {
      rows[row.address] = existing
      return
    }
    // The catalog description travels with the token whichever row wins: a live read may carry none.
    rows[row.address] =
      existing && (row.decimals === undefined || row.symbol === undefined)
        ? { ...row, decimals: row.decimals ?? existing.decimals, symbol: row.symbol ?? existing.symbol }
        : row
  })
  // A walk only retires rows its index is authoritative about. Anything it did not list but that was
  // stamped past what its index knows — a live read, a token bought or emptied at the head — is
  // carried forward, so the index catching up later cannot restate a balance the node has already
  // contradicted.
  if (previous) {
    Object.values(previous.rows).forEach(row => {
      if (!rows[row.address] && row.blockNumber > result.blockNumber) rows[row.address] = row
    })
  }

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
