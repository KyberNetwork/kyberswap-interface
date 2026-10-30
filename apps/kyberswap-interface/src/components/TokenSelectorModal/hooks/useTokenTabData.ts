import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { useCallback, useMemo } from 'react'

import { TRENDING_PRICE_FALLBACK_ENABLED, TokenSelectorTab } from 'components/TokenSelectorModal/constants'
import { useCatalogPriceFallback } from 'components/TokenSelectorModal/hooks/useCatalogPriceFallback'
import { useNewTokens } from 'components/TokenSelectorModal/hooks/useNewTokens'
import { useTokensMetrics } from 'components/TokenSelectorModal/hooks/useTokensMetrics'
import { useTrendingTokens } from 'components/TokenSelectorModal/hooks/useTrendingTokens'
import { TokenRowExtraMap, TokenSearchFilters, TokenSort, tokenRowKey } from 'components/TokenSelectorModal/types'
import { useTokenPrices } from 'state/tokenPrices/hooks'

const EMPTY_CURRENCIES: Currency[] = []
const EMPTY_ADDRESSES: string[] = []
const EMPTY_EXTRAS: TokenRowExtraMap = {}

// Resolves lists and metrics for Trending, New, Imported, and Favorites; All is composed by the caller.
type Props = {
  searchFilters?: TokenSearchFilters
  primaryChainId: ChainId
  activeTab: TokenSelectorTab
  sort: TokenSort | null
  localFilter: (tokens: Currency[]) => Currency[]
  importedCurrenciesBase: Currency[]
  favoriteCurrenciesBase: Currency[]
}

export const useTokenTabData = ({
  searchFilters,
  primaryChainId,
  activeTab,
  sort,
  localFilter,
  importedCurrenciesBase,
  favoriteCurrenciesBase,
}: Props) => {
  const chainIdList = useMemo(() => [primaryChainId], [primaryChainId])
  const isTrendingTab = activeTab === TokenSelectorTab.Trending
  const isNewTab = activeTab === TokenSelectorTab.New
  const isImportedTab = activeTab === TokenSelectorTab.Imported
  const isFavoritesTab = activeTab === TokenSelectorTab.Favorites

  const {
    tokens: trendingTokens,
    extras: trendingExtras,
    loading: trendingLoading,
    hasMore: trendingHasMore,
    fetchMore: fetchMoreTrending,
  } = useTrendingTokens(primaryChainId, isTrendingTab ? sort : null, isTrendingTab, searchFilters)

  const {
    tokens: newTokens,
    extras: newExtras,
    loading: newLoading,
  } = useNewTokens(chainIdList, isNewTab ? sort : null, isNewTab, searchFilters)

  // Trending is already ordered server-side; the others keep their own natural order until sorted.
  const trendingCurrencies = useMemo(() => localFilter(trendingTokens), [localFilter, trendingTokens])
  const newCurrenciesBase = useMemo(() => localFilter(newTokens), [localFilter, newTokens])

  // Price / 24h-change metrics for the local-sourced tabs (Imported / Favorites); Trending and New
  // already carry metrics from their own catalog fetch.
  const metricsSource = isImportedTab
    ? importedCurrenciesBase
    : isFavoritesTab
    ? favoriteCurrenciesBase
    : EMPTY_CURRENCIES
  const metricsExtras = useTokensMetrics(metricsSource, primaryChainId)

  // Imported and Favorites take their price from the live prices endpoint (buy/sell mid — the same
  // source the All tab and the wallet-value sort use, so a token reads the same on every tab), while
  // 24h change / volume / FDV stay from the tokens-list metrics.
  const localPriceAddresses = useMemo(
    () => (metricsSource.length ? metricsSource.map(currency => currency.wrapped.address) : EMPTY_ADDRESSES),
    [metricsSource],
  )
  const localPrices = useTokenPrices(localPriceAddresses, primaryChainId)
  const localExtras = useMemo<TokenRowExtraMap>(() => {
    const result: TokenRowExtraMap = {}
    metricsSource.forEach(currency => {
      const key = tokenRowKey(currency.chainId, currency.wrapped.address)
      const livePrice = localPrices[currency.wrapped.address.toLowerCase()]
      result[key] = { ...metricsExtras[key], price: livePrice || metricsExtras[key]?.price }
    })
    return result
  }, [metricsSource, localPrices, metricsExtras])

  // Both catalog-sourced tabs can come back short of `metrics.price` (Robinhood especially), so top
  // their rows up from the live prices endpoint — on Trending only while TRENDING_PRICE_FALLBACK_ENABLED.
  const newExtrasWithPrice = useCatalogPriceFallback(newCurrenciesBase, newExtras, primaryChainId, isNewTab)
  const trendingExtrasWithPrice = useCatalogPriceFallback(
    trendingCurrencies,
    trendingExtras,
    primaryChainId,
    isTrendingTab && TRENDING_PRICE_FALLBACK_ENABLED,
  )

  const listExtras: TokenRowExtraMap = useMemo(() => {
    if (isTrendingTab) return trendingExtrasWithPrice
    if (isNewTab) return newExtrasWithPrice
    if (isImportedTab || isFavoritesTab) return localExtras
    return EMPTY_EXTRAS
  }, [isTrendingTab, isNewTab, isImportedTab, isFavoritesTab, trendingExtrasWithPrice, newExtrasWithPrice, localExtras])

  // In-memory metric sort for the Imported / Favorites tabs, whose only sortable column is "Price &
  // 24h change" (Trending and New sort server-side). Rows are tiered so those missing the sorted
  // metric always sink to the very bottom regardless of direction; for 24h change, priced-but-no-change
  // rows sit above no-price rows.
  const sortByMetric = useCallback(
    (list: Currency[]): Currency[] => {
      if (!sort) return list
      const field = sort.field
      const dir = sort.dir === 'asc' ? 1 : -1
      const extraOf = (currency: Currency) => listExtras[tokenRowKey(currency.chainId, currency.wrapped.address)]
      const rankOf = (currency: Currency): number => {
        const extra = extraOf(currency)
        if (field !== 'priceChange24h') return extra?.[field] !== undefined ? 0 : 1
        if (extra?.priceChange24h !== undefined) return 0
        if (extra?.price) return 1
        return 2
      }
      return [...list].sort((a, b) => {
        const ra = rankOf(a)
        const rb = rankOf(b)
        if (ra !== rb) return ra - rb
        if (ra !== 0) return 0
        const va = extraOf(a)?.[field] ?? 0
        const vb = extraOf(b)?.[field] ?? 0
        return (va - vb) * dir
      })
    },
    [sort, listExtras],
  )

  // The Favorites tab's natural order is descending FDV; tokens with no FDV sink to the bottom.
  const sortByFdv = useCallback(
    (list: Currency[]): Currency[] => {
      const fdvOf = (currency: Currency) => listExtras[tokenRowKey(currency.chainId, currency.wrapped.address)]?.fdv
      return [...list].sort((a, b) => {
        const ca = fdvOf(a)
        const cb = fdvOf(b)
        if (ca === undefined && cb === undefined) return 0
        if (ca === undefined) return 1
        if (cb === undefined) return -1
        return cb - ca
      })
    },
    [listExtras],
  )

  const currencies = useMemo(() => {
    switch (activeTab) {
      case TokenSelectorTab.Trending:
        return trendingCurrencies
      case TokenSelectorTab.New:
        return newCurrenciesBase
      case TokenSelectorTab.Imported:
        return sortByMetric(importedCurrenciesBase)
      case TokenSelectorTab.Favorites:
        return sort ? sortByMetric(favoriteCurrenciesBase) : sortByFdv(favoriteCurrenciesBase)
      default:
        return EMPTY_CURRENCIES
    }
  }, [
    activeTab,
    trendingCurrencies,
    newCurrenciesBase,
    importedCurrenciesBase,
    favoriteCurrenciesBase,
    sort,
    sortByMetric,
    sortByFdv,
  ])

  return {
    currencies,
    extras: listExtras,
    loading:
      (isNewTab && newLoading && !newTokens.length) || (isTrendingTab && trendingLoading && !trendingTokens.length),
    hasMore: isTrendingTab && trendingHasMore,
    fetchMore: fetchMoreTrending,
  }
}
