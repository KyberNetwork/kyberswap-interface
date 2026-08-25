import { ChainId } from '@kyberswap/ks-sdk-core'
import { z } from 'zod'

import { KD_API_URL } from 'constants/env'
import { ETHER_ADDRESS } from 'constants/index'
import { isAddress } from 'utils/address'

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

export class UnsupportedChainError extends Error {
  constructor(chainId: number) {
    super(`kd-api does not index chain ${chainId}`)
    this.name = 'UnsupportedChainError'
  }
}

/** The API caps `limit` at 1000; most wallets fit in a single page at that size. */
const PAGE_SIZE = 1000
/** Safety stop for the cursor walk, far above any real wallet (10k tokens). */
const MAX_PAGES = 10
/**
 * Kept tight because consumers hold their multicall fallback while the first fetch is in flight — a
 * stalled request costs a skeleton, so it must give up quickly rather than politely.
 */
const REQUEST_TIMEOUT_MS = 8_000

const rowSchema = z.object({
  tokenAddress: z.string(),
  // Hex string of the raw on-chain amount. Zero serializes as the empty-body "0x".
  rawAmount: z.string(),
  blockNumber: z.number(),
  // Metadata is omitted per row for tokens the catalog does not know, so all of it is optional.
  decimals: z.number().optional(),
  symbol: z.string().optional(),
})

const responseSchema = z.object({
  code: z.number(),
  message: z.string().optional(),
  // The response also carries a `liveBalances` array for the `liveAddrs` query param, which nothing
  // here requests; zod drops it.
  data: z
    .object({
      balances: z.array(rowSchema).nullish(),
    })
    .nullish(),
})

type RawRow = z.infer<typeof rowSchema>

/**
 * `BigInt('0x')` throws, and "0x" is exactly how the API serializes a zero balance — which is also the
 * tombstone that tells us a token the wallet used to hold is now empty. Everything else is plain hex.
 */
export const parseRawAmount = (value: string): bigint => {
  if (!value || value === '0x' || value === '0X') return 0n
  try {
    return BigInt(value)
  } catch {
    return 0n
  }
}

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

export const adaptRow = (chainId: ChainId, raw: RawRow): InventoryRow | undefined => {
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

const request = async (url: string, chainId: ChainId, lifetime?: AbortSignal) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const onAbort = () => controller.abort()
  lifetime?.addEventListener('abort', onAbort)

  try {
    const response = await fetch(url, { signal: controller.signal })
    // An unindexed chain answers 400 rather than an empty list; the caller turns that into a sticky
    // per-chain disable instead of a retry, so it must not look like a transient failure.
    if (response.status === 400) throw new UnsupportedChainError(chainId)
    if (!response.ok) throw new Error(`kd-api responded ${response.status}`)
    return responseSchema.parse(await response.json())
  } finally {
    clearTimeout(timer)
    lifetime?.removeEventListener('abort', onAbort)
  }
}

const buildUrl = (chainId: ChainId, account: string, cursor?: { block: number; address: string }) => {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE) })
  if (cursor) {
    params.set('sinceBlockNumber', String(cursor.block))
    // Sent back exactly as the API returned it (lowercase): the server compares this cursor as a
    // string, and a checksummed value would order differently and skip rows.
    params.set('lastTokenAddr', cursor.address)
  }
  return `${KD_API_URL}/v1/wallets/${chainId}/${account}/balances?${params.toString()}`
}

/**
 * Every token the wallet holds on one chain, walked to completion.
 *
 * Pagination is a keyset cursor over `(blockNumber, tokenAddress)` ascending. Because a row's
 * `blockNumber` only ever moves forward, anything that changes mid-walk is re-stamped into the range
 * ahead of the cursor: a token that arrives during the walk is still picked up, and a token already
 * collected that changes again simply reappears with a fresher value. Rows are therefore de-duplicated
 * by address keeping the highest block, and zero rows (tombstones) are dropped at the end.
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
  const byAddress = new Map<string, InventoryRow>()
  let cursor: { block: number; address: string } | undefined
  let complete = false

  for (let page = 0; page < MAX_PAGES; page++) {
    const parsed = await request(buildUrl(chainId, account, cursor), chainId, signal)
    if (parsed.code !== 0) throw new Error(parsed.message || 'kd-api returned an error code')

    const batch = parsed.data?.balances ?? []
    batch.forEach(raw => {
      const row = adaptRow(chainId, raw)
      if (!row) return
      const existing = byAddress.get(row.address)
      if (!existing || row.blockNumber >= existing.blockNumber) byAddress.set(row.address, row)
    })

    // A short page means the server has nothing left past the cursor. There is no total count to
    // check against, so this is the only end-of-data signal.
    if (batch.length < PAGE_SIZE) {
      complete = true
      break
    }

    const last = batch[batch.length - 1]
    cursor = { block: last.blockNumber, address: last.tokenAddress }
  }

  const rows: InventoryRow[] = []
  let blockNumber = 0
  byAddress.forEach(row => {
    blockNumber = Math.max(blockNumber, row.blockNumber)
    // A zero row is a tombstone: it exists to say "this token is gone", which for a full walk simply
    // means it does not belong in the result.
    if (row.rawBalance > 0n) rows.push(row)
  })

  return { rows, complete, blockNumber }
}
