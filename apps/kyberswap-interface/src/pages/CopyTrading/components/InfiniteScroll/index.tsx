import { type QueryKey, useInfiniteQuery } from '@tanstack/react-query'
import { type PropsWithChildren, useEffect, useMemo, useRef } from 'react'
import type { CursorResponse } from 'services/copyTrading/types/primitives'

import Loader from 'components/Loader'
import ScrollArea, { type ScrollbarOrientation, type ScrollbarSize } from 'components/ScrollArea'
import { Center, Stack } from 'components/Stack'
import { cn } from 'utils/cn'

export type InfiniteScrollState = {
  error?: boolean
  hasMore: boolean
  initialError?: boolean
  loadingMore?: boolean
  onLoadMore: () => Promise<unknown> | void
}

type InfiniteCursorQueryParams<TResponse extends CursorResponse<unknown>> = {
  enabled?: boolean
  queryFn: (cursor?: string) => Promise<TResponse>
  queryKey: QueryKey
}

type CursorItem<TResponse> = TResponse extends CursorResponse<infer T> ? T : never

export const useInfiniteCursorQuery = <TResponse extends CursorResponse<unknown>>({
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
    refetchInterval: 10_000,
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

export type InfiniteScrollProps = PropsWithChildren<
  InfiniteScrollState & {
    className?: string
    /** Defaults to both axes so bounded lists and wide tables expose every available scroll direction. */
    scrollbar?: ScrollbarOrientation
    /** Scrollbar thickness passed through to ScrollArea. Defaults to md. */
    size?: ScrollbarSize
  }
>

/**
 * Bounded scroll container that requests the next cursor page as its bottom sentinel approaches.
 * Query ownership stays with the caller; this component only owns scroll observation and shared states.
 */
const InfiniteScroll = ({
  children,
  className,
  error,
  hasMore,
  initialError,
  loadingMore,
  onLoadMore,
  scrollbar = 'both',
  size,
}: InfiniteScrollProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = scrollContainerRef.current
    const target = loadMoreRef.current
    if (!root || !target || error || !hasMore || loadingMore) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void onLoadMore()
      },
      { root, rootMargin: '80px 0px' },
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [error, hasMore, loadingMore, onLoadMore])

  return (
    <ScrollArea
      ref={scrollContainerRef}
      className={cn('relative max-h-[480px]', className)}
      scrollbar={scrollbar}
      size={size}
    >
      {!initialError && children}
      {error && (
        <Stack
          className={cn('items-center justify-center px-4 py-3 text-center', initialError && 'min-h-[180px]')}
          role="alert"
        >
          <p className="text-sm font-medium text-subText">Unable to load data.</p>
        </Stack>
      )}
      {!error && hasMore && (
        <Center ref={loadMoreRef} className="h-10 shrink-0" role="status">
          {loadingMore && <Loader />}
        </Center>
      )}
    </ScrollArea>
  )
}

export default InfiniteScroll
