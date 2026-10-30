import { ChainId, Currency, Token, WETH } from '@kyberswap/ks-sdk-core'
import { useCallback, useMemo } from 'react'
import { useMedia } from 'react-use'

import { TokenSelectorTab } from 'components/TokenSelectorModal/constants'
import { useInventoryDiscoveries } from 'components/TokenSelectorModal/hooks/useInventoryDiscoveries'
import { useTokenFavorites } from 'components/TokenSelectorModal/hooks/useTokenFavorites'
import { useTokenSearch } from 'components/TokenSelectorModal/hooks/useTokenSearch'
import { useTokenSelectorSource } from 'components/TokenSelectorModal/hooks/useTokenSelectorSource'
import { useTokenTabData } from 'components/TokenSelectorModal/hooks/useTokenTabData'
import { TokenSort } from 'components/TokenSelectorModal/types'
import { concatUnseenTokens, mergeHeldSearchResults, useTokenComparator } from 'components/TokenSelectorModal/utils'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useBalanceWait } from 'hooks/useBalanceWait'
import { useUserAddedTokens } from 'state/user/hooks'
import { useNativeBalance, useTokenBalances } from 'state/wallet/hooks'
import { isTokenListReady } from 'state/walletInventory/assets'
import { useInventoryTokenBalances, useWalletInventory } from 'state/walletInventory/hooks'
import { ensureTokenMetadata } from 'state/walletInventory/metadata'
import { MEDIA_WIDTHS } from 'theme'
import { filterTruthy } from 'utils/array'
import { filterTokens } from 'utils/filtering'
import { isTokenNative } from 'utils/tokenInfo'

const EMPTY_CURRENCIES: Currency[] = []
const EMPTY_TOKENS: Token[] = []

type Props = {
  requireOracle?: boolean
  primaryChainId: ChainId
  activeTab: TokenSelectorTab
  debouncedQuery: string
  sort: TokenSort | null
  showDiscoveryTabs: boolean
  filterWrap: boolean
  otherSelectedCurrency?: Currency | null
}

export const useTokenSelectorData = ({
  requireOracle = false,
  primaryChainId,
  activeTab,
  debouncedQuery,
  sort,
  showDiscoveryTabs,
  filterWrap,
  otherSelectedCurrency,
}: Props) => {
  const { account } = useActiveWeb3React()

  const isAllTab = activeTab === TokenSelectorTab.All
  const isImportedTab = activeTab === TokenSelectorTab.Imported
  const isTrendingTab = activeTab === TokenSelectorTab.Trending
  const isNewTab = activeTab === TokenSelectorTab.New
  const isFavoritesTab = activeTab === TokenSelectorTab.Favorites

  const isMobileWidth = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const source = useTokenSelectorSource(primaryChainId, requireOracle)
  const { defaultTokens, searchFilters, isListable, allowRpcSearch } = source
  const tokenImports = useUserAddedTokens(primaryChainId)

  const favorites = useTokenFavorites(primaryChainId, defaultTokens)
  const { pinnedTokens, favoriteAddressSet } = favorites

  const search = useTokenSearch(primaryChainId, debouncedQuery, isAllTab, searchFilters, allowRpcSearch)
  const { tokenSearchResults, currentChainRpcToken } = search

  const filterWrapFunc = useCallback(
    (token: Currency | undefined) => {
      if (!isListable(token)) return false
      if (filterWrap && otherSelectedCurrency?.equals(WETH[primaryChainId])) {
        return !isTokenNative(token)
      }
      if (filterWrap && otherSelectedCurrency && isTokenNative(otherSelectedCurrency)) {
        return !token?.equals(WETH[primaryChainId])
      }
      return true
    },
    [primaryChainId, otherSelectedCurrency, filterWrap, isListable],
  )

  // On chains kd-api indexes, one request returns every token the wallet holds, which replaces the
  // per-block balanceOf multicall over the whole visible set. Only one of the two paths is ever fed
  // tokens, so the unused one registers no work; chains without inventory keep the multicall.
  const inventory = useWalletInventory(primaryChainId)

  // Held tokens on no list. They sit in the All tab alongside everything else as dimmed rows that
  // import on click, and search matches them directly: someone typing a symbol they hold is looking
  // for it.
  const { tokens: discoveryTokens, impersonators } = useInventoryDiscoveries(
    inventory,
    defaultTokens,
    tokenImports,
    primaryChainId,
  )
  const showDiscoveries = isAllTab && !debouncedQuery && discoveryTokens.length > 0
  const unlistedAddresses = useMemo(
    () => (discoveryTokens.length ? new Set(discoveryTokens.map(token => token.address)) : undefined),
    [discoveryTokens],
  )

  const searchDiscoveryMatches = useMemo<Currency[]>(
    () =>
      isAllTab && debouncedQuery && discoveryTokens.length
        ? filterTokens(primaryChainId, discoveryTokens, debouncedQuery)
        : EMPTY_CURRENCIES,
    [isAllTab, debouncedQuery, discoveryTokens, primaryChainId],
  )
  // Imported tokens live only in local state, and the catalog answers a symbol query with its
  // whitelisted entries alone. Matching them here keeps a token the empty-box list shows from
  // vanishing the moment its own symbol is typed.
  const searchImportMatches = useMemo<Currency[]>(
    () =>
      isAllTab && debouncedQuery && tokenImports.length
        ? filterTokens(primaryChainId, tokenImports, debouncedQuery)
        : EMPTY_CURRENCIES,
    [isAllTab, debouncedQuery, tokenImports, primaryChainId],
  )
  const searchNativeMatches = useMemo(
    () =>
      isAllTab && debouncedQuery
        ? filterTokens(primaryChainId, Object.values(defaultTokens).filter(isTokenNative), debouncedQuery)
        : EMPTY_TOKENS,
    [isAllTab, debouncedQuery, primaryChainId, defaultTokens],
  )
  // Every address the wallet holds; only set while searching, to lead with held matches and badge them.
  const heldAddresses = useMemo(
    () => (isAllTab && debouncedQuery && inventory.active ? new Set(Object.keys(inventory.rows)) : undefined),
    [isAllTab, debouncedQuery, inventory],
  )

  // One balanceOf multicall for the whole modal: the sort-by-wallet-value comparator and the list's
  // balance column need the same tokens, and registering them apart doubles the RPC traffic. The set
  // comes from each tab's *unsorted* source so it stays put while the rows re-sort on top of it, and
  // it covers only the rows a tab actually shows — the Trending / New tabs render a metric column
  // instead of a balance, so they read nothing.
  const balanceTokens = useMemo<Token[]>(() => {
    if (isTrendingTab || isNewTab) return EMPTY_TOKENS
    const source: (Currency | undefined)[] = isImportedTab
      ? tokenImports
      : isFavoritesTab
      ? pinnedTokens
      : debouncedQuery
      ? [...tokenSearchResults, currentChainRpcToken, ...searchDiscoveryMatches, ...searchImportMatches]
      : Object.values(defaultTokens)
    // Native balance comes from `getEthBalance`, not an ERC20 read; off-chain rows (a cross-chain
    // search hit) have no balance to show here either.
    return source.filter(
      (token): token is Token =>
        !!token && !isTokenNative(token) && token.chainId === primaryChainId && isListable(token),
    )
  }, [
    isTrendingTab,
    isNewTab,
    isImportedTab,
    isFavoritesTab,
    debouncedQuery,
    tokenImports,
    pinnedTokens,
    tokenSearchResults,
    currentChainRpcToken,
    searchDiscoveryMatches,
    searchImportMatches,
    defaultTokens,
    primaryChainId,
    isListable,
  ])

  const balanceTokensWithDiscoveries = useMemo(
    () => (showDiscoveries ? [...balanceTokens, ...discoveryTokens] : balanceTokens),
    [showDiscoveries, balanceTokens, discoveryTokens],
  )

  // The multicall answers until the inventory can. Its cost is one sweep per open, ended the moment a
  // walk lands; what the inventory saves is the per-block repeat of that sweep, which is the expensive
  // part. A wallet is walked page by page, and no screen waits on that to show a balance.
  const multicallTokens = inventory.active ? EMPTY_TOKENS : balanceTokensWithDiscoveries
  const multicallBalances = useTokenBalances(multicallTokens, primaryChainId)
  const inventoryBalances = useInventoryTokenBalances(balanceTokensWithDiscoveries, inventory)
  const balances = inventory.active ? inventoryBalances : multicallBalances
  // Whichever source answers, a balance it never delivers stops reading as "loading": every new map
  // restarts the wait, so a source still working keeps its rows on a loader and a stalled one does not.
  const waitingForBalances = useBalanceWait(balances, !!account)
  const nativeBalance = useNativeBalance(primaryChainId)

  // Only the All (default order) and Imported tabs sort by wallet value; gate the comparator so the
  // rest never register its /prices fetch.
  const needsComparator = (isAllTab && !debouncedQuery) || isImportedTab
  const tokenComparator = useTokenComparator(
    balances,
    nativeBalance,
    primaryChainId,
    needsComparator,
    isAllTab ? favoriteAddressSet : undefined,
    isAllTab ? unlistedAddresses : undefined,
  )

  // All-tab dataset: API search results (with RPC fallback) when searching, else the sorted default
  // tokens. Only computed for the All tab — the other tabs never read it, so skip the whole-whitelist
  // sort there. Object.values already returns a fresh array, so sort it in place.
  const allTabTokens: Currency[] = useMemo(() => {
    if (!isAllTab) return EMPTY_CURRENCIES
    if (debouncedQuery) {
      return mergeHeldSearchResults(
        concatUnseenTokens(
          tokenSearchResults.concat(filterTruthy([currentChainRpcToken])),
          searchImportMatches.concat(searchNativeMatches),
        ),
        searchDiscoveryMatches,
        heldAddresses,
        impersonators,
      ).filter(filterWrapFunc)
    }
    return Object.values(defaultTokens).concat(discoveryTokens).sort(tokenComparator).filter(filterWrapFunc)
  }, [
    isAllTab,
    debouncedQuery,
    tokenSearchResults,
    currentChainRpcToken,
    searchDiscoveryMatches,
    searchImportMatches,
    searchNativeMatches,
    heldAddresses,
    defaultTokens,
    discoveryTokens,
    tokenComparator,
    filterWrapFunc,
    impersonators,
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

  // Quick-select pills: always lead with the chain's native token, then fill the rest from config /
  // favorites (dropping any native duplicate). Capped at 5 (4 on mobile) when the Favorites tab exists
  // to hold the overflow; uncapped otherwise (see the discovery-off note below). The native lead is
  // only hidden by a non-matching text search — never by the wrap filter — so it's always present.
  const quickSelectTokens = useMemo(() => {
    const native = NativeCurrencies[primaryChainId] as Currency | undefined
    const nativeMatchesSearch =
      !!native && (!debouncedQuery || filterTokens(primaryChainId, [native] as Token[], debouncedQuery).length > 0)
    const nativeLead = nativeMatchesSearch && native && isListable(native) ? [native] : []
    const rest = favoriteCurrenciesBase.filter(token => !isTokenNative(token) && !(native && token.equals(native)))
    const list = [...nativeLead, ...rest]
    return showDiscoveryTabs ? list.slice(0, isMobileWidth ? 4 : 5) : list
  }, [primaryChainId, favoriteCurrenciesBase, debouncedQuery, showDiscoveryTabs, isMobileWidth, isListable])

  const importedCurrenciesBase = useMemo(
    () => ([...localFilter(tokenImports)] as Token[]).sort(tokenComparator),
    [localFilter, tokenImports, tokenComparator],
  )
  // Catalog metadata (name, logo) for the unlisted holdings being looked at, and only those: a
  // spam-heavy wallet can hold hundreds, and the modal should not spend its opening on them. Before
  // the chain's list lands every held token classifies as unlisted, so the ask waits for it.
  const handleRowsRendered = useCallback(
    (rows: Currency[]) => {
      if (!unlistedAddresses?.size || !isTokenListReady(defaultTokens, tokenImports)) return
      const addresses = rows.flatMap(currency =>
        currency.isToken && unlistedAddresses.has(currency.address) ? [currency.address] : [],
      )
      if (addresses.length) void ensureTokenMetadata(primaryChainId, addresses)
    },
    [unlistedAddresses, defaultTokens, tokenImports, primaryChainId],
  )

  const tabData = useTokenTabData({
    searchFilters,
    primaryChainId,
    activeTab,
    sort,
    localFilter,
    importedCurrenciesBase,
    favoriteCurrenciesBase,
  })

  const { hasMore: tabHasMore, fetchMore: fetchMoreTab } = tabData
  const { fetchMore: fetchMoreSearch } = search

  const handleLoadMore = useCallback(async () => {
    if (isTrendingTab && tabHasMore) fetchMoreTab()
    else if (isAllTab) await fetchMoreSearch()
  }, [isTrendingTab, tabHasMore, fetchMoreTab, isAllTab, fetchMoreSearch])

  return {
    visibleCurrencies: isAllTab ? allTabTokens : tabData.currencies,
    listExtras: tabData.extras,
    isListLoading:
      source.isLoading ||
      (isAllTab ? (debouncedQuery ? search.loading : source.isDefaultListLoading) : tabData.loading),
    isListable,
    notice: source.notice,
    emptyMessage: source.emptyMessage,
    listHasMore: isAllTab ? search.hasMore : tabData.hasMore,
    handleLoadMore,
    handleRowsRendered,
    quickSelectTokens,
    balances,
    nativeBalance,
    waitingForBalances,
    impersonators,
    heldAddresses,
    otherChainTokens: search.otherChainTokens,
    isCheckingOtherChains: search.isCheckingOtherChains,
    handleClickFavorite: favorites.handleClickFavorite,
    removeImportedToken: favorites.removeImportedToken,
  }
}
