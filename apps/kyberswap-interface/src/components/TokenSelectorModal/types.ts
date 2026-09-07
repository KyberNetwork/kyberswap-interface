import { ChainId } from '@kyberswap/ks-sdk-core'

/** Extra per-row metadata shown next to a token depending on the active tab. */
export type TokenRowExtra = {
  /** Current USD price, from the token-catalog `metrics.price` field. */
  price?: number
  /** 24h price change, as a percentage (e.g. 1.25 = +1.25%), from `metrics.priceChange24h`. */
  priceChange24h?: number
  /** 24h trading volume on KyberSwap, in USD. */
  volume24h?: number
  /** Market capitalization, in USD, from the catalog's `metrics.marketCap` or top-level `marketCap`. */
  marketCap?: number
  /** Unix seconds the token was whitelisted (New tab age badge; falls back to creation time). */
  addedAt?: number
}

/** Map of `${chainId}-${address}` → extra row metadata. */
export type TokenRowExtraMap = Record<string, TokenRowExtra>

export const tokenRowKey = (chainId: number | ChainId, address: string): string => `${chainId}-${address.toLowerCase()}`

/**
 * Column the list is sorted by. `priceChange24h` (the "Price & 24h change" column) applies to every
 * discovery tab; `volume24h` / `marketCap` are the two metrics the Trending and New tabs' switchable
 * third column can show. Trending and New resolve every field to a server-side `sort` param (the
 * values match the catalog API's own field names); Imported / Favorites sort in-memory. A `null` sort
 * means the tab's natural order (KyberScore / newest / balance).
 */
export type TokenSortField = 'priceChange24h' | 'volume24h' | 'marketCap'
export type TokenSort = { field: TokenSortField; dir: 'asc' | 'desc' }

/** Which metric the Trending / New tabs' third column shows, picked with its VOL / MCAP switch. */
export type TokenMetricColumn = Extract<TokenSortField, 'volume24h' | 'marketCap'>

export const TOKEN_METRIC_COLUMNS: TokenMetricColumn[] = ['volume24h', 'marketCap']
