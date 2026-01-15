import { nearestUsableTick, priceToClosestTick, tickToPrice } from '@kyber/utils/dist/uniswapv3'

import {
  getFeeYieldCondition,
  getPriceCondition,
  getTimeCondition,
  isFeeYieldCondition,
  isPriceCondition,
  isTimeCondition,
} from 'pages/Earns/components/SmartExit/utils/typeGuards'
import {
  ConditionType,
  FeeYieldCondition,
  Metric,
  PAIR_CATEGORY,
  ParsedPosition,
  PriceCondition,
  SelectedMetric,
  TimeCondition,
} from 'pages/Earns/types'
import { toString } from 'utils/numbers'

export {
  getFeeYieldCondition,
  getPriceCondition,
  getTimeCondition,
  isFeeYieldCondition,
  isPriceCondition,
  isTimeCondition,
}

export const defaultFeeYieldCondition: FeeYieldCondition = ''
export const defaultPriceCondition: PriceCondition = { gte: '', lte: '' }
export const defaultTimeCondition: TimeCondition = { time: null, condition: 'after' }

export const getDefaultCondition = (
  metric: Metric,
  position?: ParsedPosition,
): FeeYieldCondition | PriceCondition | TimeCondition | null => {
  switch (metric) {
    case Metric.FeeYield:
      return defaultFeeYieldCondition
    case Metric.PoolPrice:
      if (position) {
        const pairCategory = position.pool.category
        const gap =
          pairCategory === PAIR_CATEGORY.STABLE ? 0.0001 : pairCategory === PAIR_CATEGORY.CORRELATED ? 0.001 : 0.1
        const defaultPrice = position.priceRange.current * (1 + gap)
        const tick = priceToClosestTick(toString(defaultPrice), position.token0.decimals, position.token1.decimals)
        if (tick === undefined) return defaultPriceCondition
        const nearestTick = nearestUsableTick(tick, position.pool.tickSpacing)
        const correctedPrice = tickToPrice(nearestTick, position.token0.decimals, position.token1.decimals)

        return {
          gte: correctedPrice,
          lte: '',
        }
      }
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
    switch (metric.metric) {
      case Metric.FeeYield: {
        const feeYieldCondition = getFeeYieldCondition(metric)
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
      }

      case Metric.PoolPrice: {
        const priceCondition = getPriceCondition(metric)
        if (priceCondition && (priceCondition.gte || priceCondition.lte)) {
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
      }

      case Metric.Time: {
        const timeCondition = getTimeCondition(metric)
        if (timeCondition && timeCondition.time) {
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
    }
  })

  return {
    logical: {
      op: conditionType,
      conditions,
    },
  }
}
