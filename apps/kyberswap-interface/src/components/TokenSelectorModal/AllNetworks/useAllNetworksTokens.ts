import { useInfiniteQuery } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'

import { TOKEN_SEARCH_PAGE_SIZE, fetchAllNetworkTokenPage } from 'components/TokenSelectorModal/utils'

/** Owns API pages only. The aggregate controller owns chain eligibility and token merging. */
export const useAllNetworksTokens = ({ active, query }: { active: boolean; query: string }) => {
  const catalog = useInfiniteQuery({
    queryKey: ['token-selector-all-networks-catalog-verified-market-cap', query],
    enabled: active,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchAllNetworkTokenPage(query, pageParam),
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce((sum, page) => sum + page.rawCount, 0)
      if (lastPage.rawCount < TOKEN_SEARCH_PAGE_SIZE || loaded >= (lastPage.totalItems ?? Infinity)) return undefined
      return pages.length + 1
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: false,
  })

  const currencies = useMemo(() => (catalog.data?.pages ?? []).flatMap(page => page.tokens), [catalog.data])

  const { hasNextPage, isFetching, isFetchNextPageError, fetchNextPage } = catalog

  const fetchMore = useCallback(async () => {
    if (hasNextPage && !isFetching && !isFetchNextPageError) await fetchNextPage()
  }, [hasNextPage, isFetching, isFetchNextPageError, fetchNextPage])

  const retry = () => {
    if (catalog.isFetchNextPageError) void catalog.fetchNextPage()
    else if (catalog.isError) void catalog.refetch()
  }

  return {
    currencies,
    lastPageTokens: catalog.data?.pages[(catalog.data?.pages.length ?? 1) - 1]?.tokens,
    lastPageChains: (catalog.data?.pages[(catalog.data?.pages.length ?? 1) - 1]?.tokens ?? []).map(
      token => token.chainId,
    ),
    pageCount: catalog.data?.pages.length ?? 0,
    loading: catalog.isLoading,
    hasMore: !!catalog.hasNextPage && !catalog.isFetchNextPageError,
    fetchMore,
    error: catalog.isError,
    retry,
  }
}
