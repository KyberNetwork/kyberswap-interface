import { skipToken, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'

import useRouteRequest, { ArgsRouteRequest, IntendedFeeConfig } from 'components/SwapForm/hooks/useRouteRequest'
import { INPUT_DEBOUNCE_TIME } from 'constants/index'
import useDebounce from 'hooks/useDebounce'
import { ChargeFeeBy } from 'types/route'

const REFRESH_SECONDS = 10
const EMPTY_FEE_CONFIG: IntendedFeeConfig = {
  feeAmount: '',
  feeReceiver: '',
  isInBps: '',
  chargeFeeBy: ChargeFeeBy.NONE,
}

export type ArgsGetRoute = ArgsRouteRequest & {
  enabled?: boolean
  isProcessingSwap?: boolean
  autoRefresh?: boolean
}

/** TanStack owns quote data/loading/polling; the review pauses fetching. */
const useGetRoute = (args: ArgsGetRoute) => {
  const queryClient = useQueryClient()
  const request = useRouteRequest(args)
  const { enabled = true, isProcessingSwap = false, autoRefresh = false } = args

  const requestKey = JSON.stringify(request?.queryKey ?? null)
  const debouncedKey = useDebounce(requestKey, INPUT_DEBOUNCE_TIME)
  const inputPending = requestKey !== debouncedKey
  const canFetch = Boolean(request && enabled && !isProcessingSwap && !inputPending)

  const query = useQuery({
    queryKey: request?.queryKey ?? ['swap-route', null],
    queryFn: request?.queryFn ?? skipToken,
    enabled: canFetch,
    // Closing an unsubmitted review may reuse its quote within the normal refresh window.
    staleTime: REFRESH_SECONDS * 1000,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: query => {
      if (!canFetch || !autoRefresh || query.state.fetchStatus !== 'idle') return false
      const settledAt = Math.max(query.state.dataUpdatedAt, query.state.errorUpdatedAt)
      return Math.max(1, REFRESH_SECONDS * 1000 - (Date.now() - settledAt))
    },
    refetchIntervalInBackground: true,
  })

  // A fetch waiting for connectivity must keep the CTA blocked, just like an active fetch.
  const waitingForRoute = query.isFetching || query.isPaused
  const settledAt = Math.max(query.dataUpdatedAt, query.errorUpdatedAt)
  const [now, setNow] = useState(Date.now)

  const countdown =
    canFetch && autoRefresh && !waitingForRoute && settledAt
      ? Math.max(0, REFRESH_SECONDS * 1000 - Math.max(0, now - settledAt))
      : 0

  const isLoading = Boolean(enabled && !isProcessingSwap && request && (inputPending || waitingForRoute))
  const data = enabled && !inputPending ? query.data : undefined

  const invalidateQuote = () => {
    if (!request) return
    // Keep the current review snapshot, but prevent late work from making this cache fresh again.
    void queryClient.cancelQueries({ queryKey: request.queryKey, exact: true })
    void queryClient.invalidateQueries({ queryKey: request.queryKey, exact: true, refetchType: 'none' })
  }

  const { refetch } = query
  const fetcher = useCallback(() => {
    if (canFetch) void refetch({ cancelRefetch: false })
  }, [canFetch, refetch])

  const nextManualRefreshAt = useRef(0)
  const onRefresh = useCallback(() => {
    if (!canFetch || waitingForRoute || Date.now() < nextManualRefreshAt.current) return

    nextManualRefreshAt.current = Date.now() + 2000
    fetcher()
  }, [canFetch, waitingForRoute, fetcher])

  useEffect(() => {
    if (!canFetch || !autoRefresh || waitingForRoute || !settledAt) return

    setNow(Date.now())
    const ticker = setInterval(() => setNow(Date.now()), 1000)

    return () => clearInterval(ticker)
  }, [canFetch, autoRefresh, waitingForRoute, settledAt])

  return {
    fetcher,
    invalidateQuote,
    result: {
      data: data?.response,
      error: enabled && !inputPending ? query.error : null,
      isFetching: isLoading,
    },
    isLoading,
    intendedFeeConfig: data?.intendedFeeConfig ?? EMPTY_FEE_CONFIG,
    refresh: { countdown, refreshTime: REFRESH_SECONDS, disableRefresh: !canFetch, isRefreshing: isLoading, onRefresh },
  }
}

export type SwapQuoteRefresh = ReturnType<typeof useGetRoute>['refresh']
export default useGetRoute
