import { ChainId, Currency, Token, WETH } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useInfiniteQuery } from '@tanstack/react-query'
import { motion, useAnimationControls, useReducedMotion } from 'framer-motion'
import {
  ChangeEvent,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { isMobile } from 'react-device-detect'
import { X } from 'react-feather'
import { useMedia } from 'react-use'

import InfoHelper from 'components/InfoHelper'
import Loader from 'components/Loader'
import { HStack, Stack } from 'components/Stack'
import { ChainSelector } from 'components/TokenSelectorModal/ChainSelector'
import { OtherChainTokens } from 'components/TokenSelectorModal/OtherChainTokens'
import { PinnedTokens } from 'components/TokenSelectorModal/PinnedTokens'
import { SwitchChainModal } from 'components/TokenSelectorModal/SwitchChainModal'
import { TabBar, getTabSubtitle } from 'components/TokenSelectorModal/TabBar'
import TokenList from 'components/TokenSelectorModal/TokenList'
import { TokenListSkeleton } from 'components/TokenSelectorModal/TokenListSkeleton'
import {
  ContentWrapper,
  PaddedColumn,
  SearchIcon,
  SearchInput,
  SearchWrapper,
} from 'components/TokenSelectorModal/components'
import {
  TOKEN_SELECTOR_TAB_ORDER,
  TokenSelectorTab,
  isTrendingSupportedChain,
} from 'components/TokenSelectorModal/constants'
import { useNewTokens } from 'components/TokenSelectorModal/hooks/useNewTokens'
import { usePendingCrossChainSelect } from 'components/TokenSelectorModal/hooks/usePendingCrossChainSelect'
import { useTokensMetrics } from 'components/TokenSelectorModal/hooks/useTokensMetrics'
import { useTrendingTokens } from 'components/TokenSelectorModal/hooks/useTrendingTokens'
import { TokenRowExtraMap, TokenSort, TokenSortField, tokenRowKey } from 'components/TokenSelectorModal/types'
import {
  TOKEN_SEARCH_PAGE_SIZE,
  fetchTokens,
  getNeedsImport,
  useAddressRpcTokenSearch,
  useTokenComparator,
} from 'components/TokenSelectorModal/utils'
import { MouseoverTooltip } from 'components/Tooltip'
import { NETWORKS_INFO } from 'constants/networks'
import { Z_INDEXS } from 'constants/styles'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import useChainsConfig from 'hooks/useChainsConfig'
import useDebounce from 'hooks/useDebounce'
import { useIsTokenRestricted, useNotifyRestrictedToken } from 'hooks/useRestrictedTokens'
import { fetchListTokenByAddresses, useAllTokens } from 'hooks/useTokens'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import SortIcon, { Direction } from 'pages/MarketOverview/SortIcon'
import { useRemoveUserAddedToken, useUserAddedTokens, useUserFavoriteTokens } from 'state/user/hooks'
import { CloseIcon, MEDIA_WIDTHS } from 'theme'
import { filterTruthy, isAddress } from 'utils'
import { cn } from 'utils/cn'
import { filterTokens } from 'utils/filtering'
import { isTokenNative } from 'utils/tokenInfo'

interface TokenSelectorContentProps {
  isOpen: boolean
  onDismiss?: () => void
  selectedCurrency?: Currency | null
  onCurrencySelect?: (currency: Currency) => void
  otherSelectedCurrency?: Currency | null
  showPinnedTokens?: boolean
  onImportToken?: (token: Token) => void
  customChainId?: ChainId
  filterWrap?: boolean
  title?: string
  tooltip?: ReactNode
  trackingSource?: string
  onShowTokenInfo?: (token: Token) => void
}

const NoResult = ({ message }: { message?: ReactNode }) => {
  return (
    <Stack className="h-full p-5" data-testid="no-token-result">
      <p className="text-center font-medium text-text3">{message || <Trans>No results found.</Trans>}</p>
    </Stack>
  )
}

const SearchLoading = () => (
  <Stack className="h-full items-center gap-3 p-5 pt-8" data-testid="token-search-loading">
    <Loader size="24px" />
    <p className="text-center font-medium text-text3">
      <Trans>Loading...</Trans>
    </p>
  </Stack>
)

// Stable empty list so `useTokensMetrics` doesn't refetch on tabs that don't need metrics.
const EMPTY_CURRENCIES: Currency[] = []
// Stable empty extras so the All tab's `listExtras` keeps the same reference and doesn't re-render
// the list every time a background discovery query (trending / new / metrics) resolves.
const EMPTY_EXTRAS: TokenRowExtraMap = {}

// Map the internal sort direction to the shared SortIcon's Direction enum.
const toDirection = (dir: 'asc' | 'desc'): Direction => (dir === 'asc' ? Direction.ASC : Direction.DESC)

// A clickable, sortable column header (Price & 24h change, Volume) with the shared pool-list sort arrows.
const SortHeader = ({
  label,
  field,
  sort,
  onSort,
  className,
}: {
  label: ReactNode
  field: TokenSortField
  sort: TokenSort | null
  onSort: (field: TokenSortField) => void
  className?: string
}) => (
  <button
    type="button"
    data-testid={`sort-header-${field}`}
    onClick={() => onSort(field)}
    className={cn(
      'flex shrink-0 items-center justify-end gap-1 whitespace-nowrap uppercase transition-colors hover:text-text',
      className ?? 'w-[72px] sm:w-[104px]',
    )}
  >
    {label}
    <SortIcon sorted={sort?.field === field ? toDirection(sort.dir) : undefined} />
  </button>
)

export const TokenSelectorContent = ({
  selectedCurrency,
  onCurrencySelect,
  otherSelectedCurrency,
  showPinnedTokens,
  onDismiss,
  isOpen,
  onImportToken,
  customChainId,
  filterWrap = false,
  title,
  tooltip,
  trackingSource,
  onShowTokenInfo,
}: TokenSelectorContentProps) => {
  const { chainId: web3ChainId, account } = useActiveWeb3React()
  const anchorChainId = customChainId || web3ChainId
  const { supportedChains } = useChainsConfig()
  const { trackingHandler } = useTracking()
  const removeToken = useRemoveUserAddedToken()
  const isTokenRestricted = useIsTokenRestricted()
  const notifyRestrictedToken = useNotifyRestrictedToken()

  const [selectedChainId, setSelectedChainId] = useState<ChainId>(anchorChainId)
  const primaryChainId = selectedChainId
  const chainIdList = useMemo(() => [selectedChainId], [selectedChainId])
  const trendingSupported = isTrendingSupportedChain(primaryChainId)

  const visibleTabs = useMemo(
    () => TOKEN_SELECTOR_TAB_ORDER.filter(tab => tab !== TokenSelectorTab.Trending || trendingSupported),
    [trendingSupported],
  )
  const defaultTab = account
    ? TokenSelectorTab.All
    : trendingSupported
    ? TokenSelectorTab.Trending
    : TokenSelectorTab.All

  const [activeTab, setActiveTab] = useState<TokenSelectorTab>(defaultTab)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [pinnedTokens, setPinnedTokens] = useState<(Token | Currency)[]>([])
  const [switchChainToken, setSwitchChainToken] = useState<Currency | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const listTokenRef = useRef<HTMLDivElement>(null)

  const { favoriteTokens, toggleFavoriteToken } = useUserFavoriteTokens(primaryChainId)
  const debouncedQuery = useDebounce(searchQuery, 200)
  const trackingDebouncedQuery = useDebounce(searchQuery, 1000)
  const isQueryValidEVMAddress = !!isAddress(primaryChainId, debouncedQuery)

  const isAllTab = activeTab === TokenSelectorTab.All
  const isImportedTab = activeTab === TokenSelectorTab.Imported
  const isTrendingTab = activeTab === TokenSelectorTab.Trending
  const isNewTab = activeTab === TokenSelectorTab.New
  const isFavoritesTab = activeTab === TokenSelectorTab.Favorites
  // The narrower mobile modal fits one fewer quick-select pill per row.
  const isMobileWidth = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  // Column sort. Trending and New resolve it server-side (24h change / volume); Imported / Favorites
  // sort by 24h change in-memory. `null` = the tab's natural order. Cleared on tab / chain change.
  const [sort, setSort] = useState<TokenSort | null>(null)
  const listAnimation = useAnimationControls()
  const prefersReducedMotion = useReducedMotion()
  // Flagged when the user clicks a sort header so the list can crossfade exactly when the re-sorted
  // rows commit — which is the same tick for in-memory sorts and a later tick for Trending's async
  // server re-fetch.
  const pendingSortAnim = useRef(false)
  const cycleSort = useCallback((field: TokenSortField) => {
    pendingSortAnim.current = true
    setSort(prev => {
      if (!prev || prev.field !== field) return { field, dir: 'desc' }
      if (prev.dir === 'desc') return { field, dir: 'asc' }
      return null
    })
  }, [])

  const defaultTokens = useAllTokens(false, primaryChainId)
  const tokenImports = useUserAddedTokens(primaryChainId)
  // Only the All (default order) and Imported tabs sort by wallet value; gate the comparator so the
  // rest never register its whole-whitelist balanceOf multicall + /prices fetch.
  const needsComparator = (isAllTab && !debouncedQuery) || isImportedTab
  // On the All tab, favorites float above non-favorites (but only after wallet value / balance).
  const favoriteAddressSet = useMemo(() => new Set(favoriteTokens ?? []), [favoriteTokens])
  const tokenComparator = useTokenComparator(
    false,
    primaryChainId,
    needsComparator,
    isAllTab ? favoriteAddressSet : undefined,
  )

  const {
    tokens: trendingTokens,
    extras: trendingExtras,
    loading: trendingLoading,
    hasMore: trendingHasMore,
    fetchMore: fetchMoreTrending,
  } = useTrendingTokens(primaryChainId, isTrendingTab ? sort : null, isTrendingTab)
  const {
    tokens: newTokens,
    extras: newExtras,
    loading: newLoading,
  } = useNewTokens(chainIdList, isNewTab ? sort : null, isNewTab)

  const filterWrapFunc = useCallback(
    (token: Currency | undefined) => {
      if (filterWrap && otherSelectedCurrency?.equals(WETH[primaryChainId])) {
        return !isTokenNative(token)
      }
      if (filterWrap && otherSelectedCurrency && isTokenNative(otherSelectedCurrency)) {
        return !token?.equals(WETH[primaryChainId])
      }
      return true
    },
    [primaryChainId, otherSelectedCurrency, filterWrap],
  )

  const {
    data: tokenSearchData,
    fetchNextPage,
    hasNextPage,
    isFetched: isFetchedTokenSearch,
    isFetching: isFetchingTokenSearch,
    isLoading: isLoadingTokenSearch,
  } = useInfiniteQuery({
    queryKey: ['currency-search-tokens', selectedChainId, debouncedQuery],
    initialPageParam: 1,
    enabled: !!debouncedQuery && isAllTab,
    queryFn: ({ pageParam }) => fetchTokens(debouncedQuery, pageParam, chainIdList),
    getNextPageParam: (lastPage, allPages) =>
      debouncedQuery && !isQueryValidEVMAddress && lastPage.length === TOKEN_SEARCH_PAGE_SIZE
        ? allPages.length + 1
        : undefined,
    // Search results are stable on an alt-tab timescale; don't re-fire the /v1/tokens search on refocus.
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: false,
  })

  // De-duplicate by chain+address: a paginated search feed can repeat a token across pages when the
  // server-side ranking shifts (mirrors mapCatalogTokens), which would otherwise render duplicate rows.
  const tokenSearchResults = useMemo(() => {
    const flat = tokenSearchData?.pages.flatMap(page => page) ?? []
    const seen = new Set<string>()
    return flat.filter(token => {
      const key = tokenRowKey(token.chainId, token.wrapped.address)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [tokenSearchData?.pages])

  const { currentChainRpcToken, otherChainTokens, isCheckingOtherChains } = useAddressRpcTokenSearch({
    chainId: primaryChainId,
    debouncedQuery,
    supportedChains,
    isImportedTab: !isAllTab,
    isQueryValidEVMAddress,
    isFetchedTokenSearch,
    isFetchingTokenSearch,
    hasTokenSearchResults: !!tokenSearchResults.length,
  })

  // All-tab dataset: API search results (with RPC fallback) when searching, else the sorted default
  // tokens. Only computed for the All tab — the other tabs never read it, so skip the whole-whitelist
  // sort there. Object.values already returns a fresh array, so sort it in place.
  const allTabTokens: Currency[] = useMemo(() => {
    if (!isAllTab) return EMPTY_CURRENCIES
    if (debouncedQuery) {
      return tokenSearchResults.concat(filterTruthy([currentChainRpcToken])).filter(filterWrapFunc)
    }
    return Object.values(defaultTokens).sort(tokenComparator).filter(filterWrapFunc)
  }, [
    isAllTab,
    debouncedQuery,
    tokenSearchResults,
    currentChainRpcToken,
    defaultTokens,
    tokenComparator,
    filterWrapFunc,
  ])

  // Client-side search filter for the non-All tabs (their datasets are already in memory).
  const localFilter = useCallback(
    (tokens: Currency[]): Currency[] => {
      const filtered = debouncedQuery
        ? (filterTokens(primaryChainId, tokens as Token[], debouncedQuery) as Currency[])
        : tokens
      return filtered.filter(filterWrapFunc)
    },
    [debouncedQuery, primaryChainId, filterWrapFunc],
  )

  // Filter to the current chain synchronously so stale pills from the previous chain never render
  // during the (async) refetch after a chain switch.
  const favoriteCurrenciesBase = useMemo(
    () => localFilter((pinnedTokens as Currency[]).filter(token => token.chainId === primaryChainId)),
    [localFilter, pinnedTokens, primaryChainId],
  )

  const importedCurrenciesBase = useMemo(
    () => ([...localFilter(tokenImports)] as Token[]).sort(tokenComparator),
    [localFilter, tokenImports, tokenComparator],
  )
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

  const listExtras: TokenRowExtraMap = useMemo(() => {
    if (isTrendingTab) return trendingExtras
    if (isNewTab) return newExtras
    if (isImportedTab || isFavoritesTab) return metricsExtras
    return EMPTY_EXTRAS
  }, [isTrendingTab, isNewTab, isImportedTab, isFavoritesTab, trendingExtras, newExtras, metricsExtras])

  // In-memory metric sort for the Imported / Favorites tabs, whose "Price & 24h change" column sorts
  // by 24h change (Trending and New sort server-side). Rows are tiered so those missing the sorted
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
        if (field === 'volume24h') return extra?.volume24h !== undefined ? 0 : 1
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

  // The Favorites tab's natural order is descending market cap; tokens with no market cap sink to the bottom.
  const sortByMarketCap = useCallback(
    (list: Currency[]): Currency[] => {
      const capOf = (currency: Currency) =>
        listExtras[tokenRowKey(currency.chainId, currency.wrapped.address)]?.marketCap
      return [...list].sort((a, b) => {
        const ca = capOf(a)
        const cb = capOf(b)
        if (ca === undefined && cb === undefined) return 0
        if (ca === undefined) return 1
        if (cb === undefined) return -1
        return cb - ca
      })
    },
    [listExtras],
  )

  const visibleCurrencies: Currency[] = useMemo(() => {
    switch (activeTab) {
      // Trending and New both sort server-side (24h change / volume via the catalog API's `sort` param).
      case TokenSelectorTab.Trending:
        return trendingCurrencies
      case TokenSelectorTab.New:
        return newCurrenciesBase
      case TokenSelectorTab.Imported:
        return sortByMetric(importedCurrenciesBase)
      // Favorites default to market cap desc; a clicked sort header (24h change) overrides that.
      case TokenSelectorTab.Favorites:
        return sort ? sortByMetric(favoriteCurrenciesBase) : sortByMarketCap(favoriteCurrenciesBase)
      case TokenSelectorTab.All:
      default:
        return allTabTokens
    }
  }, [
    activeTab,
    trendingCurrencies,
    newCurrenciesBase,
    importedCurrenciesBase,
    favoriteCurrenciesBase,
    allTabTokens,
    sort,
    sortByMetric,
    sortByMarketCap,
  ])

  // Show skeleton rows while a tab's whole list is loading from the API.
  const isListLoading =
    (isAllTab && (debouncedQuery ? isLoadingTokenSearch : Object.keys(defaultTokens).length === 0)) ||
    (isNewTab && newLoading && !newTokens.length) ||
    (isTrendingTab && trendingLoading && !trendingTokens.length)

  const handleCurrencySelect = useCallback(
    (currency: Currency) => {
      const resolved = isTokenNative(currency) ? NativeCurrencies[currency.chainId] : currency
      // Restricted in the user's jurisdiction — block selection and keep the modal open with a notice.
      if (isTokenRestricted(resolved)) {
        notifyRestrictedToken(resolved)
        return
      }
      // Picking a token on another chain asks the user to switch first.
      if (resolved.chainId !== anchorChainId) {
        setSwitchChainToken(resolved)
        return
      }
      onCurrencySelect?.(resolved)
      onDismiss?.()
    },
    [anchorChainId, onCurrencySelect, onDismiss, isTokenRestricted, notifyRestrictedToken],
  )

  // On confirm, switch to the token's chain and select it once the switch lands (see the hook — it
  // defers the selection past the network-param sync that would otherwise reset the pair to defaults).
  const { switchChainAndSelect, resetPending } = usePendingCrossChainSelect(onCurrencySelect, onDismiss)
  const confirmSwitchChain = useCallback(() => {
    if (!switchChainToken) return
    const token = switchChainToken
    setSwitchChainToken(null)
    switchChainAndSelect(token)
  }, [switchChainToken, switchChainAndSelect])

  const handleInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const input = event.target.value
      const checksumInput = isAddress(primaryChainId, input)
      setSearchQuery(checksumInput || input)
      if (listTokenRef?.current) listTokenRef.current.scrollTop = 0
    },
    [primaryChainId],
  )

  const handleEnter = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Enter') return
      const s = searchQuery.toLowerCase().trim()
      const native = NativeCurrencies[primaryChainId]
      if (s === native.symbol?.toLowerCase() || s === native.name?.toLowerCase()) {
        handleCurrencySelect(NativeCurrencies[primaryChainId])
        return
      }
      const totalToken = visibleCurrencies.length
      if (totalToken && (visibleCurrencies[0].symbol?.toLowerCase() === s || totalToken === 1)) {
        const candidate = visibleCurrencies[0]
        // Honor the same import gate the row click enforces: a non-whitelisted result opens the
        // import-warning screen instead of being selected directly.
        if (
          getNeedsImport(candidate, address => tokenImports.some(token => token.address === address), !!onImportToken)
        ) {
          onImportToken?.(candidate.wrapped)
          return
        }
        handleCurrencySelect(candidate)
      }
    },
    [visibleCurrencies, handleCurrencySelect, searchQuery, primaryChainId, tokenImports, onImportToken],
  )

  const handleClickFavorite = useCallback(
    (event: MouseEvent, currency: Currency) => {
      event.stopPropagation()
      const address = currency.wrapped.address
      if (!address) return
      toggleFavoriteToken({ chainId: currency.chainId, address })
    },
    [toggleFavoriteToken],
  )

  const fetchListTokens = useCallback(async () => {
    if (!hasNextPage || isFetchingTokenSearch) return
    await fetchNextPage()
  }, [fetchNextPage, hasNextPage, isFetchingTokenSearch])

  // Infinite scroll: All-tab search paginates via the search query; Trending paginates its KyberScore list.
  const listHasMore = (isAllTab && !!hasNextPage) || (isTrendingTab && trendingHasMore)
  const handleLoadMore = useCallback(async () => {
    if (isTrendingTab) {
      if (trendingHasMore) fetchMoreTrending()
      return
    }
    if (isAllTab) await fetchListTokens()
  }, [isTrendingTab, isAllTab, trendingHasMore, fetchMoreTrending, fetchListTokens])

  // Tracks the current chain so an in-flight fetchPinnedTokens started before a chain switch can bail
  // out instead of overwriting pinnedTokens with the previous chain's (now filtered-out) tokens.
  const pinnedChainRef = useRef(primaryChainId)
  pinnedChainRef.current = primaryChainId
  // Monotonic id so two concurrent same-chain fetches (rapid star/unstar) can't let a slow one
  // overwrite the newest result — the chain guard alone can't distinguish them.
  const pinnedReqIdRef = useRef(0)

  const fetchPinnedTokens = useCallback(async () => {
    const requestedChainId = primaryChainId
    const reqId = ++pinnedReqIdRef.current
    try {
      if (!Object.keys(defaultTokens).length) return
      // Lowercased address → token, so each favorite is an O(1) lookup instead of scanning the whole map.
      const byAddress = new Map<string, Token | Currency>()
      Object.entries(defaultTokens).forEach(([address, token]) => byAddress.set(address.toLowerCase(), token))

      const result: (Token | Currency)[] = []
      const addressesToFetch: string[] = []
      favoriteTokens?.forEach(address => {
        const token = byAddress.get(address.toLowerCase())
        if (token) result.push(token)
        else addressesToFetch.push(address)
      })

      let resolved = result
      if (addressesToFetch.length) {
        const tokens = await fetchListTokenByAddresses(addressesToFetch, primaryChainId)
        // Sort the returned token list to match the order of the passed address list.
        resolved = result.concat(
          tokens.sort(
            (x, y) => addressesToFetch.indexOf(x.wrapped.address) - addressesToFetch.indexOf(y.wrapped.address),
          ),
        )
      }
      // Commit only if this is still the newest invocation and the chain hasn't changed.
      if (reqId !== pinnedReqIdRef.current || pinnedChainRef.current !== requestedChainId) return
      setPinnedTokens(resolved)
    } catch {
      // Pinned tokens are a convenience row; on failure keep the previous set rather than clearing it.
    }
  }, [primaryChainId, favoriteTokens, defaultTokens])

  const removeImportedToken = useCallback(
    (token: Token) => {
      removeToken(primaryChainId, token.address)
      if (favoriteTokens?.some(el => el.toLowerCase() === token.address.toLowerCase()))
        toggleFavoriteToken({
          chainId: primaryChainId,
          address: token.address,
        })
    },
    [primaryChainId, toggleFavoriteToken, removeToken, favoriteTokens],
  )

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      setSelectedChainId(anchorChainId)
      setActiveTab(defaultTab)
      resetPending()
      if (!isMobile) inputRef.current?.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Keep the active tab valid when the selected chain drops Trending support.
  useEffect(() => {
    if (!visibleTabs.includes(activeTab)) setActiveTab(TokenSelectorTab.All)
  }, [visibleTabs, activeTab])

  // Reset the column sort to a tab's natural order whenever the tab or chain changes. Also drop any
  // pending sort animation so a sort click that never committed can't leak a stray fade onto the next tab.
  useEffect(() => {
    setSort(null)
    pendingSortAnim.current = false
  }, [activeTab, primaryChainId])

  // Reset scroll to the top of the list on a deliberate context switch (tab or chain change).
  // Sort-driven scroll resets happen in the crossfade effect below, timed to the re-sorted rows.
  useEffect(() => {
    if (listTokenRef.current) listTokenRef.current.scrollTop = 0
  }, [activeTab, primaryChainId])

  // When a user-triggered sort actually reorders the rows, scroll back to the top and crossfade the
  // list. Watching `visibleCurrencies` runs this on the tick the new order becomes visible, so both
  // the scroll reset and the fade land with the sorted rows — never on the old rows before
  // Trending's async re-fetch resolves (which would jump a scrolled list before the data updates).
  useEffect(() => {
    if (!pendingSortAnim.current) return
    pendingSortAnim.current = false
    if (listTokenRef.current) listTokenRef.current.scrollTop = 0
    if (prefersReducedMotion) return
    listAnimation.start({ opacity: [0.4, 1], transition: { duration: 0.25, ease: 'easeOut' } })
  }, [visibleCurrencies, prefersReducedMotion, listAnimation])

  // Full server/RPC token search only runs on the All tab, so route any search there — otherwise a
  // search on Trending/New/etc. would only local-filter that tab's list and miss searchable tokens.
  // Remember the tab we came from so clearing the search returns there instead of stranding on All.
  const preSearchTabRef = useRef<TokenSelectorTab | null>(null)
  useEffect(() => {
    if (debouncedQuery) {
      if (preSearchTabRef.current === null) preSearchTabRef.current = activeTab
      setActiveTab(TokenSelectorTab.All)
    } else if (preSearchTabRef.current !== null) {
      setActiveTab(preSearchTabRef.current)
      preSearchTabRef.current = null
    }
    // Query-driven only; reads activeTab as a snapshot without re-running on tab changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery])

  useEffect(() => {
    fetchPinnedTokens()
  }, [fetchPinnedTokens])

  useEffect(() => {
    if (!trackingDebouncedQuery || !trackingSource) return
    trackingHandler(TRACKING_EVENT_TYPE.TOKEN_SEARCHED, {
      source: trackingSource,
      search_query: trackingDebouncedQuery,
      chain: NETWORKS_INFO[primaryChainId].name,
      is_address: !!isAddress(primaryChainId, trackingDebouncedQuery),
    })
  }, [trackingDebouncedQuery, trackingSource, primaryChainId, trackingHandler])

  const subtitle = getTabSubtitle(activeTab)
  const emptyMessage =
    activeTab === TokenSelectorTab.Trending ? (
      <Trans>No trending tokens right now. Check back later.</Trans>
    ) : activeTab === TokenSelectorTab.New ? (
      <Trans>No newly listed tokens right now.</Trans>
    ) : activeTab === TokenSelectorTab.Imported ? (
      <Trans>You haven&apos;t imported any tokens yet. Search a token address in the All tab to import one.</Trans>
    ) : activeTab === TokenSelectorTab.Favorites ? (
      <Trans>You have no saved tokens yet.</Trans>
    ) : undefined

  return (
    <ContentWrapper data-testid="token-selector-modal">
      <PaddedColumn>
        <HStack className="items-center justify-between">
          <HStack className="gap-1 text-xl font-medium">
            {title || <Trans>Select a token</Trans>}
            <InfoHelper
              zIndexTooltip={Z_INDEXS.MODAL}
              size={16}
              fontSize={12}
              text={
                tooltip || (
                  <Trans>
                    Find a token by searching for its name or symbol or by pasting its address below.
                    <br />
                    You can select and trade any token on KyberSwap.
                  </Trans>
                )
              }
            />
          </HStack>
          <CloseIcon onClick={onDismiss} data-testid="close-icon" />
        </HStack>

        <HStack className="items-center gap-3">
          <SearchWrapper className="flex-1">
            <SearchInput
              type="text"
              id="token-search-input"
              data-testid="token-search-input"
              placeholder={t`Search by name, symbol or address`}
              value={searchQuery}
              ref={inputRef}
              onChange={handleInput}
              onKeyDown={handleEnter}
              autoComplete="off"
            />
            {searchQuery ? (
              <button
                type="button"
                aria-label={t`Clear search`}
                data-testid="clear-search"
                onClick={() => {
                  setSearchQuery('')
                  inputRef.current?.focus()
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray transition-colors hover:text-text focus-visible:text-text focus-visible:outline-none"
              >
                <X size={16} />
              </button>
            ) : (
              <SearchIcon size={18} className="text-gray" />
            )}
          </SearchWrapper>
          <ChainSelector chains={supportedChains} selectedChainId={selectedChainId} onChange={setSelectedChainId} />
        </HStack>

        {showPinnedTokens && (
          <div
            className={cn(
              'grid transition-[grid-template-rows] duration-200 ease-out',
              favoriteCurrenciesBase.length ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
            )}
          >
            {/* Top/right padding leaves room for each pill's remove "×" (absolute -top/-right) so the
                collapse wrapper's overflow-hidden doesn't clip it. */}
            <div className="overflow-hidden pr-1.5 pt-1.5">
              <PinnedTokens
                tokens={favoriteCurrenciesBase.slice(0, isMobileWidth ? 4 : 5)}
                onToggleFavorite={handleClickFavorite}
                onSelect={handleCurrencySelect}
                selectedCurrency={selectedCurrency}
              />
            </div>
          </div>
        )}

        <TabBar tabs={visibleTabs} activeTab={activeTab} onChange={setActiveTab} />
      </PaddedColumn>

      <div
        key={activeTab}
        role="tabpanel"
        id="token-selector-panel"
        className="flex min-h-0 flex-1 animate-[fadeInUp_0.3s_ease-out_both] flex-col motion-reduce:animate-none"
      >
        {subtitle && <div className="px-5 pb-1 pt-3 text-sm text-subText">{subtitle}</div>}

        {(visibleCurrencies.length > 0 || isListLoading) && (
          <HStack className="items-center px-5 pb-2 pt-3 text-xs font-medium uppercase text-gray">
            <span className="flex-1">
              <Trans>Token</Trans>
            </span>
            <HStack className="shrink-0 items-center gap-3">
              {!isAllTab && (
                <MouseoverTooltip
                  placement="top"
                  width="fit-content"
                  style={{ zIndex: Z_INDEXS.MODAL }}
                  text={<Trans>Price & 24h change</Trans>}
                >
                  <SortHeader
                    label={<Trans>Price</Trans>}
                    field="priceChange24h"
                    sort={sort}
                    onSort={cycleSort}
                    className="w-[72px] sm:w-[132px]"
                  />
                </MouseoverTooltip>
              )}
              {isTrendingTab || isNewTab ? (
                <SortHeader
                  label={
                    <>
                      {/* Abbreviated on the narrow mobile column so the label doesn't overflow into the price column. */}
                      <span className="sm:hidden">
                        <Trans>Vol</Trans>
                      </span>
                      <span className="hidden sm:inline">
                        <Trans>Volume</Trans>
                      </span>
                    </>
                  }
                  field="volume24h"
                  sort={sort}
                  onSort={cycleSort}
                />
              ) : (
                <span className="flex w-[72px] items-center justify-end sm:w-[104px]">
                  <span className="sm:hidden">
                    <Trans>Bal</Trans>
                  </span>
                  <span className="hidden sm:inline">
                    <Trans>Balance</Trans>
                  </span>
                </span>
              )}
              {/* Spacer aligning the header with the imported rows' remove-token column. */}
              {isImportedTab && <span className="w-6 shrink-0" aria-hidden="true" />}
            </HStack>
          </HStack>
        )}

        <motion.div initial={{ opacity: 1 }} animate={listAnimation} className="flex min-h-0 flex-1 flex-col">
          {isListLoading ? (
            <TokenListSkeleton />
          ) : visibleCurrencies?.length > 0 ? (
            <TokenList
              listTokenRef={listTokenRef}
              onRemoveImportedToken={isImportedTab ? removeImportedToken : undefined}
              currencies={visibleCurrencies}
              onToggleFavorite={handleClickFavorite}
              onCurrencySelect={handleCurrencySelect}
              otherCurrency={otherSelectedCurrency}
              selectedCurrency={selectedCurrency}
              onImportToken={onImportToken}
              loadMoreRows={handleLoadMore}
              hasMore={listHasMore}
              customChainId={primaryChainId}
              extras={listExtras}
              showAddress={isAllTab}
              showPriceColumn={!isAllTab}
              showVolume={isTrendingTab || isNewTab}
              importAsRow={isTrendingTab || isAllTab}
              onShowTokenInfo={onShowTokenInfo}
            />
          ) : (
            <Stack className="min-h-0 flex-1">
              {isAllTab && (isCheckingOtherChains || otherChainTokens.length) ? (
                <OtherChainTokens
                  tokens={otherChainTokens}
                  loading={isCheckingOtherChains}
                  loadingFallback={<SearchLoading />}
                />
              ) : (
                <NoResult message={debouncedQuery ? undefined : emptyMessage} />
              )}
            </Stack>
          )}
        </motion.div>
      </div>

      <div className="px-5 py-3 text-left text-xs italic text-subText">
        <Trans>On-chain data for informational purposes only. Not financial advice.</Trans>
      </div>

      <SwitchChainModal
        token={switchChainToken}
        onDismiss={() => setSwitchChainToken(null)}
        onConfirm={confirmSwitchChain}
      />
    </ContentWrapper>
  )
}
