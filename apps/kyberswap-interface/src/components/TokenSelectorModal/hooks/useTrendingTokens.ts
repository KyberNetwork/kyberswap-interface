import { ChainId } from '@kyberswap/ks-sdk-core'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { fetchTokenCatalogTokens } from 'services/tokenCatalog'

import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

import { TRENDING_PAGE_SIZE, isTrendingSupportedChain } from '../constants'
import { TokenRowExtraMap, TokenSort } from '../types'
import { mapCatalogTokens } from './catalog'

/** Server-side `sort` param: KyberScore by default, or the column the user picked. */
const toSortParam = (sort: TokenSort | null): string => (sort ? `${sort.field}:${sort.dir}` : 'kyberScore:desc')

type UseTrendingTokensResult = {
  tokens: WrappedTokenInfo[]
  extras: TokenRowExtraMap
  loading: boolean
  hasMore: boolean
  fetchMore: () => void
}

/**
 * Trending tokens for a chain, ranked by KyberScore, from the public token-catalog list endpoint
 * (`tag=kyberscore`), paginated for infinite scroll. Sorting is server-side — the default KyberScore
 * order, or `priceChange24h` / `volume24h` when the user sorts a column; changing the sort restarts
 * pagination from page 1 (the sort param is part of the query key). Price / 24h-change / volume come
 * straight from each token's `metrics`.
 */
export const useTrendingTokens = (chainId: ChainId, sort: TokenSort | null, active = true): UseTrendingTokensResult => {
  const sortParam = toSortParam(sort)

  const { data, isLoading, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['token-selector-trending', chainId, sortParam],
    enabled: active && isTrendingSupportedChain(chainId),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchTokenCatalogTokens({
        chainIds: chainId,
        tag: 'kyberscore',
        sort: sortParam,
        page: pageParam,
        pageSize: TRENDING_PAGE_SIZE,
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
    staleTime: 60_000,
    retry: false,
  })

  return useMemo(() => {
    const raw = (data?.pages ?? []).flatMap(page => page?.data?.tokens ?? [])
    const { tokens, extras } = mapCatalogTokens(raw)
    return { tokens, extras, loading: isLoading, hasMore: !!hasNextPage, fetchMore: fetchNextPage }
  }, [data, isLoading, hasNextPage, fetchNextPage])
}
