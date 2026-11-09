import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { useCallback, useMemo } from 'react'

import { TRENDING_PRICE_FALLBACK_ENABLED, TokenSelectorTab } from 'components/TokenSelectorModal/constants'
import { sortTokenMetrics } from 'components/TokenSelectorModal/hooks/metricSort'
import { useCatalogPriceFallback } from 'components/TokenSelectorModal/hooks/useCatalogPriceFallback'
import { useLocalTokenMetrics } from 'components/TokenSelectorModal/hooks/useLocalTokenMetrics'
import { useNewTokens } from 'components/TokenSelectorModal/hooks/useNewTokens'
import { useTrendingTokens } from 'components/TokenSelectorModal/hooks/useTrendingTokens'
import { TokenRowExtraMap, TokenSearchFilters, TokenSort } from 'components/TokenSelectorModal/types'

const EMPTY_CURRENCIES: Currency[] = []
const EMPTY_EXTRAS: TokenRowExtraMap = {}

// Resolves lists and metrics for Trending, New, Imported, and Favorites; All is composed by the caller.
type Props = {
  enabled?: boolean
  searchFilters?: TokenSearchFilters
  primaryChainId: ChainId
  activeTab: TokenSelectorTab
  sort: TokenSort | null
  localFilter: (tokens: Currency[]) => Currency[]
  importedCurrenciesBase: Currency[]
  favoriteCurrenciesBase: Currency[]
}

export const useTokenTabData = ({
  enabled = true,
  searchFilters,
  primaryChainId,
  activeTab,
  sort,
  localFilter,
  importedCurrenciesBase,
  favoriteCurrenciesBase,
}: Props) => {
  const chainIdList = useMemo(() => [primaryChainId], [primaryChainId])

  const isTrendingTab = enabled && activeTab === TokenSelectorTab.Trending
  const isNewTab = enabled && activeTab === TokenSelectorTab.New
  const isImportedTab = enabled && activeTab === TokenSelectorTab.Imported
  const isFavoritesTab = enabled && activeTab === TokenSelectorTab.Favorites

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
  const localExtras = useLocalTokenMetrics(metricsSource, primaryChainId)

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

  const sortByMetric = useCallback((list: Currency[]) => sortTokenMetrics(list, listExtras, sort), [listExtras, sort])
  const sortByFdv = useCallback(
    (list: Currency[]) => sortTokenMetrics(list, listExtras, { field: 'fdv', dir: 'desc' }),
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
