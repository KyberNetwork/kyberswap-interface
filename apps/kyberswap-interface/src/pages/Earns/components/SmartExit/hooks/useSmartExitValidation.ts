import { useMemo } from 'react'

import { Metric, SelectedMetric } from 'pages/Earns/types'

import { getFeeYieldCondition, getPriceCondition, getTimeCondition } from '../utils/typeGuards'

/**
 * Custom hook to validate Smart Exit conditions
 * Returns validation flags for each metric type
 */
export const useSmartExitValidation = (selectedMetrics: Array<SelectedMetric | null>, deadline?: number) => {
  const invalidYieldCondition = useMemo(() => {
    const feeYieldMetric = selectedMetrics.find(metric => metric !== null && metric.metric === Metric.FeeYield)
    if (!feeYieldMetric) return false

    const feeYieldCondition = getFeeYieldCondition(feeYieldMetric)
    return !feeYieldCondition || parseFloat(feeYieldCondition) === 0
  }, [selectedMetrics])

  const invalidPriceCondition = useMemo(() => {
    const priceMetric = selectedMetrics.find(metric => metric !== null && metric.metric === Metric.PoolPrice)
    if (!priceMetric) return false

    const priceCondition = getPriceCondition(priceMetric)
    return !priceCondition || (!priceCondition.gte && !priceCondition.lte)
  }, [selectedMetrics])

  const { invalidTimeCondition, deadlineBeforeConditionTime } = useMemo(() => {
    const timeMetric = selectedMetrics.find(metric => metric !== null && metric.metric === Metric.Time)
    if (!timeMetric) return { invalidTimeCondition: false, deadlineBeforeConditionTime: false }

    const timeCondition = getTimeCondition(timeMetric)
    if (!timeCondition || !timeCondition.time) return { invalidTimeCondition: true, deadlineBeforeConditionTime: false }

    const deadlineMs = deadline ? deadline * 1000 : null
    return {
      invalidTimeCondition: false,
      deadlineBeforeConditionTime: deadlineMs !== null && deadlineMs < timeCondition.time,
    }
  }, [deadline, selectedMetrics])

  const isValid =
    !invalidYieldCondition && !invalidPriceCondition && !invalidTimeCondition && !deadlineBeforeConditionTime

  return {
    invalidYieldCondition,
    invalidPriceCondition,
    invalidTimeCondition,
    deadlineBeforeConditionTime,
    isValid,
  }
}
