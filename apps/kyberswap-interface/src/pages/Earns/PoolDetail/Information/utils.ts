import { formatAprNumber } from '@kyber/utils/number'
import dayjs from 'dayjs'
import type { PoolAnalyticsWindow } from 'services/earn/types'

import { type SegmentedControlOption } from 'components/SegmentedControl'
import { formatDisplayNumber } from 'utils/numbers'

export const CHART_WINDOW_OPTIONS: readonly SegmentedControlOption<PoolAnalyticsWindow>[] = [
  { label: '24H', value: '24h' },
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
]

const hasValue = (value?: number | null): value is number =>
  value !== undefined && value !== null && !Number.isNaN(value)

export const formatUsd = (value?: number, options?: { allowDisplayNegative?: boolean }) => {
  if (!hasValue(value)) return '--'
  return formatDisplayNumber(value, {
    style: 'currency',
    significantDigits: 6,
    ...options,
  })
}

export const formatApr = (value?: number) => (value || value === 0 ? `${formatAprNumber(value)}%` : '--')

export const formatPrice = (value?: number) => {
  if (!hasValue(value)) return '--'
  return formatDisplayNumber(value, {
    style: 'currency',
    significantDigits: value !== 0 && Math.abs(value) < 1 ? 8 : 6,
  })
}

export const formatRate = (value?: number) => {
  if (!hasValue(value)) return '--'
  return formatDisplayNumber(value, {
    significantDigits: value !== 0 && Math.abs(value) < 1 ? 8 : 6,
  })
}

export const formatSignedPercent = (value?: number) => {
  if (!hasValue(value)) return '--'
  return `${value > 0 ? '+' : value < 0 ? '-' : ''}${formatDisplayNumber(Math.abs(value), { significantDigits: 4 })}%`
}

export const formatCompactUsd = (value?: number) => {
  if (!hasValue(value)) return '--'
  return formatDisplayNumber(value, {
    style: 'currency',
    significantDigits: 3,
    allowDisplayNegative: true,
  })
}

export const getUniqueDateAxisTicks = <T extends { ts: number }>(points: T[], window: PoolAnalyticsWindow) => {
  if (window === '24h') return undefined

  const dates = new Set<string>()

  return points.reduce<number[]>((ticks, point) => {
    const date = dayjs.unix(point.ts).format('YYYY-MM-DD')

    if (!dates.has(date)) {
      dates.add(date)
      ticks.push(point.ts)
    }

    return ticks
  }, [])
}

export enum TimeLabelFormat {
  Date = 'date',
  DateTime = 'dateTime',
  Time = 'time',
}

type AxisTimeLabelOptions = {
  format?: TimeLabelFormat.Date | TimeLabelFormat.Time
}

type TooltipTimeLabelOptions = {
  format?: TimeLabelFormat.Date | TimeLabelFormat.DateTime
}

const TIME_LABEL_FORMATS: Record<TimeLabelFormat, string> = {
  [TimeLabelFormat.Date]: 'MMM D',
  [TimeLabelFormat.DateTime]: 'MMM D, HH:mm',
  [TimeLabelFormat.Time]: 'HH:mm',
}

export const formatAxisTimeLabel = (timestamp: number, window: PoolAnalyticsWindow, options?: AxisTimeLabelOptions) => {
  const format = options?.format ?? (window === '24h' ? TimeLabelFormat.Time : TimeLabelFormat.Date)

  return dayjs.unix(timestamp).format(TIME_LABEL_FORMATS[format])
}

export const formatTooltipTimeLabel = (
  timestamp: number,
  window: PoolAnalyticsWindow,
  options?: TooltipTimeLabelOptions,
) => {
  const format = options?.format ?? (window === '24h' ? TimeLabelFormat.DateTime : TimeLabelFormat.Date)

  return dayjs.unix(timestamp).format(TIME_LABEL_FORMATS[format])
}
