import { type QueryKey, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'react-feather'
import type { CursorResponse } from 'services/copyTrading/types/primitives'

import { ButtonLight } from 'components/Button'
import { HStack } from 'components/Stack'

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

export const useCursorPageQuery = <TResponse extends CursorResponse<unknown>>({
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
    refetchInterval: 10_000,
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
  }
}

export type CursorPaginationState = {
  currentPage: number
  error?: boolean
  hasNextPage: boolean
  navigating?: boolean
  onNextPage: () => void
  onPreviousPage: () => void
}

const CursorPagination = ({
  currentPage,
  hasNextPage,
  navigating,
  onNextPage,
  onPreviousPage,
}: CursorPaginationState) => {
  if (currentPage === 1 && !hasNextPage) return null

  return (
    <HStack className="items-center justify-center gap-3 border-t border-tableHeader bg-background-60 px-6 py-3">
      <ButtonLight
        type="button"
        className="gap-1 sm:w-auto"
        padding="7px 12px"
        disabled={currentPage === 1 || navigating}
        onClick={onPreviousPage}
      >
        <ChevronLeft size={16} aria-hidden />
        Previous
      </ButtonLight>
      <span className="min-w-16 text-center text-sm font-medium text-subText">Page {currentPage}</span>
      <ButtonLight
        type="button"
        className="gap-1 sm:w-auto"
        padding="7px 12px"
        disabled={!hasNextPage || navigating}
        onClick={onNextPage}
      >
        Next
        <ChevronRight size={16} aria-hidden />
      </ButtonLight>
    </HStack>
  )
}

export default CursorPagination
