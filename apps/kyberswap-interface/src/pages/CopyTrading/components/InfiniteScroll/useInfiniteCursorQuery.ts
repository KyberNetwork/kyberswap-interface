import { type QueryKey, useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { CursorResponse } from 'services/copyTrading/types'

import type { InfiniteScrollState } from 'pages/CopyTrading/components/InfiniteScroll'

type InfiniteCursorQueryParams<TResponse extends CursorResponse<unknown>> = {
  enabled?: boolean
  queryFn: (cursor?: string) => Promise<TResponse>
  queryKey: QueryKey
}

type CursorItem<TResponse> = TResponse extends CursorResponse<infer T> ? T : never

const useInfiniteCursorQuery = <TResponse extends CursorResponse<unknown>>({
  enabled = true,
  queryFn,
  queryKey,
}: InfiniteCursorQueryParams<TResponse>) => {
  const query = useInfiniteQuery({
    enabled,
    initialPageParam: null as string | null,
    queryKey,
    queryFn: ({ pageParam }) => queryFn(pageParam || undefined),
    getNextPageParam: lastPage =>
      lastPage.pagination.hasMore && lastPage.pagination.nextCursor ? lastPage.pagination.nextCursor : undefined,
    retry: false,
  })

  const items = useMemo<CursorItem<TResponse>[]>(
    () => (query.data?.pages.flatMap(page => page.data) || []) as CursorItem<TResponse>[],
    [query.data?.pages],
  )

  const infiniteScroll: InfiniteScrollState = {
    error: query.isError,
    hasMore: !!query.hasNextPage,
    initialError: query.isError && !items.length,
    loadingMore: query.isFetchingNextPage,
    onLoadMore: query.fetchNextPage,
  }

  return {
    infiniteScroll,
    isFetching: query.isFetching,
    items,
    pages: query.data?.pages || [],
  }
}

export default useInfiniteCursorQuery
