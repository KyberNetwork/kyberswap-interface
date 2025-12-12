import { useEffect, useMemo, useState } from 'react'

import {
  getFeeYieldCondition,
  getPriceCondition,
  getTimeCondition,
} from 'pages/Earns/components/SmartExit/utils/typeGuards'
import { Metric, SelectedMetric } from 'pages/Earns/types'

/**
 * Custom hook to validate Smart Exit conditions
 * Returns validation flags for each metric type
 */
export const useSmartExitValidation = (selectedMetrics: Array<SelectedMetric | null>, deadline?: number) => {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const hasTimeMetric = selectedMetrics.some(
      metric => metric !== null && metric.metric === Metric.Time && getTimeCondition(metric)?.time,
    )
    if (!hasTimeMetric) return

    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [selectedMetrics])

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

  const { invalidTimeCondition, deadlineBeforeConditionTime, timeBeforeNow } = useMemo(() => {
    const timeMetric = selectedMetrics.find(metric => metric !== null && metric.metric === Metric.Time)
    if (!timeMetric) return { invalidTimeCondition: false, deadlineBeforeConditionTime: false, timeBeforeNow: false }

    const timeCondition = getTimeCondition(timeMetric)
    if (!timeCondition || !timeCondition.time)
      return { invalidTimeCondition: true, deadlineBeforeConditionTime: false, timeBeforeNow: false }

    const deadlineMs = deadline ? deadline * 1000 : null
    return {
      invalidTimeCondition: false,
      deadlineBeforeConditionTime: deadlineMs !== null && deadlineMs < timeCondition.time,
      timeBeforeNow: timeCondition.time < now,
    }
  }, [deadline, now, selectedMetrics])

  const isValid =
    !invalidYieldCondition &&
    !invalidPriceCondition &&
    !invalidTimeCondition &&
    !deadlineBeforeConditionTime &&
    !timeBeforeNow

  return {
    invalidYieldCondition,
    invalidPriceCondition,
    invalidTimeCondition,
    deadlineBeforeConditionTime,
    timeBeforeNow,
    isValid,
  }
}
