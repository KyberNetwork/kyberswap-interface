import type { AgentCard, AgentProfile, CopyRunStatus, DecimalString, StrategyKey } from 'services/copyTrading/types'

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

export const getAgentDisplayName = (agent?: AgentCard | AgentProfile) => agent?.displayName || 'Unknown Agent'

export const isCopyRunClosed = (status: CopyRunStatus) => status === 'closed' || status === 'stopped'
