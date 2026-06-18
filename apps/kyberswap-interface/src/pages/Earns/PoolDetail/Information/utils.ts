import { formatAprNumber } from '@kyber/utils/number'
import dayjs from 'dayjs'
import { type PoolAnalyticsWindow } from 'services/zapEarn'

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

export const formatAxisTimeLabel = (timestamp: number, window: PoolAnalyticsWindow) => {
  if (window === '24h') return dayjs.unix(timestamp).format('HH:mm')
  if (window === '7d') return dayjs.unix(timestamp).format('MMM D')
  return dayjs.unix(timestamp).format('MMM D')
}

export const formatTooltipTimeLabel = (timestamp: number, window: PoolAnalyticsWindow) => {
  if (window === '30d') return dayjs.unix(timestamp).format('MMM D, YYYY')
  return dayjs.unix(timestamp).format('MMM D, HH:mm')
}
