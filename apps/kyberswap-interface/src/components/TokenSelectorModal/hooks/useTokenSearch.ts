import { ChainId } from '@kyberswap/ks-sdk-core'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'

import { tokenRowKey } from 'components/TokenSelectorModal/types'
import { TOKEN_SEARCH_PAGE_SIZE, fetchTokens, useAddressRpcTokenSearch } from 'components/TokenSelectorModal/utils'
import useChainsConfig from 'hooks/useChainsConfig'
import { isAddress } from 'utils/address'

export const useTokenSearch = (primaryChainId: ChainId, debouncedQuery: string, active: boolean) => {
  const { supportedChains } = useChainsConfig()
  const chainIdList = useMemo(() => [primaryChainId], [primaryChainId])
  const isAllTab = active
  const isQueryValidEVMAddress = !!isAddress(primaryChainId, debouncedQuery)
  const {
    data: tokenSearchData,
    fetchNextPage,
    hasNextPage,
    isFetched: isFetchedTokenSearch,
    isFetching: isFetchingTokenSearch,
    isLoading: isLoadingTokenSearch,
  } = useInfiniteQuery({
    queryKey: ['currency-search-tokens', primaryChainId, debouncedQuery],
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

  const fetchMore = useCallback(async () => {
    if (hasNextPage && !isFetchingTokenSearch) await fetchNextPage()
  }, [hasNextPage, isFetchingTokenSearch, fetchNextPage])
  return {
    tokenSearchResults,
    currentChainRpcToken,
    otherChainTokens,
    isCheckingOtherChains,
    loading: isLoadingTokenSearch,
    hasMore: !!hasNextPage,
    fetchMore,
  }
}
