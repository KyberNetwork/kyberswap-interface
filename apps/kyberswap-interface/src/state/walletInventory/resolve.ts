import { Token, TokenAmount } from '@kyberswap/ks-sdk-core'
import { InventoryRow } from 'services/walletInventory'

import { ETHER_ADDRESS } from 'constants/index'
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
}

// Module constant, not built per call: a caller sees it on every render until a walk lands, and a
// fresh object would ripple a new balance map (and a list re-sort) out of every one of them.
export const INACTIVE_INVENTORY: WalletInventory = { rows: EMPTY_ROWS, active: false }

/**
 * Turns a store entry into what consumers should read.
 *
 * `nativeRawBalance` is the live per-block native balance (undefined while its first read is still in
 * flight). The service lists every non-zero holding, the native currency included, so an answer
 * without a native row is complete only for a wallet that holds none — and the chain is what says so.
 * The same read then supplies the native balance itself, which the index lags and users watch most
 * closely.
 *
 * Anything this cannot vouch for reads as inactive rather than as a half-answer: the caller has its
 * own balance source and reads it, which is what keeps a screen from waiting on this one.
 */
export const resolveInventory = (
  entry: InventoryEntry | undefined,
  subscribed: boolean,
  nativeRawBalance?: string,
): WalletInventory => {
  if (!subscribed) return INACTIVE_INVENTORY
  if (!entry) return INACTIVE_INVENTORY
  if (entry.status === 'error') return INACTIVE_INVENTORY
  // A partial walk (wallet larger than the page cap) is not authoritative about anything it did not
  // list, which is most of what the selector renders — multicall answers those in one block instead.
  if (entry.status !== 'settled') return INACTIVE_INVENTORY

  const held = withoutTombstones(entry.rows)
  const nativeRead = nativeRawBalance !== undefined ? BigInt(nativeRawBalance) : undefined
  const nativeRow = held[ETHER_ADDRESS]

  // No native row means either a wallet that holds none or one the index has not covered — the two
  // are the same answer here, and only the chain tells them apart. Until it does, or if it says the
  // wallet is funded, this answer is missing at least one holding and is not relied on.
  if (!nativeRow && (nativeRead === undefined || nativeRead > 0n)) return INACTIVE_INVENTORY

  // The chain owns the native balance: the index lags it, and it is the number users watch most
  // closely. Read as zero, the wallet holds none — a max-send just mined must not keep showing the
  // index's pre-transaction amount, and a token held at zero is a token absent from the rows.
  const rows =
    nativeRead === undefined || !nativeRow
      ? held
      : nativeRead === 0n
      ? withoutNative(held)
      : { ...held, [ETHER_ADDRESS]: { ...nativeRow, rawBalance: nativeRead } }

  return { rows, active: true }
}

const withoutNative = (rows: Record<string, InventoryRow>): Record<string, InventoryRow> => {
  const next = { ...rows }
  delete next[ETHER_ADDRESS]
  return next
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
