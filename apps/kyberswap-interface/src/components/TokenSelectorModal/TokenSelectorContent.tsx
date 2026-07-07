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
import { useTokensMetrics } from 'components/TokenSelectorModal/hooks/useTokensMetrics'
import { useTrendingTokens } from 'components/TokenSelectorModal/hooks/useTrendingTokens'
import { TokenRowExtraMap, TokenSort, TokenSortField, tokenRowKey } from 'components/TokenSelectorModal/types'
import {
  TOKEN_SEARCH_PAGE_SIZE,
  fetchTokens,
  useAddressRpcTokenSearch,
  useTokenComparator,
} from 'components/TokenSelectorModal/utils'
import { NETWORKS_INFO } from 'constants/networks'
import { Z_INDEXS } from 'constants/styles'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import useChainsConfig from 'hooks/useChainsConfig'
import useDebounce from 'hooks/useDebounce'
import { useIsTokenRestricted, useNotifyRestrictedToken } from 'hooks/useRestrictedTokens'
import { fetchListTokenByAddresses, useAllTokens } from 'hooks/useTokens'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import SortIcon, { Direction } from 'pages/MarketOverview/SortIcon'
import { useRemoveUserAddedToken, useUserAddedTokens, useUserFavoriteTokens } from 'state/user/hooks'
import { CloseIcon } from 'theme'
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

// A clickable, sortable column header (Price/24h, Volume) with the shared pool-list sort arrows.
const SortHeader = ({
  label,
  field,
  sort,
  onSort,
}: {
  label: ReactNode
  field: TokenSortField
  sort: TokenSort | null
  onSort: (field: TokenSortField) => void
}) => (
  <button
    type="button"
    onClick={() => onSort(field)}
    className="flex w-[104px] items-center justify-end gap-1 uppercase transition-colors hover:text-text"
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
  const { changeNetwork } = useChangeNetwork()
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

  // Column sort. Trending resolves it server-side; New / Imported / Favorites sort in-memory by 24h
  // change. `null` = the tab's natural order. Cleared whenever the tab or chain changes.
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
  const tokenComparator = useTokenComparator(false, primaryChainId)

  const {
    tokens: trendingTokens,
    extras: trendingExtras,
    loading: trendingLoading,
    hasMore: trendingHasMore,
    fetchMore: fetchMoreTrending,
  } = useTrendingTokens(primaryChainId, isTrendingTab ? sort : null, isTrendingTab)
  const { tokens: newTokens, extras: newExtras, loading: newLoading } = useNewTokens(chainIdList, isNewTab)

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
    retry: false,
  })

  const tokenSearchResults = useMemo(() => tokenSearchData?.pages.flatMap(page => page) ?? [], [tokenSearchData?.pages])

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

  // All-tab dataset: API search results (with RPC fallback) when searching, else the sorted default tokens.
  const allTabTokens: Currency[] = useMemo(() => {
    if (debouncedQuery) {
      return tokenSearchResults.concat(filterTruthy([currentChainRpcToken])).filter(filterWrapFunc)
    }
    return [...Object.values(defaultTokens)].sort(tokenComparator).filter(filterWrapFunc)
  }, [debouncedQuery, tokenSearchResults, currentChainRpcToken, defaultTokens, tokenComparator, filterWrapFunc])

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

  // In-memory 24h-change sort for New / Imported / Favorites (Trending sorts server-side). Rows are
  // tiered so tokens with a 24h change sort first (by value), then priced-but-no-change, then rows
  // with no price at all — the last group always sinks to the very bottom regardless of direction.
  const sortByChange = useCallback(
    (list: Currency[]): Currency[] => {
      if (!sort || sort.field !== 'priceChange24h') return list
      const dir = sort.dir === 'asc' ? 1 : -1
      const rankOf = (currency: Currency): number => {
        const extra = listExtras[tokenRowKey(currency.chainId, currency.wrapped.address)]
        if (extra?.priceChange24h !== undefined) return 0
        if (extra?.price) return 1
        return 2
      }
      return [...list].sort((a, b) => {
        const ra = rankOf(a)
        const rb = rankOf(b)
        if (ra !== rb) return ra - rb
        if (ra !== 0) return 0
        const ca = listExtras[tokenRowKey(a.chainId, a.wrapped.address)]?.priceChange24h ?? 0
        const cb = listExtras[tokenRowKey(b.chainId, b.wrapped.address)]?.priceChange24h ?? 0
        return (ca - cb) * dir
      })
    },
    [sort, listExtras],
  )

  const visibleCurrencies: Currency[] = useMemo(() => {
    switch (activeTab) {
      case TokenSelectorTab.Trending:
        return trendingCurrencies
      case TokenSelectorTab.New:
        return sortByChange(newCurrenciesBase)
      case TokenSelectorTab.Imported:
        return sortByChange(importedCurrenciesBase)
      case TokenSelectorTab.Favorites:
        return sortByChange(favoriteCurrenciesBase)
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
    sortByChange,
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

  const confirmSwitchChain = useCallback(() => {
    if (!switchChainToken) return
    const token = switchChainToken
    setSwitchChainToken(null)
    // Select the token and close only once the wallet actually switches networks — otherwise a
    // rejected/failed switch would leave the form holding a token on a chain we're not on.
    changeNetwork(token.chainId, () => {
      onCurrencySelect?.(token)
      onDismiss?.()
    })
  }, [switchChainToken, changeNetwork, onCurrencySelect, onDismiss])

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
        handleCurrencySelect(visibleCurrencies[0])
      }
    },
    [visibleCurrencies, handleCurrencySelect, searchQuery, primaryChainId],
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

  const fetchPinnedTokens = useCallback(async () => {
    const requestedChainId = primaryChainId
    try {
      if (!Object.keys(defaultTokens).length) return
      let result: (Token | Currency)[] = []
      const addressesToFetch: string[] = []

      favoriteTokens?.forEach(address => {
        let token
        Object.entries(defaultTokens).forEach(([add, t]) => {
          if (add.toLowerCase() === address.toLowerCase()) {
            token = t
          }
        })
        if (token) {
          result.push(token)
          return
        }
        addressesToFetch.push(address)
      })

      if (addressesToFetch.length) {
        const tokens = await fetchListTokenByAddresses(addressesToFetch, primaryChainId)
        // Sort the returned token list to match the order of the passed address list
        result = result.concat(
          tokens.sort((x, y) => {
            return addressesToFetch.indexOf(x.wrapped.address) - addressesToFetch.indexOf(y.wrapped.address)
          }),
        )
      }
      // Drop the result if the chain changed while this request was in flight.
      if (pinnedChainRef.current !== requestedChainId) return
      setPinnedTokens(result)
    } catch (error) {
      console.log('err', error)
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
      if (!isMobile) inputRef.current?.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Keep the active tab valid when the selected chain drops Trending support.
  useEffect(() => {
    if (!visibleTabs.includes(activeTab)) setActiveTab(TokenSelectorTab.All)
  }, [visibleTabs, activeTab])

  // Reset the column sort to a tab's natural order whenever the tab or chain changes.
  useEffect(() => {
    setSort(null)
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
  useEffect(() => {
    if (debouncedQuery) setActiveTab(TokenSelectorTab.All)
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
    ) : activeTab === TokenSelectorTab.Favorites ? (
      <Trans>You have no saved tokens yet.</Trans>
    ) : undefined

  return (
    <ContentWrapper>
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
            <SearchIcon size={18} className="text-gray" />
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
                tokens={favoriteCurrenciesBase.slice(0, 5)}
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
                <SortHeader label={<Trans>Price/24h</Trans>} field="priceChange24h" sort={sort} onSort={cycleSort} />
              )}
              {isTrendingTab ? (
                <SortHeader label={<Trans>Volume</Trans>} field="volume24h" sort={sort} onSort={cycleSort} />
              ) : (
                <span className="flex w-[104px] items-center justify-end">
                  <Trans>Balance</Trans>
                </span>
              )}
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
              showVolume={isTrendingTab}
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
        <Trans>Data from on-chain trading activities. Not financial advice.</Trans>
      </div>

      <SwitchChainModal
        token={switchChainToken}
        onDismiss={() => setSwitchChainToken(null)}
        onConfirm={confirmSwitchChain}
      />
    </ContentWrapper>
  )
}
