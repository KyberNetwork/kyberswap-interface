import { ChainId, Currency, Token, WETH } from '@kyberswap/ks-sdk-core'
import { replaceEqualDeep } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { useAggregateSnapshot } from 'components/TokenSelectorModal/AllNetworks/useAggregateSnapshot'
import { useAllNetworksTokens } from 'components/TokenSelectorModal/AllNetworks/useAllNetworksTokens'
import { TRENDING_PRICE_FALLBACK_ENABLED, TokenSelectorTab } from 'components/TokenSelectorModal/constants'
import { getHoldingComparator } from 'components/TokenSelectorModal/hooks/holdingSort'
import { sortTokenMetrics } from 'components/TokenSelectorModal/hooks/metricSort'
import { useNewTokens } from 'components/TokenSelectorModal/hooks/useNewTokens'
import { useTrendingTokens } from 'components/TokenSelectorModal/hooks/useTrendingTokens'
import { TokenRowExtraMap, TokenSelectorNetwork, TokenSort, tokenRowKey } from 'components/TokenSelectorModal/types'
import { useEvmBalanceAccount } from 'state/wallet/WalletBalanceContext'
import { ensureTokenMetadata } from 'state/walletInventory/metadata'
import { filterTokens } from 'utils/filtering'
import { getTokenAddress, isTokenNative } from 'utils/tokenInfo'

const EMPTY_EXTRAS: TokenRowExtraMap = {}

type Props = {
  active: boolean
  networks: TokenSelectorNetwork[]
  activeTab: TokenSelectorTab
  query: string
  sort: TokenSort | null
  filterWrap: boolean
  otherSelectedCurrency?: Currency | null
}

export const mergeAggregateTokens = (local: Currency[], remote: Currency[]): Currency[] => {
  const keyOf = (token: Currency) => tokenRowKey(token.chainId, getTokenAddress(token))
  const localByKey = new Map(local.map(token => [keyOf(token), token]))
  const seen = new Set<string>()

  // Catalog owns order; local tokens retain execution metadata (including permit fields).
  return [...remote, ...local].flatMap(token => {
    const key = keyOf(token)
    if (seen.has(key)) return []
    seen.add(key)
    return [localByKey.get(key) ?? token]
  })
}

export const useAggregateTokens = ({
  active,
  networks,
  activeTab,
  query: searchQuery,
  sort,
  filterWrap,
  otherSelectedCurrency,
}: Props) => {
  const query = searchQuery.trim()
  const account = useEvmBalanceAccount()

  const chainKey = networks
    .filter(network => typeof network.chainId === 'number')
    .map(network => network.chainId)
    .sort()
    .join(',')
  const chains = useMemo(() => chainKey.split(',').filter(Boolean).map(Number) as ChainId[], [chainKey])

  const isAll = activeTab === TokenSelectorTab.All
  const isTrending = activeTab === TokenSelectorTab.Trending
  const isNew = activeTab === TokenSelectorTab.New

  const catalog = useAllNetworksTokens({ active: active && isAll, query })
  const trending = useTrendingTokens(undefined, sort, active && isTrending)
  const recent = useNewTokens(undefined, sort, active && isNew)

  const remote = useMemo(
    () =>
      (isAll ? catalog.currencies : isTrending ? trending.tokens : isNew ? recent.tokens : []).filter(token =>
        chains.includes(token.chainId),
      ),
    [isAll, catalog.currencies, isTrending, trending.tokens, isNew, recent.tokens, chains],
  )

  const catalogLoading = isAll ? catalog.loading : isTrending ? trending.loading : isNew ? recent.loading : false
  const sourceCatalog = useMemo(
    () => ({
      currencies: remote,
      extras: isNew ? recent.extras : isTrending ? trending.extras : EMPTY_EXTRAS,
      loading: catalogLoading,
    }),
    [remote, isNew, recent.extras, isTrending, trending.extras, catalogLoading],
  )

  const needsChainSources = active && !isTrending && !isNew

  // Wallet and tab define a data session. Search/focus remain owned by the parent view.
  const identity = `${account ?? ''}:${activeTab}:${chainKey}:${
    isNew || isTrending ? `${sort?.field}:${sort?.dir}` : ''
  }`
  const snapshot = useAggregateSnapshot({
    identity,
    catalogKey: isAll ? query : '',
    active,
    catalog: sourceCatalog,
  })
  const { session, onSnapshot, balances, holdings, extras } = snapshot

  const groups = useMemo(
    () =>
      active
        ? chains
            .filter(chainId => needsChainSources || remote.some(token => token.chainId === chainId))
            .map(chainId => ({ chainId, currencies: remote.filter(token => token.chainId === chainId) }))
        : [],
    [active, chains, needsChainSources, remote],
  )

  const heldAddresses = useMemo(
    () =>
      isAll && query
        ? new Set(Object.keys(holdings).filter(key => holdings[key].balance?.greaterThan('0')))
        : undefined,
    [isAll, query, holdings],
  )

  const currencies = useMemo(() => {
    const combined =
      isTrending || isNew ? snapshot.remote : mergeAggregateTokens(snapshot.local, isAll ? snapshot.remote : [])

    // All aggregate tabs share one final eligibility/search pass, after local and remote sources merge.
    const filtered = combined.filter(token => {
      if (query && !filterTokens(token.chainId, [token as Token], query).length) return false
      if (!filterWrap || !otherSelectedCurrency || token.chainId !== otherSelectedCurrency.chainId) return true

      const wrapped = WETH[token.chainId]
      return (
        !wrapped ||
        !(
          (otherSelectedCurrency.equals(wrapped) && isTokenNative(token)) ||
          (isTokenNative(otherSelectedCurrency) && token.equals(wrapped))
        )
      )
    })

    if (isTrending || isNew) return filtered

    const holding = getHoldingComparator(token => {
      const balance = holdings[tokenRowKey(token.chainId, getTokenAddress(token))]
      return isAll ? balance : { ...balance, favorite: false, unlisted: false }
    })

    if (isAll && query)
      return [...filtered].sort((a, b) => {
        const rank = (token: Currency) => {
          const row = holdings[tokenRowKey(token.chainId, getTokenAddress(token))]
          return row?.impersonator ? 2 : row?.balance?.greaterThan('0') ? 0 : 1
        }
        return rank(a) - rank(b)
      })

    if (isAll) {
      const values = new Map(
        filtered.map(token => {
          const row = holdings[tokenRowKey(token.chainId, getTokenAddress(token))]
          const value = Number(row?.balance?.toExact() ?? 0) * (row?.price ?? 0)
          return [token, Number.isFinite(value) && value > 0 ? value : 0] as const
        }),
      )
      // Stable sort retains API market-cap order for equal/unavailable wallet values.
      return [...filtered].sort((a, b) => (values.get(b) ?? 0) - (values.get(a) ?? 0))
    }
    if (activeTab === TokenSelectorTab.Imported) return sortTokenMetrics([...filtered].sort(holding), extras, sort)

    return sortTokenMetrics(filtered, extras, sort ?? { field: 'fdv', dir: 'desc' })
  }, [
    isTrending,
    isNew,
    query,
    snapshot.remote,
    snapshot.local,
    isAll,
    holdings,
    activeTab,
    extras,
    sort,
    filterWrap,
    otherSelectedCurrency,
  ])

  // Value-only updates keep the list's order reference, avoiding virtual-list offset work.
  const [previousCurrencies, setPreviousCurrencies] = useState(currencies)
  const stableCurrencies = replaceEqualDeep(previousCurrencies, currencies)
  if (stableCurrencies !== previousCurrencies) setPreviousCurrencies(stableCurrencies)

  const loading =
    catalogLoading ||
    snapshot.catalogLoading ||
    (needsChainSources && (snapshot.resolvedCount < groups.length || snapshot.pending))

  const fetchMore = isAll ? catalog.fetchMore : trending.fetchMore
  const hasMore = isAll ? catalog.hasMore : isTrending && trending.hasMore
  const lastPageChains = isAll ? catalog.lastPageChains : trending.lastPageChains
  const pageCount = isAll ? catalog.pageCount : trending.pageCount
  const lastPageTokens = isAll ? catalog.lastPageTokens : trending.lastPageTokens
  const lastPageFilteredEmpty =
    !lastPageChains?.some(chainId => chains.includes(chainId)) ||
    (!!query &&
      !!lastPageTokens &&
      !lastPageTokens.some(
        token => chains.includes(token.chainId) && filterTokens(token.chainId, [token], query).length > 0,
      ))

  const handleRowsRendered = useCallback(
    (rows: Currency[]) => {
      const byChain = new Map<ChainId, string[]>()
      rows.forEach(token => {
        if (!holdings[tokenRowKey(token.chainId, getTokenAddress(token))]?.unlisted) return
        byChain.set(token.chainId, [...(byChain.get(token.chainId) ?? []), getTokenAddress(token)])
      })

      byChain.forEach((addresses, chainId) => {
        void ensureTokenMetadata(chainId, addresses)
      })
    },
    [holdings],
  )

  // InfiniteLoader cannot advance when filtering leaves the same empty visible range.
  // Keep paging after publication until a match appears or the source is exhausted.
  const needsNextPage = lastPageFilteredEmpty || (!loading && stableCurrencies.length === 0)
  useEffect(() => {
    if (active && needsNextPage && hasMore) void fetchMore()
  }, [active, needsNextPage, pageCount, hasMore, fetchMore])

  return {
    session,
    groups,
    onSnapshot,
    needsChainSources,
    needsCatalogPrices: isNew || (isTrending && TRENDING_PRICE_FALLBACK_ENABLED),
    catalogExtras: isNew ? recent.extras : trending.extras,
    visibleCurrencies: stableCurrencies,
    balances,
    heldAddresses,
    listExtras: extras,
    isListLoading: active && loading,
    listHasMore: active && !!hasMore,
    handleLoadMore: fetchMore,
    handleRowsRendered,
  }
}
