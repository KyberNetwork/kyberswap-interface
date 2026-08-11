import type {
  ActivityRow,
  AgentCard,
  AgentProfile,
  AgentSnapshot,
  DecimalString,
  StrategyCategory,
  StrategyKey,
} from 'services/copyTrading/types'

import { formatDisplayNumber } from 'utils/numbers'

type NumericValue = DecimalString | number
const METRIC_FALLBACK = 'N/A'

const parseNumericValue = (value?: NumericValue) => {
  if (value === undefined || (typeof value === 'string' && !value.trim())) return undefined

  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : undefined
}

export const compactUsd = (value?: DecimalString) => {
  const amount = parseNumericValue(value)
  return amount === undefined
    ? METRIC_FALLBACK
    : formatDisplayNumber(amount, { allowDisplayNegative: true, significantDigits: 3, style: 'currency' })
}

export const formatUsd = (value?: DecimalString) => {
  const amount = parseNumericValue(value)
  if (amount === undefined) return METRIC_FALLBACK

  const absoluteAmount = Math.abs(amount)
  const fractionDigits = absoluteAmount > 0 && absoluteAmount < 1 ? 6 : 2
  return formatDisplayNumber(amount, {
    allowDisplayNegative: true,
    fractionDigits,
    significantDigits: 15,
    style: 'currency',
  })
}

export const signedUsd = (value?: DecimalString) => {
  const amount = parseNumericValue(value)
  if (amount === undefined) return METRIC_FALLBACK

  return `${amount > 0 ? '+' : amount < 0 ? '-' : ''}${formatUsd(String(Math.abs(amount)))}`
}

export const sumUsdValues = (...values: Array<DecimalString | undefined>) => {
  const amounts = values.map(parseNumericValue)
  if (amounts.some(amount => amount === undefined)) return undefined

  return String(amounts.reduce<number>((total, amount) => total + (amount ?? 0), 0))
}

export const formatTokenAmount = (value?: DecimalString) => {
  const amount = parseNumericValue(value)
  if (amount === undefined) return METRIC_FALLBACK

  return formatDisplayNumber(amount, {
    allowDisplayNegative: true,
    fractionDigits: 6,
    significantDigits: 15,
  })
}

export const formatCount = (value?: NumericValue) => {
  const amount = parseNumericValue(value)
  return amount === undefined
    ? METRIC_FALLBACK
    : formatDisplayNumber(Math.round(amount), { fractionDigits: 0, significantDigits: 15 })
}

export const percent = (value?: DecimalString) => {
  const amount = parseNumericValue(value)
  return amount === undefined
    ? METRIC_FALLBACK
    : `${formatDisplayNumber(amount, {
        allowDisplayNegative: true,
        fractionDigits: 1,
        significantDigits: 15,
      })}%`
}

export const signedPercent = (value?: DecimalString) => {
  const amount = parseNumericValue(value)
  if (amount === undefined) return METRIC_FALLBACK

  return `${amount > 0 ? '+' : ''}${percent(value)}`
}

export const formatApproximateUsd = (value?: DecimalString) => {
  const formattedValue = formatUsd(value)
  return formattedValue === METRIC_FALLBACK ? formattedValue : `~${formattedValue}`
}

export const getAgentInitials = (name: string) =>
  name
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

export const strategyLabel = (strategy: StrategyKey) =>
  strategy === 'active'
    ? 'Active'
    : strategy === 'diversified'
    ? 'Diversified'
    : strategy === 'focused'
    ? 'Focused'
    : 'Unknown'

export const strategyCategoryKey = (category: StrategyCategory): StrategyKey =>
  category === 'STRATEGY_CATEGORY_ACTIVE'
    ? 'active'
    : category === 'STRATEGY_CATEGORY_DIVERSIFIED'
    ? 'diversified'
    : category === 'STRATEGY_CATEGORY_FOCUSED'
    ? 'focused'
    : 'unknown'

export const getAgentDisplayName = (agent?: AgentCard | AgentProfile | AgentSnapshot) =>
  agent?.displayName || 'Unknown Agent'

export const getActivityLabel = (activity: Pick<ActivityRow, 'activityType' | 'position'>) => {
  if (activity.position?.actionType?.toLowerCase() === 'sell_unaligned') return 'Owner Sell'

  switch (activity.activityType) {
    case 'copy_started':
      return 'Start Copy'
    case 'copy_stopped':
      return 'Stop Copy'
    case 'capital_deposited':
      return 'Deposit'
    case 'capital_topped_up':
      return 'Add Capital'
    case 'capital_withdrawn':
      return 'Withdraw Quote'
    case 'capital_returned':
      return 'Returned Capital'
    default:
      return activity.activityType
        .split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
  }
}
