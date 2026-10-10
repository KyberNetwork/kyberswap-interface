import { judgeInventory } from '@kyber/hooks'
import { Token, TokenAmount } from '@kyberswap/ks-sdk-core'
import { InventoryRow } from 'services/walletInventory'

import { InventoryEntry } from 'state/walletInventory/store'

/**
 * The decision layer between the raw store entry and what consumers render, kept free of React so the
 * rules that decide "trust this or fall back to multicall" can be exercised directly.
 */

const EMPTY_ROWS: Record<string, InventoryRow> = {}

export type WalletInventory = {
  /** Checksummed token address → row, for tokens the wallet holds. */
  rows: Record<string, InventoryRow>
  /**
   * Whether this answers for the wallet completely: every token it holds is listed, so an address
   * absent from `rows` is held at zero. There is no half-trusted state — an answer that cannot be
   * relied on for one token cannot be relied on for the silence about the others either, and a
   * caller reads its own source instead.
   */
  active: boolean
  /**
   * No answer yet, but one is on its way: the first walk for this wallet is in flight. A caller waits
   * rather than starting the whole-list sweep this layer exists to remove — a wallet is one request
   * and the walk carries its own deadline, so the wait is short and bounded. Every other way of not
   * being `active` is a decision already made, and the caller reads its own source at once.
   */
  pending: boolean
}

// Module constants, not built per call: a caller sees one of these on every render until a walk
// lands, and a fresh object would ripple a new balance map (and a list re-sort) out of every one.
export const INACTIVE_INVENTORY: WalletInventory = { rows: EMPTY_ROWS, active: false, pending: false }
const PENDING_INVENTORY: WalletInventory = { rows: EMPTY_ROWS, active: false, pending: true }

/**
 * Turns a store entry into what consumers should read.
 *
 * The walk itself says whether the answer can be relied on — see `judgeInventory` — and the sweep
 * has already asked the service for the node's word where the index was silent about native, so
 * nothing here waits on a read of its own. Anything not relied on reads as inactive rather than as a
 * half-answer: the caller has its own balance source and reads it.
 */
export const resolveInventory = (entry: InventoryEntry | undefined, subscribed: boolean): WalletInventory => {
  if (!subscribed) return INACTIVE_INVENTORY
  // The first walk is on its way; a failed one commits an entry, so this does not outlast it.
  if (!entry) return PENDING_INVENTORY
  if (entry.status === 'error') return INACTIVE_INVENTORY
  // A partial walk (wallet larger than the page cap) is not authoritative about anything it did not
  // list, which is most of what the selector renders — multicall answers those in one block instead.
  if (entry.status !== 'settled') return INACTIVE_INVENTORY

  // A wallet the node says is funded while the index lists no native is missing at least one
  // holding; one the node says holds none is complete as listed. Decided by what the walk brought
  // back, never waited on.
  if (judgeInventory(entry) !== 'trusted') return INACTIVE_INVENTORY

  // Live reads are merged into the rows at the head block, so a native balance read live — after a
  // transaction of the user's own — already outranks the index's amount, and one read as zero is a
  // tombstone the reader never sees.
  return { rows: withoutTombstones(entry.rows), active: true, pending: false }
}

/**
 * The store keeps zero rows so a live read's "emptied" outranks the index's lagging amount; to a
 * reader such a token is simply not held. Same object back when there is nothing to drop.
 */
const withoutTombstones = (rows: Record<string, InventoryRow>): Record<string, InventoryRow> => {
  let next: Record<string, InventoryRow> | undefined
  Object.values(rows).forEach(row => {
    if (row.rawBalance !== 0n) return
    next ??= { ...rows }
    delete next[row.address]
  })
  return next ?? rows
}

// One zero per Token: an active inventory synthesizes zeros for most of the whitelist, and rebuilding
// hundreds of identical JSBI-backed amounts on every inventory change is pure allocation churn.
const zeroAmounts = new WeakMap<Token, TokenAmount>()
const zeroAmountFor = (token: Token): TokenAmount => {
  let zero = zeroAmounts.get(token)
  if (!zero) {
    zero = TokenAmount.fromRawAmount(token, '0')
    zeroAmounts.set(token, zero)
  }
  return zero
}

/**
 * Balances keyed by checksummed token address, shaped exactly like the `useTokenBalances` multicall
 * map so a caller can swap sources without touching its consumers.
 *
 * An active inventory answers for the whole wallet, so a token it does not list is held at zero and
 * is mapped as such — the service omits zero balances rather than reporting them. An inactive one
 * maps nothing at all, leaving the caller's own source to answer.
 */
export const buildInventoryBalanceMap = (
  tokens: Token[],
  inventory: WalletInventory,
): { [tokenAddress: string]: TokenAmount | undefined } => {
  const map: { [tokenAddress: string]: TokenAmount | undefined } = {}
  if (!inventory.active) return map
  tokens.forEach(token => {
    const row = inventory.rows[token.address]
    map[token.address] = row ? TokenAmount.fromRawAmount(token, row.rawBalance.toString()) : zeroAmountFor(token)
  })
  return map
}
