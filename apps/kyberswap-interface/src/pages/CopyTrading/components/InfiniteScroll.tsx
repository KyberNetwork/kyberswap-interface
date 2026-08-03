import { type PropsWithChildren, useEffect, useRef } from 'react'

import Loader from 'components/Loader'
import { Center } from 'components/Stack'
import { cn } from 'utils/cn'

export type InfiniteScrollState = {
  hasMore: boolean
  loadingMore?: boolean
  onLoadMore: () => Promise<unknown> | void
}

type InfiniteScrollProps = PropsWithChildren<
  InfiniteScrollState & {
    className?: string
  }
>

const InfiniteScroll = ({ children, className, hasMore, loadingMore, onLoadMore }: InfiniteScrollProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = scrollContainerRef.current
    const target = loadMoreRef.current
    if (!root || !target || !hasMore || loadingMore) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void onLoadMore()
      },
      { root, rootMargin: '80px 0px' },
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, onLoadMore])

  return (
    <div ref={scrollContainerRef} className={cn('ks-scrollbar relative max-h-[480px] overflow-auto', className)}>
      {children}
      {hasMore && (
        <Center ref={loadMoreRef} className="h-10 shrink-0" role="status">
          {loadingMore && <Loader />}
        </Center>
      )}
    </div>
  )
}

export default InfiniteScroll
