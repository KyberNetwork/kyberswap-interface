import { FeeYieldCondition, Metric, PriceCondition, TimeCondition } from 'pages/Earns/types'

export const defaultFeeYieldCondition: FeeYieldCondition = '0'
const defaultPriceCondition: PriceCondition = { gte: '', lte: '' }
const defaultTimeCondition: TimeCondition = { time: null, condition: 'after' }

export const getDefaultCondition = (metric: Metric): FeeYieldCondition | PriceCondition | TimeCondition | null => {
  switch (metric) {
    case Metric.FeeYield:
      return defaultFeeYieldCondition
    case Metric.PoolPrice:
      return defaultPriceCondition
    case Metric.Time:
      return defaultTimeCondition
    default:
      return null
  }
}
