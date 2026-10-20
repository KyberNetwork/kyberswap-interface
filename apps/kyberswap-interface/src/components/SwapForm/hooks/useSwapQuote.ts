import { useCallback, useEffect, useRef, useState } from 'react'

import useGetRoute, { ArgsGetRoute } from 'components/SwapForm/hooks/useGetRoute'
import useDebounce from 'hooks/useDebounce'
import useShowLoadingAtLeastTime from 'hooks/useShowLoadingAtLeastTime'

const REFRESH_SECONDS = 10
const MANUAL_REFRESH_DELAY = 2_000

/** Owns the quote lifecycle independently of whether the rate/summary UI is mounted. */
export default function useSwapQuote(args: ArgsGetRoute & { isWrapOrUnwrap: boolean }) {
  const quote = useGetRoute(args)
  const { fetcher, isLoading } = quote
  const enabled = Boolean(
    args.enabled !== false &&
      args.currencyIn &&
      args.currencyOut &&
      args.parsedAmount &&
      !args.isProcessingSwap &&
      !args.isWrapOrUnwrap,
  )
  const [countdown, setCountdown] = useState(0)
  const nextManualRefreshAt = useRef(0)
  const debouncedLoading = useDebounce(isLoading, 100)
  const showLoading = useShowLoadingAtLeastTime(debouncedLoading, 200)

  // useGetRoute memoizes fetcher from request inputs (pair, amount, network, fees, sources).
  useEffect(() => {
    if (enabled) void fetcher()
  }, [enabled, fetcher])

  useEffect(() => {
    if (!enabled || isLoading || showLoading) {
      setCountdown(0)
      return
    }

    const deadline = Date.now() + REFRESH_SECONDS * 1_000
    setCountdown(REFRESH_SECONDS * 1_000)
    const interval = setInterval(() => setCountdown(Math.max(0, deadline - Date.now())), 1_000)
    const timeout = setTimeout(() => {
      clearInterval(interval)
      setCountdown(0)
      void fetcher()
    }, REFRESH_SECONDS * 1_000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [enabled, fetcher, isLoading, showLoading])

  const refresh = useCallback(() => {
    if (!enabled || isLoading || Date.now() < nextManualRefreshAt.current) return
    nextManualRefreshAt.current = Date.now() + MANUAL_REFRESH_DELAY
    void fetcher()
  }, [enabled, fetcher, isLoading])

  return {
    ...quote,
    refresh: {
      countdown,
      refreshTime: REFRESH_SECONDS,
      disableRefresh: !enabled,
      onRefresh: refresh,
    },
  }
}

export type SwapQuoteRefresh = ReturnType<typeof useSwapQuote>['refresh']
