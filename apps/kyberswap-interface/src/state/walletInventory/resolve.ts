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
  /** Checksummed token address → row, for tokens with a non-zero balance. */
  rows: Record<string, InventoryRow>
  /**
   * Whether consumers should read balances from here at all. False means the chain is not indexed,
   * no wallet is connected, the walk could not cover the wallet, or the data failed a trust check —
   * all of which mean "use multicall".
   */
  active: boolean
  /**
   * Whether an address missing from `rows` can be read as a zero balance. Only true once a complete
   * walk has landed and survived the trust check; anything less proves nothing about what it does
   * not list.
   */
  settled: boolean
  /**
   * The first fetch for this wallet is still in flight. Callers should hold off on starting the
   * multicall fallback: firing it here would run the whole-whitelist balanceOf sweep that this layer
   * exists to remove, only to discard it a moment later. A failed fetch clears this and turns
   * `active` off, so a service that never answers still falls back rather than hanging on a skeleton.
   */
  pending: boolean
}

export const INACTIVE_INVENTORY: WalletInventory = {
  rows: EMPTY_ROWS,
  active: false,
  settled: false,
  pending: false,
}

// Module constant, not built per call: the pending window overlaps the modal's opening renders, and a
// fresh object here would ripple a new balance map (and a list re-sort) out of every one of them.
const PENDING_INVENTORY: WalletInventory = { ...INACTIVE_INVENTORY, pending: true }

/**
 * Turns a store entry into what consumers should read.
 *
 * `nativeRawBalance` is the live per-block native balance (undefined while its first read is still in
 * flight), and it serves two purposes. It is the trust check: the API cannot tell a wallet it never
 * indexed from an empty one — both come back with no rows — so a funded wallet whose inventory lists
 * no native holding is not to be believed, and the caller falls back to multicall. It is also an
 * overlay, since having paid for that read already it may as well win over the indexed native row,
 * which is the balance users watch most closely.
 */
export const resolveInventory = (
  entry: InventoryEntry | undefined,
  subscribed: boolean,
  nativeRawBalance?: string,
): WalletInventory => {
  if (!subscribed) return INACTIVE_INVENTORY
  // Subscribed with nothing stored yet: the first fetch is on its way, so hold the fallback back.
  if (!entry) return PENDING_INVENTORY
  if (entry.status === 'error') return INACTIVE_INVENTORY
  // A partial walk (wallet larger than the page cap) is not authoritative about anything it did not
  // list, which is most of what the selector renders — multicall answers those in one block instead.
  if (entry.status !== 'settled') return INACTIVE_INVENTORY

  const nativeRow = entry.rows[ETHER_ADDRESS]
  if (!nativeRow) {
    // Funded wallet the inventory failed to account for: the data is not to be believed.
    if (nativeRawBalance && nativeRawBalance !== '0') return INACTIVE_INVENTORY
    // The trust check cannot run until the native read lands. Serve the rows, but withhold `settled`
    // so no zeros are synthesized off data that may be about to fail the check.
    if (nativeRawBalance === undefined) {
      return { rows: entry.rows, active: true, settled: false, pending: false }
    }
  }

  // Compared against undefined, not truthiness: a live balance of exactly '0' is the case the overlay
  // matters most for — a wallet just drained by a max-send must not keep showing the indexer's stale
  // pre-transaction amount for the length of its lag.
  const rows =
    nativeRawBalance !== undefined && nativeRow
      ? { ...entry.rows, [ETHER_ADDRESS]: { ...nativeRow, rawBalance: BigInt(nativeRawBalance) } }
      : entry.rows

  return { rows, active: true, settled: true, pending: false }
}

// One zero per Token: a settled inventory synthesizes zeros for most of the whitelist, and rebuilding
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
 * A settled inventory synthesizes an explicit zero for tokens it does not list — that is what tracking
 * `settled` buys us, since the API omits zero balances rather than reporting them. While the inventory
 * is not yet settled those stay undefined, so the UI keeps its loading state instead of asserting a
 * zero it cannot back up.
 */
export const buildInventoryBalanceMap = (
  tokens: Token[],
  inventory: WalletInventory,
): { [tokenAddress: string]: TokenAmount | undefined } => {
  const map: { [tokenAddress: string]: TokenAmount | undefined } = {}
  if (!inventory.active) return map
  tokens.forEach(token => {
    const row = inventory.rows[token.address]
    if (row) map[token.address] = TokenAmount.fromRawAmount(token, row.rawBalance.toString())
    else if (inventory.settled) map[token.address] = zeroAmountFor(token)
  })
  return map
}
