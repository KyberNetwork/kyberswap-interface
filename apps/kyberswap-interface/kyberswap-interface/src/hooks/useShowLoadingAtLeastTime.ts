import { useEffect, useState } from 'react'

/**
 * This hook to ensure loading is displayed at least "duration" mili seconds
 * @param loadingState: (ex: isFetch from rtk query)
 * @param duration
 * @returns
 */
export default function useShowLoadingAtLeastTime(loadingState = false, duration = 500) {
  const [shouldShowLoading, setShouldShowLoading] = useState(true)

  useEffect(() => {
    if (loadingState) setShouldShowLoading(true)
  }, [loadingState])

  useEffect(() => {
    const existingTimeout = setTimeout(() => {
      setShouldShowLoading(false)
    }, duration)
    return () => {
      existingTimeout && clearTimeout(existingTimeout)
    }
  }, [duration, shouldShowLoading])

  return shouldShowLoading || loadingState
}
