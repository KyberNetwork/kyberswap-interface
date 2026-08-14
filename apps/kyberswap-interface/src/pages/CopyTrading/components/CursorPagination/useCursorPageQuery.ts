import { type QueryKey, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import type { CursorResponse } from 'services/copyTrading/types'

type CursorPageQueryParams<TResponse extends CursorResponse<unknown>> = {
  enabled?: boolean
  queryFn: (cursor?: string) => Promise<TResponse>
  queryKey: QueryKey
}

type CursorItem<TResponse> = TResponse extends CursorResponse<infer T> ? T : never

type PaginationState = {
  currentPage: number
  cursors: Array<string | undefined>
  scopeKey: string
}

const useCursorPageQuery = <TResponse extends CursorResponse<unknown>>({
  enabled = true,
  queryFn,
  queryKey,
}: CursorPageQueryParams<TResponse>) => {
  const scopeKey = JSON.stringify(queryKey)
  const [pagination, setPagination] = useState<PaginationState>(() => ({
    currentPage: 1,
    cursors: [undefined],
    scopeKey,
  }))
  const paginationReady = pagination.scopeKey === scopeKey
  const currentPage = paginationReady ? pagination.currentPage : 1
  const cursor = paginationReady ? pagination.cursors[currentPage - 1] : undefined

  useEffect(() => {
    if (!paginationReady) setPagination({ currentPage: 1, cursors: [undefined], scopeKey })
  }, [paginationReady, scopeKey])

  const query = useQuery({
    enabled: enabled && paginationReady,
    queryKey: [...queryKey, 'page', cursor || null],
    queryFn: () => queryFn(cursor),
    retry: false,
  })

  const nextCursor = query.data?.pagination.nextCursor
  const hasNextPage = !!query.data?.pagination.hasMore && !!nextCursor

  const goToNextPage = () => {
    if (!nextCursor || !hasNextPage) return

    setPagination(current => ({
      ...current,
      currentPage: currentPage + 1,
      cursors: [...current.cursors.slice(0, currentPage), nextCursor],
    }))
  }

  const goToPreviousPage = () => {
    setPagination(current => ({ ...current, currentPage: Math.max(1, currentPage - 1) }))
  }

  return {
    currentPage,
    error: query.isError,
    hasNextPage,
    items: (query.data?.data || []) as CursorItem<TResponse>[],
    loading: query.isFetching && !query.data,
    navigating: query.isFetching,
    onNextPage: goToNextPage,
    onPreviousPage: goToPreviousPage,
    onRetry: query.refetch,
  }
}

export default useCursorPageQuery
