import { useEffect, useMemo, useState } from 'react'

import {
  getFeeYieldCondition,
  getPriceCondition,
  getTimeCondition,
} from 'pages/Earns/components/SmartExit/utils/typeGuards'
import { ConditionType, Metric, SelectedMetric } from 'pages/Earns/types'

/**
 * Custom hook to validate Smart Exit conditions
 * Returns validation flags for each metric type
 */
export const useSmartExitValidation = (
  selectedMetrics: Array<SelectedMetric | null>,
  deadline?: number,
  conditionType?: ConditionType,
) => {
  const [timeValidation, setTimeValidation] = useState(() => ({
    invalidTimeCondition: false,
    deadlineBeforeConditionTime: false,
    timeBeforeNow: false,
  }))

  useEffect(() => {
    const computeNext = () => {
      const timeMetric = selectedMetrics.find(metric => metric !== null && metric.metric === Metric.Time)
      if (!timeMetric) {
        return { invalidTimeCondition: false, deadlineBeforeConditionTime: false, timeBeforeNow: false }
      }

      const timeCondition = getTimeCondition(timeMetric)
      if (!timeCondition || !timeCondition.time) {
        return { invalidTimeCondition: true, deadlineBeforeConditionTime: false, timeBeforeNow: false }
      }

      const deadlineMs = deadline ? deadline * 1000 : null
      return {
        invalidTimeCondition: false,
        deadlineBeforeConditionTime: deadlineMs !== null && deadlineMs < timeCondition.time,
        timeBeforeNow: timeCondition.time < Date.now(),
      }
    }

    const update = () => {
      const next = computeNext()
      setTimeValidation(prev =>
        prev.invalidTimeCondition === next.invalidTimeCondition &&
        prev.deadlineBeforeConditionTime === next.deadlineBeforeConditionTime &&
        prev.timeBeforeNow === next.timeBeforeNow
          ? prev
          : next,
      )
    }

    update()

    const timeMetric = selectedMetrics.find(metric => metric !== null && metric.metric === Metric.Time) || null
    const hasValidTimeMetric = timeMetric !== null && Boolean(getTimeCondition(timeMetric)?.time)

    if (!hasValidTimeMetric) return

    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [deadline, selectedMetrics])

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
    return timeValidation
  }, [timeValidation])

  const orWithTimeAlreadyMet = useMemo(() => {
    if (conditionType !== ConditionType.Or) return { isAlreadyMet: false, conditionTime: undefined }

    const timeMetric = selectedMetrics.find(metric => metric !== null && metric.metric === Metric.Time)
    if (!timeMetric) return { isAlreadyMet: false, conditionTime: undefined }

    const timeCondition = getTimeCondition(timeMetric)
    if (!timeCondition || !timeCondition.time || timeCondition.condition !== 'before') {
      return { isAlreadyMet: false, conditionTime: undefined }
    }

    const hasOtherMetric = selectedMetrics.some(metric => metric !== null && metric.metric !== Metric.Time)
    if (!hasOtherMetric) return { isAlreadyMet: false, conditionTime: undefined }

    const isAlreadyMet = timeCondition.time > Date.now()
    const conditionTime = new Date(timeCondition.time).toLocaleString()

    return { isAlreadyMet, conditionTime }
  }, [conditionType, selectedMetrics])

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
    orWithTimeAlreadyMet: orWithTimeAlreadyMet.isAlreadyMet,
    conditionTime: orWithTimeAlreadyMet.conditionTime,
    isValid,
  }
}
