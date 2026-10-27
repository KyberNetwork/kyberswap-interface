import { useEffect, useRef, useState } from 'react'
import { selectBackendTransactions, useGetTransactionsInfiniteQuery } from 'services/crossChainTransactions'

import { useCrossChainTransactions } from 'state/crossChainSwap'
import { useAppSelector } from 'state/hooks'

import { HISTORY_PAGE_SIZE, getLoadedHistory } from './history'

// The caller keys this controller by sender so wallet changes reset pagination.
// Token lookup/filtering belong to rows; status acquisition belongs to the updater.
export const useUnifiedTransactionHistory = (sender: string) => {
  const local = useCrossChainTransactions()
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)

  // A cursor loop must stop when this wallet-owned controller unmounts.
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true

    return () => {
      mounted.current = false
    }
  }, [])

  const cached = useAppSelector(selectBackendTransactions)
  const list = useGetTransactionsInfiniteQuery(sender, {
    skip: !sender,
    refetchOnMountOrArgChange: 15,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  })

  const { isFetching, isError, fetchNextPage } = list
  const loaded = getLoadedHistory(list.currentData?.pages ?? [], local, cached, sender)
  const lastPage = Math.max(1, Math.ceil(loaded.transactions.length / HISTORY_PAGE_SIZE))
  const end = page * HISTORY_PAGE_SIZE
  const canGoPrevious = page > 1
  const canGoNext = !!sender && (loaded.transactions.length > end || loaded.hasMore)

  const goNext = async () => {
    if (!canGoNext || loadingMore || isFetching) return

    setLoadingMore(true)

    try {
      let next = loaded
      // If filling this page failed, retry it before advancing past unseen rows.
      const targetPage = loaded.transactions.length < end ? page : page + 1

      // Fetch only enough cursor pages to fill the next merged UI page. A page
      // consisting of duplicates must not create an empty "Next" destination.
      while (next.transactions.length < targetPage * HISTORY_PAGE_SIZE && next.hasMore) {
        const result = await fetchNextPage()
        if (!mounted.current || result.error || !result.data) return

        next = getLoadedHistory(result.data.pages, local, cached, sender)
      }

      if (next.transactions.length > (targetPage - 1) * HISTORY_PAGE_SIZE) {
        setPage(current => (current === page ? targetPage : current))
      }
    } finally {
      if (mounted.current) setLoadingMore(false)
    }
  }

  const goPrevious = () => setPage(current => Math.max(1, current - 1))

  useEffect(() => {
    if (list.currentData && !loaded.hasMore) setPage(current => Math.min(current, lastPage))
  }, [list.currentData, loaded.hasMore, lastPage])

  // Fill the current UI page after deduplication, even if an API page contains
  // only overlapping/filtered rows. No cursor prefetch when enough rows exist.
  useEffect(() => {
    if (loaded.transactions.length < end && loaded.hasMore && !isFetching && !isError && !loadingMore) {
      void fetchNextPage()
    }
  }, [end, loaded.transactions.length, loaded.hasMore, isFetching, isError, fetchNextPage, loadingMore])

  return {
    transactions: loaded.transactions.slice((page - 1) * HISTORY_PAGE_SIZE, end),
    loading: !!sender && list.isLoading,
    loadingMore: !!sender && (loadingMore || list.isFetching),
    error: !!sender && list.isError,
    currentPage: page,
    canGoPrevious,
    canGoNext,
    goPrevious,
    goNext,
    refresh: () => {
      if (sender) {
        setPage(1)
        void list.refetch()
      }
    },
  }
}
