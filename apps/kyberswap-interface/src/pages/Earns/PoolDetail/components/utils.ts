import { toRawString } from '@kyber/utils/number'

import { formatDisplayNumber } from 'utils/numbers'

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export const formatAmount = (value?: number) =>
  value || value === 0 ? formatDisplayNumber(value, { significantDigits: 6 }) : '--'

export const formatUsdValue = (value?: number) =>
  value || value === 0 ? formatDisplayNumber(value, { significantDigits: 6, style: 'currency' }) : '--'

export const formatDateRange = (startTime?: number, endTime?: number) => {
  if (!startTime || !endTime) return '--'

  const formatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return `${formatter.format(new Date(startTime * 1000))} → ${formatter.format(new Date(endTime * 1000))}`
}

export const getParsedRewardAmount = (value: string | number, decimals: number) => {
  try {
    return Number(toRawString(BigInt(value.toString()), decimals))
  } catch {
    return Number(value) || 0
  }
}

export const getProgressPercent = (startTime?: number, endTime?: number) => {
  if (!startTime || !endTime || endTime <= startTime) return 0

  const now = Math.floor(Date.now() / 1000)
  return clamp(((now - startTime) / (endTime - startTime)) * 100, 0, 100)
}
