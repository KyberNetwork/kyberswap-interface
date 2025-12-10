import { DEX_TYPE_MAPPING } from 'pages/Earns/components/SmartExit/constants'
import { Exchange } from 'pages/Earns/constants'
import {
  ConditionType,
  FeeYieldCondition,
  Metric,
  PriceCondition,
  SelectedMetric,
  TimeCondition,
} from 'pages/Earns/types'

export const defaultFeeYieldCondition: FeeYieldCondition = ''
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

export const buildConditions = (selectedMetrics: SelectedMetric[], conditionType: ConditionType) => {
  const conditions: Array<{
    field: {
      type: Metric
      value: any
    }
  }> = []

  selectedMetrics.forEach(metric => {
    const feeYieldCondition = metric.condition as FeeYieldCondition
    const priceCondition = metric.condition as PriceCondition
    const timeCondition = metric.condition as TimeCondition

    switch (metric.metric) {
      case Metric.FeeYield:
        if (feeYieldCondition) {
          conditions.push({
            field: {
              type: Metric.FeeYield,
              value: {
                gte: parseFloat(feeYieldCondition),
              },
            },
          })
        }
        break

      case Metric.PoolPrice:
        if (priceCondition.gte || priceCondition.lte) {
          conditions.push({
            field: {
              type: Metric.PoolPrice,
              value: {
                ...(priceCondition.gte ? { gte: parseFloat(priceCondition.gte) } : {}),
                ...(priceCondition.lte ? { lte: parseFloat(priceCondition.lte) } : {}),
              },
            },
          })
        }
        break

      case Metric.Time:
        if (timeCondition.time) {
          const timeValue = Math.floor(timeCondition.time / 1000)
          if (timeCondition.condition === 'before') {
            conditions.push({
              field: {
                type: Metric.Time,
                value: {
                  lte: timeValue,
                },
              },
            })
          } else {
            conditions.push({
              field: {
                type: Metric.Time,
                value: {
                  gte: timeValue,
                },
              },
            })
          }
        }
        break
    }
  })

  return {
    logical: {
      op: conditionType,
      conditions,
    },
  }
}

export const getDexType = (exchange: Exchange) => DEX_TYPE_MAPPING[exchange] || exchange
