import { ChainId } from '@kyberswap/ks-sdk-core'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { fetchTokenCatalogTokens } from 'services/tokenCatalog'

import { TRENDING_PAGE_SIZE, isTrendingSupportedChain } from 'components/TokenSelectorModal/constants'
import { mapCatalogTokens } from 'components/TokenSelectorModal/hooks/catalog'
import { TokenRowExtraMap, TokenSearchFilters, TokenSort } from 'components/TokenSelectorModal/types'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

/** Server-side `sort` param: KyberScore by default, or the column the user picked. */
const toSortParam = (sort: TokenSort | null): string => (sort ? `${sort.field}:${sort.dir}` : 'kyberScore:desc')

type UseTrendingTokensResult = {
  tokens: WrappedTokenInfo[]
  extras: TokenRowExtraMap
  loading: boolean
  hasMore: boolean
  lastPageTokens: WrappedTokenInfo[]
  lastPageChains: number[]
  pageCount: number
  fetchMore: () => Promise<void>
  error: boolean
  retry: () => void
}

/**
 * Trending tokens for a chain, ranked by KyberScore, from the public token-catalog list endpoint
 * (`tag=kyberscore`), paginated for infinite scroll. Sorting is server-side — the default KyberScore
 * order, or `priceChange24h` / `volume24h` / `fdv` when the user sorts a column; changing the
 * sort restarts pagination from page 1 (the sort param is part of the query key). Price / 24h-change
 * / volume / FDV come straight from each token's `metrics`.
 */
export const useTrendingTokens = (
  chainId: ChainId | ChainId[] | undefined,
  sort: TokenSort | null,
  active = true,
  filters?: TokenSearchFilters,
): UseTrendingTokensResult => {
  const chainIds =
    chainId === undefined
      ? undefined
      : (Array.isArray(chainId) ? chainId : [chainId]).filter(isTrendingSupportedChain).join(',')
  const sortParam = toSortParam(sort)
  const oracleTokenFilter = filters?.oracleTokenFilter

  const { data, isLoading, fetchNextPage, hasNextPage, isFetching, isError, isFetchNextPageError, refetch } =
    useInfiniteQuery({
      queryKey: ['token-selector-trending', chainIds ?? 'all', sortParam, oracleTokenFilter],
      enabled: active && (chainIds === undefined || !!chainIds),
      initialPageParam: 1,
      queryFn: ({ pageParam }) =>
        fetchTokenCatalogTokens({
          ...(chainIds ? { chainIds } : {}),
          tag: 'kyberscore',
          sort: sortParam,
          page: pageParam,
          pageSize: TRENDING_PAGE_SIZE,
          ...(oracleTokenFilter && { [oracleTokenFilter]: true }),
        }),
      getNextPageParam: (lastPage, allPages) => {
        const lastCount = lastPage?.data?.tokens?.length ?? 0
        // A short page means the server has no more rows — stop regardless of what `totalItems` claims
        // (it can over-report), so pagination can never loop refetching empty pages.
        if (lastCount < TRENDING_PAGE_SIZE) return undefined

        const loaded = allPages.reduce((sum, page) => sum + (page?.data?.tokens?.length ?? 0), 0)
        const total = lastPage?.data?.pagination?.totalItems ?? loaded
        return loaded < total ? allPages.length + 1 : undefined
      },
      // Changing the sort starts a new query; keep the current sort's rows on screen while the new
      // order loads (same chain only) so the list re-sorts in place instead of flashing the skeleton.
      placeholderData: (previousData, previousQuery) =>
        previousQuery?.queryKey?.[1] === (chainIds ?? 'all') ? previousData : undefined,
      staleTime: 60_000,
      retry: false,
    })

  const fetchMore = useCallback(async () => {
    if (hasNextPage && !isFetching && !isFetchNextPageError) await fetchNextPage()
  }, [hasNextPage, isFetching, isFetchNextPageError, fetchNextPage])

  return useMemo(() => {
    const raw = (data?.pages ?? []).flatMap(page => page?.data?.tokens ?? [])
    const { tokens, extras } = mapCatalogTokens(raw)

    return {
      tokens,
      lastPageTokens: mapCatalogTokens(data?.pages[data.pages.length - 1]?.data?.tokens ?? []).tokens,
      lastPageChains: (data?.pages[data.pages.length - 1]?.data?.tokens ?? []).map(token => Number(token.chainId)),
      pageCount: data?.pages.length ?? 0,
      extras,
      loading: isLoading,
      hasMore: !!hasNextPage && !isFetchNextPageError,
      fetchMore,
      error: isError,
      retry: () => {
        void (isFetchNextPageError ? fetchNextPage() : refetch())
      },
    }
  }, [data, isLoading, hasNextPage, fetchNextPage, fetchMore, isError, isFetchNextPageError, refetch])
}
