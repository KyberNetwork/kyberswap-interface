import { type QueryKey, useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'
import type { CursorResponse } from 'services/copyTrading/types'

import type { InfiniteScrollState } from 'pages/CopyTrading/components/InfiniteScroll'

type InfiniteCursorQueryParams<T> = {
  enabled?: boolean
  queryFn: (cursor?: string) => Promise<CursorResponse<T>>
  queryKey: QueryKey
}

const useInfiniteCursorQuery = <T>({ enabled = true, queryFn, queryKey }: InfiniteCursorQueryParams<T>) => {
  const queryClient = useQueryClient()
  const [restarting, setRestarting] = useState(false)
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
  const restart = useCallback(async () => {
    setRestarting(true)
    try {
      await queryClient.resetQueries({ exact: true, queryKey })
    } finally {
      setRestarting(false)
    }
  }, [queryClient, queryKey])
  const infiniteScroll: InfiniteScrollState = {
    error: query.isError,
    hasMore: !!query.hasNextPage,
    initialError: query.isError && !items.length,
    loadingMore: query.isFetchingNextPage,
    onLoadMore: query.fetchNextPage,
    onRetry: restart,
    retrying: restarting,
  }

  return {
    infiniteScroll,
    isFetching: query.isFetching,
    items,
  }
}

export default useInfiniteCursorQuery
