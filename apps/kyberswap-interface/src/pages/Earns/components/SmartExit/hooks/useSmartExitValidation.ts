import { useMemo } from 'react'

import { Metric, SelectedMetric } from 'pages/Earns/types'

import { getFeeYieldCondition, getPriceCondition, getTimeCondition } from '../utils/typeGuards'

/**
 * Custom hook to validate Smart Exit conditions
 * Returns validation flags for each metric type
 */
export const useSmartExitValidation = (selectedMetrics: Array<SelectedMetric | null>) => {
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

  const invalidTimeCondition = useMemo(() => {
    const timeMetric = selectedMetrics.find(metric => metric !== null && metric.metric === Metric.Time)
    if (!timeMetric) return false

    const timeCondition = getTimeCondition(timeMetric)
    return !timeCondition || !timeCondition.time
  }, [selectedMetrics])

  const isValid = !invalidYieldCondition && !invalidPriceCondition && !invalidTimeCondition

  return {
    invalidYieldCondition,
    invalidPriceCondition,
    invalidTimeCondition,
    isValid,
  }
}
