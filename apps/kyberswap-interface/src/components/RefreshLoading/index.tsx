import { useEffect, useRef, useState } from 'react'

import RefreshIndicator from 'components/RefreshLoading/RefreshIndicator'
import useDebounce from 'hooks/useDebounce'
import useShowLoadingAtLeastTime from 'hooks/useShowLoadingAtLeastTime'

const INTERVAL_REFETCH_TIME = 10 // seconds
const MIN_REFRESH_TIME = 2 // seconds

type Props = {
  refetchLoading: boolean
  clickable?: boolean
  refreshTime?: number
  refreshOnMount?: boolean
  disableRefresh?: boolean
  onRefresh: () => void
}

/**
 * TODO: Refactor before adding more usages. This component currently owns the
 * refresh UI, mount refresh, countdown scheduler, and manual-click throttling.
 * The target shape should make the spinner mostly presentational and make
 * refresh scheduling an explicit caller-owned choice, so callback identity
 * changes cannot accidentally trigger extra fetches. Preserve the current
 * countdown refresh, disableRefresh behavior, minimum loading display, and
 * manual refresh throttle when splitting these responsibilities.
 */
export default function RefreshLoading({
  refetchLoading,
  clickable = false,
  refreshTime = INTERVAL_REFETCH_TIME,
  refreshOnMount = true,
  disableRefresh = false,
  onRefresh,
}: Props) {
  const [countdown, setCountdown] = useState(0)
  const disableManualRefresh = useRef(false)

  const debouncedRefetchLoading = useDebounce(refetchLoading, 100)
  const showLoadingAtLeastTime = useShowLoadingAtLeastTime(debouncedRefetchLoading, 200)

  const handleManualRefresh = () => {
    if (disableRefresh || disableManualRefresh.current || !clickable) return
    disableManualRefresh.current = true
    onRefresh()
    setTimeout(() => {
      disableManualRefresh.current = false
    }, MIN_REFRESH_TIME * 1_000)
  }

  useEffect(() => {
    if (disableRefresh) return
    if (!refetchLoading && !showLoadingAtLeastTime) setCountdown(refreshTime * 1_000)
    else if (refetchLoading && showLoadingAtLeastTime) setCountdown(0)
  }, [refetchLoading, showLoadingAtLeastTime, refreshTime, disableRefresh])

  useEffect(() => {
    if (countdown <= 0 || disableRefresh) return

    const interval = setInterval(() => {
      const newCountdown = countdown - 10
      setCountdown(newCountdown)
      if (newCountdown === 10) {
        onRefresh()
      }
    }, 10)

    return () => {
      clearInterval(interval)
    }
  }, [countdown, onRefresh, disableRefresh])

  useEffect(() => {
    if (!refreshOnMount) return
    onRefresh()
  }, [onRefresh, refreshOnMount])

  return (
    <RefreshIndicator
      countdown={countdown}
      refreshTime={refreshTime}
      disableRefresh={disableRefresh}
      onRefresh={handleManualRefresh}
      clickable={clickable}
    />
  )
}
