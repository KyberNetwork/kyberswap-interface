import type { Address, AgentCard, AgentProfile, DecimalString, StrategyKey } from 'services/copyTrading/types'

export const OWNER_ADDRESS = '0x1111111111111111111111111111111111111111'

export const compactUsd = (value?: DecimalString) => {
  const amount = Number(value || 0)
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`
  return `$${amount.toLocaleString()}`
}

export const formatUsd = (value?: DecimalString) => `$${Number(value || 0).toLocaleString()}`

export const signedUsd = (value?: DecimalString) =>
  `${Number(value || 0) >= 0 ? '+' : '-'}${formatUsd(Math.abs(Number(value || 0)).toString())}`

export const formatTokenAmount = (value?: DecimalString) => Number(value || 0).toLocaleString()
export const percent = (value?: DecimalString) => `${Number(value || 0).toFixed(1)}%`
export const signedPercent = (value?: DecimalString) => `${Number(value || 0) >= 0 ? '+' : ''}${percent(value)}`
export const formatDate = (value?: string) => (value ? value.replace('T', ' ').replace(':00Z', '') : '-')
export const shortAddress = (address?: Address) => (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '-')

export const getAgentInitials = (name: string) =>
  name
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

export const strategyLabel = (strategy: StrategyKey) =>
  strategy === 'active' ? 'Active' : strategy === 'diversified' ? 'Diversified' : 'Focused'

export const getAgentDisplayName = (agent?: AgentCard | AgentProfile) => agent?.displayName || 'Unknown Agent'
