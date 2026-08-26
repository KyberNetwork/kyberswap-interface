import { InventoryRawRow, UnsupportedChainError, parseRawAmount, walkWalletInventory } from '@kyber/hooks'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { z } from 'zod'

import { KD_API_URL } from 'constants/env'
import { ETHER_ADDRESS } from 'constants/index'
import { isAddress } from 'utils/address'

export { UnsupportedChainError, parseRawAmount }

/** One token the wallet holds, as the rest of the app consumes it. */
export type InventoryRow = {
  /** Checksummed. The API's native sentinel is normalized to `ETHER_ADDRESS`. */
  address: string
  /** On-chain units. Divide by the token's real `decimals` only at display time. */
  rawBalance: bigint
  /** Block at which this token's balance last changed — per token, not a snapshot of the response. */
  blockNumber: number
  /** Only present for tokens the catalog knows; absent for unknown / spam holdings. */
  decimals?: number
  symbol?: string
}

export type WalletInventoryResult = {
  rows: InventoryRow[]
  /**
   * False when the walk stopped before reaching the end (page cap hit). A partial inventory can never
   * be read as "every other token is zero" — it only proves the tokens it does list are held.
   */
  complete: boolean
  /** Highest `blockNumber` seen, i.e. how far this inventory has caught up to the chain. */
  blockNumber: number
}

// Metadata is omitted per row for tokens the catalog does not know, so all of it is optional.
const rowSchema = z.object({
  tokenAddress: z.string(),
  rawAmount: z.string(),
  blockNumber: z.number(),
  decimals: z.number().optional(),
  symbol: z.string().optional(),
})

/**
 * Every consumer keys balances by the checksummed `Token.address`, so an un-normalized (lowercase) key
 * would miss every lookup silently — the comparator would fall back to a symbol sort and held
 * whitelist tokens would duplicate into the "in your wallet" group. The native sentinel is matched
 * case-insensitively for the same reason.
 */
const normalizeAddress = (chainId: ChainId, address: string): string | undefined => {
  if (address.toLowerCase() === ETHER_ADDRESS.toLowerCase()) return ETHER_ADDRESS
  return isAddress(chainId, address) || undefined
}

export const adaptRow = (chainId: ChainId, raw: InventoryRawRow): InventoryRow | undefined => {
  const address = normalizeAddress(chainId, raw.tokenAddress)
  if (!address) return undefined
  return {
    address,
    rawBalance: parseRawAmount(raw.rawAmount),
    blockNumber: raw.blockNumber,
    decimals: raw.decimals,
    symbol: raw.symbol || undefined,
  }
}

/**
 * Every token the wallet holds on one chain, walked to completion by the shared client and adapted
 * to the app's checksummed row shape. Rows the service returns malformed are dropped rather than
 * poisoning the map; zero rows (tombstones) are dropped too, since for a full walk "gone" simply means
 * "not in the result".
 */
export const fetchWalletInventory = async ({
  chainId,
  account,
  signal,
}: {
  chainId: ChainId
  account: string
  signal?: AbortSignal
}): Promise<WalletInventoryResult> => {
  if (!KD_API_URL) throw new Error('wallet inventory host is not configured')
  const { rows: raw, complete } = await walkWalletInventory({ baseUrl: KD_API_URL, chainId, account, signal })

  const rows: InventoryRow[] = []
  let blockNumber = 0
  raw.forEach(candidate => {
    if (!rowSchema.safeParse(candidate).success) return
    const row = adaptRow(chainId, candidate)
    if (!row) return
    blockNumber = Math.max(blockNumber, row.blockNumber)
    if (row.rawBalance > 0n) rows.push(row)
  })

  return { rows, complete, blockNumber }
}
