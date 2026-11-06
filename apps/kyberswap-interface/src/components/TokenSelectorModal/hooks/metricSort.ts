import { Currency } from '@kyberswap/ks-sdk-core'

import { TokenRowExtraMap, TokenSort, tokenRowKey } from 'components/TokenSelectorModal/types'

export const sortTokenMetrics = (tokens: Currency[], extras: TokenRowExtraMap, sort: TokenSort | null): Currency[] => {
  if (!sort) return tokens
  const extraOf = (token: Currency) => extras[tokenRowKey(token.chainId, token.wrapped.address)]
  const rank = (token: Currency) => {
    const extra = extraOf(token)
    if (extra?.[sort.field] !== undefined) return 0
    return sort.field === 'priceChange24h' && extra?.price ? 1 : 2
  }

  return [...tokens].sort((a, b) => {
    const rankA = rank(a)
    const rankB = rank(b)
    if (rankA !== rankB) return rankA - rankB
    if (rankA !== 0) return 0
    return ((extraOf(a)?.[sort.field] ?? 0) - (extraOf(b)?.[sort.field] ?? 0)) * (sort.dir === 'asc' ? 1 : -1)
  })
}
