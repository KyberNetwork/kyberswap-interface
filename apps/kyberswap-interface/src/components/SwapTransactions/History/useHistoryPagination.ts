import { useCallback, useEffect, useRef, useState } from 'react'
import walletTransactionsApi, { useGetTransactionsInfiniteQueryState } from 'services/walletTransactionsApi'

import { HISTORY_PAGE_SIZE, getLoadedHistory, mergeTransactionHistory } from 'components/SwapTransactions/history'
import { selectLocalSwapHistory } from 'components/SwapTransactions/localTransactionSelectors'
import { useAppDispatch, useAppSelector } from 'state/hooks'

// The page owns only cursor navigation. The page-level updater owns the cache
// subscription and polling, so closing History does not stop KD refreshes.
export const useHistoryPagination = (sender: string) => {
  const dispatch = useAppDispatch()
  const local = useAppSelector(selectLocalSwapHistory)
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const navigation = useRef<symbol | undefined>(undefined)
  const latestLocal = useRef(local)
  latestLocal.current = local

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

  // A failed next page retries its cursor; an initial/refetch failure must
  // refresh the existing pages, even when there is no next cursor.
  const retryHistory = () =>
    dispatch((dispatch, getState) => {
      const current = walletTransactionsApi.endpoints.getTransactions.select(sender)(getState())
      if (current.isLoading || !sender) return
      return dispatch(
        walletTransactionsApi.endpoints.getTransactions.initiate(sender, {
          subscribe: false,
          ...(current.isFetchNextPageError ? { direction: 'forward' as const } : { forceRefetch: true }),
        }),
      )
    })

  const goNext = async () => {
    if (!canGoNext || navigation.current || list.isFetching) return

    const request = Symbol()
    navigation.current = request
    setLoadingMore(true)

    try {
      let next = loaded
      const targetPage = loaded.transactions.length < end ? page : page + 1

      // Deduplication can leave a display page short even after one API cursor advances.
      while (next.transactions.length < targetPage * HISTORY_PAGE_SIZE && next.hasMore) {
        const result = await fetchNextPage()
        if (navigation.current !== request || result.error) return

        next = getLoadedHistory(result.data?.pages ?? [], latestLocal.current, sender)
      }

      if (next.transactions.length > (targetPage - 1) * HISTORY_PAGE_SIZE)
        setPage(current => (current === page ? targetPage : current))
    } finally {
      if (navigation.current === request) {
        navigation.current = undefined
        setLoadingMore(false)
      }
    }
  }

  const goPrevious = () => {
    navigation.current = undefined
    setLoadingMore(false)
    setPage(current => Math.max(1, current - 1))
  }

  useEffect(() => {
    return () => {
      navigation.current = undefined
    }
  }, [])

  useEffect(() => {
    if (list.currentData && !loaded.hasMore) setPage(current => Math.min(current, lastPage))
  }, [list.currentData, loaded.hasMore, lastPage])

  useEffect(() => {
    if (loaded.transactions.length < end && loaded.hasMore && !list.isFetching && !list.isError && !loadingMore)
      void fetchNextPage()
  }, [end, fetchNextPage, loaded.transactions.length, loaded.hasMore, list.isFetching, list.isError, loadingMore])

  return {
    transactions: loaded.transactions.slice((page - 1) * HISTORY_PAGE_SIZE, end),
    searchTransactions: mergeTransactionHistory({
      server: list.currentData?.pages.flatMap(page => page.transactions) ?? [],
      local,
      sender,
    }),
    hasMore: loaded.hasMore,
    loadMore: fetchNextPage,
    retryHistory,
    isError: list.isError,
    loadingMore: !!sender && (loadingMore || list.isFetching),
    currentPage: page,
    canGoPrevious,
    canGoNext,
    goPrevious,
    goNext,
  }
}
