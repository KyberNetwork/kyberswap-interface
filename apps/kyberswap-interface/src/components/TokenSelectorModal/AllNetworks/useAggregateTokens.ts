import { ChainId, Currency, Token, WETH } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { AggregateBalances, ChainSnapshot } from 'components/TokenSelectorModal/AllNetworks/types'
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

type Props = {
  active: boolean
  networks: TokenSelectorNetwork[]
  activeTab: TokenSelectorTab
  query: string
  sort: TokenSort | null
  filterWrap: boolean
  otherSelectedCurrency?: Currency | null
}

// Fan-out observers usually finish close together. Keep one short window open so
// the aggregate list is recalculated once per window with every received snapshot.
export const AGGREGATE_UPDATE_INTERVAL_MS = 250

export const mergeAggregateTokens = (local: Currency[], remote: Currency[]): Currency[] => {
  const seen = new Set<string>()
  return [...local, ...remote].filter(token => {
    const key = tokenRowKey(token.chainId, getTokenAddress(token))
    if (seen.has(key)) return false
    seen.add(key)
    return true
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

  // Wallet and tab define a data session. Search/focus remain owned by the parent view.
  const identity = `${account ?? ''}:${activeTab}:${chainKey}:${
    isNew || isTrending ? `${sort?.field}:${sort?.dir}` : ''
  }`
  const [observations, setObservations] = useState({
    identity,
    active,
    generation: 0,
    snapshots: {} as Record<number, ChainSnapshot>,
  })
  // Reset the data owner before rendering another wallet/tab. Search and focus stay in the view.
  const current =
    observations.identity === identity && observations.active === active
      ? observations
      : { identity, active, generation: observations.generation + 1, snapshots: {} as Record<number, ChainSnapshot> }
  if (current !== observations) setObservations(current)
  const session = `${current.identity}:${current.generation}`
  const snapshots = current.snapshots

  const pendingRef = useRef<{
    session: string
    snapshots: Map<ChainId, ChainSnapshot>
    timer: ReturnType<typeof setTimeout> | null
  } | null>(null)
  const sessionRef = useRef(session)
  const activeRef = useRef(active)

  const clearPending = useCallback(() => {
    const pending = pendingRef.current
    if (pending?.timer) clearTimeout(pending.timer)
    pendingRef.current = null
  }, [])

  useLayoutEffect(() => {
    sessionRef.current = session
    activeRef.current = active
    clearPending()
    return clearPending
  }, [active, clearPending, session])

  const flushPending = useCallback((sourceSession: string) => {
    const pending = pendingRef.current
    if (!pending || pending.session !== sourceSession) return
    pendingRef.current = null
    if (!activeRef.current || sessionRef.current !== sourceSession) return
    setObservations(previous => {
      if (!previous.active || `${previous.identity}:${previous.generation}` !== sourceSession) return previous
      let snapshotsChanged = false
      const snapshots = { ...previous.snapshots }
      pending.snapshots.forEach((snapshot, chainId) => {
        if (snapshots[chainId] === snapshot) return
        snapshots[chainId] = snapshot
        snapshotsChanged = true
      })
      return snapshotsChanged ? { ...previous, snapshots } : previous
    })
  }, [])

  const onSnapshot = useCallback(
    (sourceSession: string, chainId: ChainId, data: ChainSnapshot) => {
      if (!activeRef.current || sourceSession !== sessionRef.current) return
      const pending = pendingRef.current
      if (!pending || pending.session !== sourceSession) {
        if (pending?.timer) clearTimeout(pending.timer)
        pendingRef.current = { session: sourceSession, snapshots: new Map([[chainId, data]]), timer: null }
      } else {
        pending.snapshots.set(chainId, data)
      }
      const current = pendingRef.current
      if (current && !current.timer) {
        current.timer = setTimeout(() => flushPending(sourceSession), AGGREGATE_UPDATE_INTERVAL_MS)
      }
    },
    [flushPending],
  )

  const needsChainSources = active && !isTrending && !isNew
  const groups = useMemo(
    () =>
      active
        ? chains
            .filter(chainId => needsChainSources || remote.some(token => token.chainId === chainId))
            .map(chainId => ({ chainId, currencies: remote.filter(token => token.chainId === chainId) }))
        : [],
    [active, chains, needsChainSources, remote],
  )
  const resolved = useMemo(
    () => groups.flatMap(({ chainId }) => (snapshots[chainId] ? [snapshots[chainId]] : [])),
    [groups, snapshots],
  )

  const balances = useMemo<AggregateBalances>(
    () => Object.assign({}, ...resolved.map(source => source.balances)),
    [resolved],
  )
  const heldAddresses = useMemo(
    () =>
      isAll && query
        ? new Set(Object.keys(balances).filter(key => balances[key].balance?.greaterThan('0')))
        : undefined,
    [isAll, query, balances],
  )
  const extras = useMemo<TokenRowExtraMap>(
    () =>
      Object.assign(
        {},
        isNew ? recent.extras : isTrending ? trending.extras : {},
        ...resolved.map(source => source.extras),
      ),
    [isNew, recent.extras, isTrending, trending.extras, resolved],
  )

  const currencies = useMemo(() => {
    const combined =
      isTrending || isNew
        ? remote
        : mergeAggregateTokens(
            resolved.flatMap(source => source.currencies),
            isAll ? remote : [],
          )

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
      const balance = balances[tokenRowKey(token.chainId, getTokenAddress(token))]
      return isAll ? balance : { ...balance, favorite: false, unlisted: false }
    })
    if (isAll && query)
      return [...filtered].sort((a, b) => {
        const rank = (token: Currency) => {
          const row = balances[tokenRowKey(token.chainId, getTokenAddress(token))]
          return row?.impersonator ? 2 : row?.balance?.greaterThan('0') ? 0 : 1
        }
        return rank(a) - rank(b)
      })
    if (isAll) return [...filtered].sort(holding)
    if (activeTab === TokenSelectorTab.Imported) return sortTokenMetrics([...filtered].sort(holding), extras, sort)
    return sortTokenMetrics(filtered, extras, sort ?? { field: 'fdv', dir: 'desc' })
  }, [
    isTrending,
    isNew,
    query,
    remote,
    resolved,
    isAll,
    balances,
    activeTab,
    extras,
    sort,
    filterWrap,
    otherSelectedCurrency,
  ])

  const fetchMore = isAll ? catalog.fetchMore : trending.fetchMore
  const hasMore = isAll ? catalog.hasMore : isTrending && trending.hasMore
  const loading =
    (isAll ? catalog.loading : isTrending ? trending.loading : isNew ? recent.loading : false) ||
    (needsChainSources && (resolved.length < groups.length || resolved.some(source => source.loading)))
  const lastPageChains = isAll ? catalog.lastPageChains : trending.lastPageChains
  const pageCount = isAll ? catalog.pageCount : trending.pageCount
  const lastPageFilteredEmpty = !lastPageChains?.some(chainId => chains.includes(chainId))

  // Filtering a complete page must not make the next supported token unreachable.
  useEffect(() => {
    if (active && lastPageFilteredEmpty && hasMore) void fetchMore()
  }, [active, lastPageFilteredEmpty, pageCount, hasMore, fetchMore])

  const handleRowsRendered = useCallback(
    (rows: Currency[]) => {
      const byChain = new Map<ChainId, string[]>()
      rows.forEach(token => {
        if (!balances[tokenRowKey(token.chainId, getTokenAddress(token))]?.unlisted) return
        byChain.set(token.chainId, [...(byChain.get(token.chainId) ?? []), getTokenAddress(token)])
      })
      byChain.forEach((addresses, chainId) => {
        void ensureTokenMetadata(chainId, addresses)
      })
    },
    [balances],
  )

  return {
    session,
    groups,
    onSnapshot,
    needsChainSources,
    needsCatalogPrices: isNew || (isTrending && TRENDING_PRICE_FALLBACK_ENABLED),
    catalogExtras: isNew ? recent.extras : trending.extras,
    visibleCurrencies: currencies,
    balances,
    heldAddresses,
    listExtras: extras,
    isListLoading: active && loading,
    listHasMore: active && !!hasMore,
    handleLoadMore: fetchMore,
    handleRowsRendered,
  }
}
