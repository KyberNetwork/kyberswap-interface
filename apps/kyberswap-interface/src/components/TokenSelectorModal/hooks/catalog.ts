import { TokenCatalogListToken } from 'services/tokenCatalog'

import { TokenRowExtra, TokenRowExtraMap, tokenRowKey } from 'components/TokenSelectorModal/types'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

/** Adapt a raw token-catalog list token into the app's `WrappedTokenInfo`. */
export const catalogTokenToWrapped = (t: TokenCatalogListToken): WrappedTokenInfo | undefined => {
  try {
    return new WrappedTokenInfo({
      chainId: Number(t.chainId),
      address: t.address,
      name: t.name,
      decimals: t.decimals,
      symbol: t.symbol,
      logoURI: t.logoURL,
      isWhitelisted: t.isWhitelisted,
      isStable: t.isStable,
      isStandardERC20: t.isStandardERC20,
      cmcRank: t.cmcRank,
    })
  } catch {
    return undefined
  }
}

/** Pull the price / 24h-change / volume row metadata out of a catalog token's `metrics`. */
export const catalogMetricsToExtra = (t: TokenCatalogListToken): TokenRowExtra => ({
  price: t.metrics?.price,
  priceChange24h: t.metrics?.priceChange24h ?? undefined,
  volume24h: t.metrics?.stats24h?.volume24h,
})

/**
 * Adapt a flat list of raw catalog tokens into `{ tokens, extras }`, skipping tokens that fail to
 * wrap and de-duplicating by `${chainId}-${address}` (paginated feeds can repeat a token across
 * pages when server-side ranking shifts). `extraFor` overrides the per-token extra (e.g. to add the
 * New tab's `addedAt`); it defaults to `catalogMetricsToExtra`.
 */
export const mapCatalogTokens = (
  raw: TokenCatalogListToken[],
  extraFor: (t: TokenCatalogListToken) => TokenRowExtra = catalogMetricsToExtra,
): { tokens: WrappedTokenInfo[]; extras: TokenRowExtraMap } => {
  const tokens: WrappedTokenInfo[] = []
  const extras: TokenRowExtraMap = {}
  const seen = new Set<string>()
  raw.forEach(t => {
    const token = catalogTokenToWrapped(t)
    if (!token) return
    const key = tokenRowKey(token.chainId, token.address)
    if (seen.has(key)) return
    seen.add(key)
    tokens.push(token)
    extras[key] = extraFor(t)
  })
  return { tokens, extras }
}
