import type {
  ActivityRow,
  AgentCard,
  AgentProfile,
  AgentSnapshot,
  DecimalString,
  StrategyCategory,
  StrategyKey,
} from 'services/copyTrading/types'

export const compactUsd = (value?: DecimalString) => {
  if (value === undefined) return '—'
  const amount = Number(value)
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`
  return `$${amount.toLocaleString()}`
}

export const formatUsd = (value?: DecimalString) => (value === undefined ? '—' : `$${Number(value).toLocaleString()}`)

export const signedUsd = (value?: DecimalString) =>
  value === undefined ? '—' : `${Number(value) >= 0 ? '+' : '-'}${formatUsd(Math.abs(Number(value)).toString())}`

export const formatTokenAmount = (value?: DecimalString) => (value === undefined ? '—' : Number(value).toLocaleString())
export const percent = (value?: DecimalString) => (value === undefined ? '—' : `${Number(value).toFixed(1)}%`)
export const signedPercent = (value?: DecimalString) =>
  value === undefined ? '—' : `${Number(value) >= 0 ? '+' : ''}${percent(value)}`
export const formatDate = (value?: string) => (value ? value.replace('T', ' ').replace(':00Z', '') : '-')

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
