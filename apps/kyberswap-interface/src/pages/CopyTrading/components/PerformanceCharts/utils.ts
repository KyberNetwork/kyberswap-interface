import type { PerformancePoint } from 'services/copyTrading/types/agents'

import { formatDisplayNumber } from 'utils/numbers'

const DEFAULT_TICK_COUNT = 5
const NICE_STEP_MULTIPLIERS = [1, 2, 2.5, 5, 10] as const

export const Y_AXIS_WIDTH = 48

export type PerformanceChartPoint = {
  timestamp: number
  portfolioValueUsd?: number
  realizedPnlUsd?: number
  totalPnlUsd?: number
  valuePct?: number
}

export type PnlDataKey = 'totalPnlUsd' | 'valuePct'

export type YAxisScale = {
  domain: [number, number]
  ticks: number[]
}

const getNiceStep = (rawStep: number) => {
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const normalizedStep = rawStep / magnitude
  const multiplier = NICE_STEP_MULTIPLIERS.find(value => normalizedStep <= value) ?? 10

  return multiplier * magnitude
}

const normalizeTick = (value: number) => {
  const normalized = Number(value.toPrecision(12))
  return Object.is(normalized, -0) ? 0 : normalized
}

export const compactAxisUsd = (value: number) =>
  formatDisplayNumber(value, { allowDisplayNegative: true, significantDigits: 2, style: 'currency' })

const compactAxisPercent = (value: number) =>
  `${formatDisplayNumber(value, { allowDisplayNegative: true, significantDigits: 2 })}%`

export const formatPnlAxisTick = (value: number, metric: 'usd' | 'return') =>
  metric === 'return' ? compactAxisPercent(value) : compactAxisUsd(value)

const toChartNumber = (value?: string) => {
  if (value === undefined) return undefined

  const amount = Number(value)
  return Number.isFinite(amount) ? amount : undefined
}

export const toPerformanceChartPoint = (point: PerformancePoint): PerformanceChartPoint => ({
  timestamp: new Date(point.timestamp).getTime(),
  portfolioValueUsd: toChartNumber(point.portfolioValueUsd),
  realizedPnlUsd: toChartNumber(point.realizedPnlUsd),
  totalPnlUsd: toChartNumber(point.totalPnlUsd),
  valuePct: toChartNumber(point.valuePct),
})

export const getPnlGradientOffset = (data: PerformanceChartPoint[], dataKey: PnlDataKey) => {
  const values = data.map(point => point[dataKey]).filter(value => value !== undefined)
  if (!values.length) return 1
  const maximum = Math.max(...values)
  const minimum = Math.min(...values)

  if (maximum <= 0) return 0
  if (minimum >= 0) return 1
  return maximum / (maximum - minimum)
}

/**
 * Builds a zero-inclusive Y-axis with human-friendly intervals such as
 * 1, 2, 2.5 or 5 multiplied by a power of ten.
 */
export const getRoundedYAxisScale = (
  values: Array<number | undefined>,
  targetTickCount = DEFAULT_TICK_COUNT,
): YAxisScale | undefined => {
  const finiteValues = values.filter((value): value is number => value !== undefined && Number.isFinite(value))
  if (!finiteValues.length) return undefined

  const minimum = Math.min(0, ...finiteValues)
  const maximum = Math.max(0, ...finiteValues)
  const span = maximum - minimum || 1
  const intervalCount = Math.max(1, targetTickCount - 1)
  const step = getNiceStep(span / intervalCount)
  const minimumStep = Math.floor(minimum / step)
  const maximumStep = Math.ceil(maximum / step)
  const ticks = Array.from({ length: maximumStep - minimumStep + 1 }, (_, index) =>
    normalizeTick((minimumStep + index) * step),
  )

  return {
    domain: [ticks[0], ticks[ticks.length - 1]],
    ticks,
  }
}
