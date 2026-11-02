import { useCallback, useEffect, useRef, useState } from 'react'
import walletTransactionsApi, { useGetTransactionsInfiniteQueryState } from 'services/walletTransactionsApi'

import { useCrossChainTransactions } from 'state/crossChainSwap'
import { useAppDispatch } from 'state/hooks'

import { HISTORY_PAGE_SIZE, getLoadedHistory } from './history'

// The page owns only cursor navigation. The page-level updater owns the cache
// subscription and polling, so closing History does not stop KD refreshes.
export const useUnifiedTransactionHistory = (sender: string) => {
  const dispatch = useAppDispatch()
  const local = useCrossChainTransactions()
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const list = useGetTransactionsInfiniteQueryState(sender, { skip: !sender })
  const loaded = getLoadedHistory(list.currentData?.pages ?? [], local, sender)
  const lastPage = Math.max(1, Math.ceil(loaded.transactions.length / HISTORY_PAGE_SIZE))
  const end = page * HISTORY_PAGE_SIZE
  const canGoPrevious = page > 1
  const canGoNext = !!sender && (loaded.transactions.length > end || loaded.hasMore)

  const fetchNextPage = useCallback(
    () =>
      dispatch(
        walletTransactionsApi.endpoints.getTransactions.initiate(sender, {
          direction: 'forward',
          subscribe: false,
        }),
      ),
    [dispatch, sender],
  )

  const goNext = async () => {
    if (!canGoNext || loadingMore || list.isFetching) return
    setLoadingMore(true)
    try {
      let next = loaded
      const targetPage = loaded.transactions.length < end ? page : page + 1
      while (next.transactions.length < targetPage * HISTORY_PAGE_SIZE && next.hasMore) {
        const result = await fetchNextPage()
        if (!mounted.current || result.error) return
        next = getLoadedHistory(result.data?.pages ?? [], local, sender)
      }
      if (next.transactions.length > (targetPage - 1) * HISTORY_PAGE_SIZE)
        setPage(current => (current === page ? targetPage : current))
    } finally {
      if (mounted.current) setLoadingMore(false)
    }
  }

  const goPrevious = () => setPage(current => Math.max(1, current - 1))

  useEffect(() => {
    if (list.currentData && !loaded.hasMore) setPage(current => Math.min(current, lastPage))
  }, [list.currentData, loaded.hasMore, lastPage])

  useEffect(() => {
    if (loaded.transactions.length < end && loaded.hasMore && !list.isFetching && !list.isError && !loadingMore)
      void fetchNextPage()
  }, [end, fetchNextPage, loaded.transactions.length, loaded.hasMore, list.isFetching, list.isError, loadingMore])

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
      if (!sender) return
      setPage(1)
      void dispatch(
        walletTransactionsApi.endpoints.getTransactions.initiate(sender, {
          subscribe: false,
          forceRefetch: true,
        }),
      )
    },
  }
}
