import { useQuery } from '@tanstack/react-query'
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

/** TanStack owns quote data/loading/polling; local state is only the visible countdown. */
const useGetRoute = (args: ArgsGetRoute) => {
  const request = useRouteRequest(args)
  const { enabled = true, isProcessingSwap = false, autoRefresh = false } = args

  const requestKey = JSON.stringify(request?.queryKey ?? null)
  const debouncedKey = useDebounce(requestKey, INPUT_DEBOUNCE_TIME)
  const inputPending = requestKey !== debouncedKey
  const canFetch = Boolean(request && enabled && !isProcessingSwap && !inputPending)

  const query = useQuery({
    queryKey: request?.queryKey ?? ['swap-route', null],
    queryFn: request?.queryFn,
    enabled: canFetch,
    // Never treat a previous quote as fresh or retain it after its observers leave.
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: query =>
      canFetch && autoRefresh && query.state.fetchStatus !== 'fetching' ? REFRESH_SECONDS * 1000 : false,
    refetchIntervalInBackground: true,
  })

  const { refetch } = query
  const fetcher = useCallback(() => {
    if (canFetch) void refetch({ cancelRefetch: false })
  }, [canFetch, refetch])

  const nextManualRefreshAt = useRef(0)
  const onRefresh = useCallback(() => {
    if (!canFetch || query.isFetching || Date.now() < nextManualRefreshAt.current) return

    nextManualRefreshAt.current = Date.now() + 2000
    fetcher()
  }, [canFetch, query.isFetching, fetcher])

  const settledAt = Math.max(query.dataUpdatedAt, query.errorUpdatedAt)
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    if (!canFetch || !autoRefresh || query.isFetching || !settledAt) return

    setNow(Date.now())
    const ticker = setInterval(() => setNow(Date.now()), 1000)

    return () => clearInterval(ticker)
  }, [canFetch, autoRefresh, query.isFetching, settledAt])

  const countdown =
    canFetch && autoRefresh && !query.isFetching && settledAt
      ? Math.max(0, REFRESH_SECONDS * 1000 - Math.max(0, now - settledAt))
      : 0

  const isLoading = Boolean(enabled && !isProcessingSwap && request && (inputPending || query.isFetching))
  const data = enabled && !inputPending ? query.data : undefined

  return {
    fetcher,
    result: { data: data?.response, error: enabled && !inputPending ? query.error : null, isFetching: isLoading },
    isLoading,
    intendedFeeConfig: data?.intendedFeeConfig ?? EMPTY_FEE_CONFIG,
    refresh: { countdown, refreshTime: REFRESH_SECONDS, disableRefresh: !canFetch, isRefreshing: isLoading, onRefresh },
  }
}

export type SwapQuoteRefresh = ReturnType<typeof useGetRoute>['refresh']
export default useGetRoute
