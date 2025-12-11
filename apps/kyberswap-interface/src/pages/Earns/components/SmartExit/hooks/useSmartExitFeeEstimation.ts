import { useEffect, useState } from 'react'

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

  const { estimateFee } = useSmartExit({
    position,
    selectedMetrics,
    conditionType,
    deadline,
  })

  useEffect(() => {
    if (!isValid) {
      setFeeInfo(null)
      return
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

    call()

    return () => {
      cancelled = true
    }
  }, [estimateFee, isValid])

  return {
    feeInfo,
    feeLoading,
  }
}
