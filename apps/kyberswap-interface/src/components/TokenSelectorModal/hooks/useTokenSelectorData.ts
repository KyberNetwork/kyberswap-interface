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
import { useBalanceWait } from 'hooks/useBalanceWait'
import { useUserAddedTokens } from 'state/user/hooks'
import { useEvmBalanceAccount } from 'state/wallet/WalletBalanceContext'
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
  enabled?: boolean
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
  enabled = true,
  requireOracle = false,
  primaryChainId,
  activeTab,
  debouncedQuery,
  sort,
  showDiscoveryTabs,
  filterWrap,
  otherSelectedCurrency,
}: Props) => {
  const account = useEvmBalanceAccount()

  const isAllTab = enabled && activeTab === TokenSelectorTab.All
  const isImportedTab = enabled && activeTab === TokenSelectorTab.Imported
  const isTrendingTab = enabled && activeTab === TokenSelectorTab.Trending
  const isNewTab = enabled && activeTab === TokenSelectorTab.New
  const isFavoritesTab = enabled && activeTab === TokenSelectorTab.Favorites

  const isMobileWidth = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const selectorSource = useTokenSelectorSource(primaryChainId, requireOracle)
  const { defaultTokens, searchFilters, isListable, allowRpcSearch } = selectorSource
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

  // Inventory replaces per-block balance reads on supported chains; the inactive source receives no tokens.
  const inventory = useWalletInventory(primaryChainId, enabled)

  // Unlisted holdings remain searchable and require import when selected.
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

  // Catalog search omits local imports, so merge their matches to keep imported symbols searchable.
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

  // Sorting and balance cells share one read set built from unsorted tab data.
  // Trending/New display metrics instead of balances and must not register these reads.
  const balanceTokens = useMemo<Token[]>(() => {
    if (!enabled || isTrendingTab || isNewTab) return EMPTY_TOKENS

    const tabTokensSource: (Currency | undefined)[] = isImportedTab
      ? tokenImports
      : isFavoritesTab
      ? pinnedTokens
      : debouncedQuery
      ? [...tokenSearchResults, currentChainRpcToken, ...searchDiscoveryMatches, ...searchImportMatches]
      : Object.values(defaultTokens)

    // Native balances use their own read; search hits from another chain are excluded.
    return tabTokensSource.filter(
      (token): token is Token =>
        !!token && !isTokenNative(token) && token.chainId === primaryChainId && isListable(token),
    )
  }, [
    enabled,
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

  // Stop RPC reads once inventory becomes active; both sorting and display switch together.
  const multicallTokens = inventory.active ? EMPTY_TOKENS : balanceTokensWithDiscoveries
  const multicallBalances = useTokenBalances(multicallTokens, primaryChainId)
  const inventoryBalances = useInventoryTokenBalances(balanceTokensWithDiscoveries, inventory)
  const balances = inventory.active ? inventoryBalances : multicallBalances

  // Bound loading for missing balances; each updated map restarts the wait.
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

  // All combines search/RPC/local matches, or sorts the default list when search is empty.
  // Other tabs skip this work and retain their own ordering.
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

  // Native leads the pills unless search excludes it; the wrap filter does not hide that shortcut.
  // Cap only when the Favorites tab can expose the overflow.
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

  const tabData = useTokenTabData({
    enabled,
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

  // Enrich only visible unlisted holdings after the chain list is ready; avoid scanning a spam-heavy wallet.
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

  const handleLoadMore = useCallback(async () => {
    if (isTrendingTab && tabHasMore) fetchMoreTab()
    else if (isAllTab) await fetchMoreSearch()
  }, [isTrendingTab, tabHasMore, fetchMoreTab, isAllTab, fetchMoreSearch])

  return {
    visibleCurrencies: isAllTab ? allTabTokens : tabData.currencies,
    listExtras: tabData.extras,
    isListLoading:
      selectorSource.isLoading ||
      (isAllTab ? (debouncedQuery ? search.loading : selectorSource.isDefaultListLoading) : tabData.loading),
    isListable,
    notice: selectorSource.notice,
    emptyMessage: selectorSource.emptyMessage,
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
  }
}
