import { FeeYieldCondition, Metric, PriceCondition, SelectedMetric, TimeCondition } from 'pages/Earns/types'

/**
 * Type guard to check if condition is FeeYieldCondition
 */
export const isFeeYieldCondition = (
  metric: SelectedMetric | null,
): metric is SelectedMetric & { condition: FeeYieldCondition } => {
  return metric !== null && metric.metric === Metric.FeeYield
}

/**
 * Type guard to check if condition is PriceCondition
 */
export const isPriceCondition = (
  metric: SelectedMetric | null,
): metric is SelectedMetric & { condition: PriceCondition } => {
  return metric !== null && metric.metric === Metric.PoolPrice
}

/**
 * Type guard to check if condition is TimeCondition
 */
export const isTimeCondition = (
  metric: SelectedMetric | null,
): metric is SelectedMetric & { condition: TimeCondition } => {
  return metric !== null && metric.metric === Metric.Time
}

/**
 * Type guard to safely get FeeYieldCondition
 */
export const getFeeYieldCondition = (metric: SelectedMetric | null): FeeYieldCondition | null => {
  if (isFeeYieldCondition(metric)) {
    return metric.condition
  }
  return null
}

/**
 * Type guard to safely get PriceCondition
 */
export const getPriceCondition = (metric: SelectedMetric | null): PriceCondition | null => {
  if (isPriceCondition(metric)) {
    return metric.condition
  }
  return null
}

/**
 * Type guard to safely get TimeCondition
 */
export const getTimeCondition = (metric: SelectedMetric | null): TimeCondition | null => {
  if (isTimeCondition(metric)) {
    return metric.condition
  }
  return null
}
