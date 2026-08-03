import { type QueryKey, useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { CursorResponse } from 'services/copyTrading/types'

import type { InfiniteScrollState } from 'pages/CopyTrading/components/InfiniteScroll'

type InfiniteCursorQueryParams<T> = {
  enabled?: boolean
  queryFn: (cursor?: string) => Promise<CursorResponse<T>>
  queryKey: QueryKey
}

const useInfiniteCursorQuery = <T>({ enabled = true, queryFn, queryKey }: InfiniteCursorQueryParams<T>) => {
  const query = useInfiniteQuery({
    enabled,
    initialPageParam: null as string | null,
    queryKey,
    queryFn: ({ pageParam }) => queryFn(pageParam || undefined),
    getNextPageParam: lastPage =>
      lastPage.pagination.hasMore && lastPage.pagination.nextCursor ? lastPage.pagination.nextCursor : undefined,
    retry: false,
  })

  const items = useMemo(() => query.data?.pages.flatMap(page => page.data) || [], [query.data?.pages])
  const infiniteScroll: InfiniteScrollState = {
    hasMore: !!query.hasNextPage,
    loadingMore: query.isFetchingNextPage,
    onLoadMore: query.fetchNextPage,
  }

  return {
    infiniteScroll,
    isFetching: query.isFetching,
    items,
  }
}

export default useInfiniteCursorQuery
