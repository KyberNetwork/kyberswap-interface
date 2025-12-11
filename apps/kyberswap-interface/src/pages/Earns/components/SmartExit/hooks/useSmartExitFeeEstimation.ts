import { useEffect, useRef, useState } from 'react'

import { INPUT_DEBOUNCE_TIME } from 'constants/index'
import { useSmartExit } from 'pages/Earns/components/SmartExit/useSmartExit'
import { ConditionType, ParsedPosition, SelectedMetric, SmartExitFee } from 'pages/Earns/types'

interface UseSmartExitFeeEstimationParams {
  position: ParsedPosition
  selectedMetrics: Array<SelectedMetric | null>
  conditionType: ConditionType
  deadline: number
  isValid: boolean
}

/**
 * Custom hook to handle fee estimation with automatic retry on validation changes
 */
export const useSmartExitFeeEstimation = ({
  position,
  selectedMetrics,
  conditionType,
  deadline,
  isValid,
}: UseSmartExitFeeEstimationParams) => {
  const [feeInfo, setFeeInfo] = useState<SmartExitFee | null>(null)
  const [feeLoading, setFeeLoading] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { estimateFee } = useSmartExit({
    position,
    selectedMetrics,
    conditionType,
    deadline,
  })

  useEffect(() => {
    if (!isValid) {
      setFeeInfo(null)
      // Clear any pending debounced calls
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      return
    }

    // Clear previous timeout if it exists
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    let cancelled = false

    const call = async () => {
      setFeeLoading(true)
      try {
        const res = await estimateFee()
        if (!cancelled) setFeeInfo(res)
      } catch {
        if (!cancelled) setFeeInfo(null)
      } finally {
        if (!cancelled) setFeeLoading(false)
      }
    }

    // Debounce the call to estimateFee
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null
      call()
    }, INPUT_DEBOUNCE_TIME)

    return () => {
      cancelled = true
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [estimateFee, isValid])

  return {
    feeInfo,
    feeLoading,
  }
}
