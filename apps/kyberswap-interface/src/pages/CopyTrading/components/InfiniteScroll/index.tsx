import { type PropsWithChildren, useEffect, useRef } from 'react'

import { ButtonLight } from 'components/Button'
import Loader from 'components/Loader'
import { Center, Stack } from 'components/Stack'
import { cn } from 'utils/cn'

export type InfiniteScrollState = {
  error?: boolean
  hasMore: boolean
  initialError?: boolean
  loadingMore?: boolean
  onLoadMore: () => Promise<unknown> | void
  onRetry?: () => Promise<unknown> | void
  retrying?: boolean
}

type InfiniteScrollProps = PropsWithChildren<
  InfiniteScrollState & {
    className?: string
  }
>

const InfiniteScroll = ({
  children,
  className,
  error,
  hasMore,
  initialError,
  loadingMore,
  onLoadMore,
  onRetry,
  retrying,
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
    <div ref={scrollContainerRef} className={cn('ks-scrollbar relative max-h-[480px] overflow-auto', className)}>
      {!initialError && children}
      {error && (
        <Stack
          className={cn('items-center justify-center gap-2 px-4 py-3 text-center', initialError && 'min-h-[180px]')}
          role="alert"
        >
          <span className="text-sm font-medium text-subText">Unable to load data.</span>
          {onRetry && (
            <ButtonLight type="button" padding="5px 10px" disabled={retrying} onClick={() => void onRetry()}>
              {retrying ? 'Retrying…' : 'Retry'}
            </ButtonLight>
          )}
        </Stack>
      )}
      {!error && hasMore && (
        <Center ref={loadMoreRef} className="h-10 shrink-0" role="status">
          {loadingMore && <Loader />}
        </Center>
      )}
    </div>
  )
}

export default InfiniteScroll
