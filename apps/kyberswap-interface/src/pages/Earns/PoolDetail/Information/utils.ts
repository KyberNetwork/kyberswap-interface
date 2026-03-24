import dayjs from 'dayjs'
import { type PoolAnalyticsWindow } from 'services/zapEarn'

import { type SegmentedControlOption } from 'components/SegmentedControl'
import { formatDisplayNumber } from 'utils/numbers'

export const ANALYTICS_WINDOW_OPTIONS: readonly SegmentedControlOption<PoolAnalyticsWindow>[] = [
  { label: '24H', value: '24h' },
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
]

const COMPACT_UNITS = [
  { divisor: 1_000_000_000, suffix: 'B' },
  { divisor: 1_000_000, suffix: 'M' },
  { divisor: 1_000, suffix: 'K' },
] as const

const hasValue = (value?: number | null): value is number =>
  value !== undefined && value !== null && !Number.isNaN(value)

export const formatAnalyticsUsd = (value?: number) =>
  hasValue(value) ? formatDisplayNumber(value, { style: 'currency', significantDigits: 6 }) : '--'

export const formatAnalyticsNumber = (value?: number) =>
  hasValue(value) ? formatDisplayNumber(value, { significantDigits: 6 }) : '--'

export const formatAnalyticsPrice = (value?: number) =>
  hasValue(value)
    ? formatDisplayNumber(value, {
        significantDigits: value !== 0 && Math.abs(value) < 1 ? 8 : 6,
      })
    : '--'

export const formatAnalyticsSignedPercent = (value?: number) =>
  hasValue(value) ? `${value > 0 ? '+' : ''}${formatDisplayNumber(value, { significantDigits: 4 })}%` : '--'

export const formatAnalyticsCompactCurrency = (value?: number) => {
  if (!hasValue(value)) return '--'

  const sign = value < 0 ? '-' : ''
  const absoluteValue = Math.abs(value)
  const unit = COMPACT_UNITS.find(item => absoluteValue >= item.divisor)

  if (!unit) {
    return `${sign}$${formatDisplayNumber(absoluteValue, { significantDigits: 4 })}`
  }

  return `${sign}$${formatDisplayNumber(absoluteValue / unit.divisor, { significantDigits: 4 })}${unit.suffix}`
}

export const formatAnalyticsAxisTimeLabel = (timestamp: number, window: PoolAnalyticsWindow) => {
  if (window === '24h') return dayjs.unix(timestamp).format('HH:mm')
  if (window === '7d') return dayjs.unix(timestamp).format('MMM D')
  return dayjs.unix(timestamp).format('MMM D')
}

export const formatAnalyticsTooltipTimeLabel = (timestamp: number, window: PoolAnalyticsWindow) => {
  if (window === '30d') return dayjs.unix(timestamp).format('MMM D, YYYY')
  return dayjs.unix(timestamp).format('MMM D, HH:mm')
}
