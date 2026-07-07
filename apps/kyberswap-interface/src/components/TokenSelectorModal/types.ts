import { ChainId } from '@kyberswap/ks-sdk-core'

/** Extra per-row metadata shown next to a token depending on the active tab. */
export type TokenRowExtra = {
  /** Current USD price, from the token-catalog `metrics.price` field. */
  price?: number
  /** 24h price change, as a percentage (e.g. 1.25 = +1.25%), from `metrics.priceChange24h`. */
  priceChange24h?: number
  /** 24h trading volume on KyberSwap, in USD. */
  volume24h?: number
  /** Unix seconds the token was whitelisted / added (New tab). */
  addedAt?: number
}

/** Map of `${chainId}-${address}` → extra row metadata. */
export type TokenRowExtraMap = Record<string, TokenRowExtra>

export const tokenRowKey = (chainId: number | ChainId, address: string): string => `${chainId}-${address.toLowerCase()}`

/**
 * Column the list is sorted by. `priceChange24h` applies to every discovery tab; `volume24h`
 * only to Trending. Trending resolves it to a server-side `sort` param; New / Imported / Favorites
 * sort in-memory. A `null` sort means the tab's natural order (KyberScore / newest / balance).
 */
export type TokenSortField = 'priceChange24h' | 'volume24h'
export type TokenSort = { field: TokenSortField; dir: 'asc' | 'desc' }
