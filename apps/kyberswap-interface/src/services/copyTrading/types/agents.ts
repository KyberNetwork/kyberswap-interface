import type { AdvisoryActionAvailability } from './actionAvailability'
import type {
  Address,
  DecimalString,
  Metric,
  PerformanceInterval,
  PerformanceSeries,
  StrategyKey,
  Timestamp,
} from './primitives'

export type StrategyCategory =
  | 'STRATEGY_CATEGORY_UNSPECIFIED'
  | 'STRATEGY_CATEGORY_FOCUSED'
  | 'STRATEGY_CATEGORY_DIVERSIFIED'
  | 'STRATEGY_CATEGORY_ACTIVE'

export type Chain = {
  chainId: number
  slug: string
  name: string
  iconUrl: string
  isEnabled: boolean
}

export type Token = {
  chainId: number
  address: Address
  symbol?: string
  name?: string
  decimals?: number
  iconUrl?: string
}

export type AgentMetrics = {
  apr30d?: Metric
  winRatePct?: Metric
  lifetimeVolumeUsd?: Metric
  copiers?: Metric
  aumUsd?: Metric
  openPositions?: Metric
  totalRealizedPnlUsd?: Metric
  maxDrawdownPct?: Metric
  winningPositionCount?: Metric
  losingPositionCount?: Metric
  breakevenPositionCount?: Metric
  closedPositionCount?: Metric
}

export type AgentStats = {
  apr30dPct?: DecimalString
  winRatePct?: DecimalString
  volumeUsd?: DecimalString
  copiers?: DecimalString
  aumUsd?: DecimalString
  openPositions?: DecimalString
  totalRealizedPnlUsd?: DecimalString
  maxDrawdownPct?: DecimalString
  metrics: AgentMetrics
}

export type StrategyExecutionItem = {
  label: string
  description: string
}

export type AgentCard = {
  agentId: string
  chainId: number
  leaderAddress: Address
  displayName: string
  avatarUrl?: string
  isVerified: boolean
  badges: string[]
  isTrending: boolean
  strategy: StrategyKey
  strategyLabel?: string
  strategyCategories: StrategyCategory[]
  modelName: string
  stats: AgentStats
  flatFeeRatePct?: DecimalString
  flatFeeRatePctMetric?: Metric
  startCopyAvailability?: AdvisoryActionAvailability
  asOf?: Timestamp
}

export type AgentProfile = AgentCard & {
  bio?: string
  liveSince?: Timestamp
  whitelistedSymbols: string[]
  tags: string[]
  strategyExecutionItems: StrategyExecutionItem[]
}

export type AgentSnapshot = {
  agentId: string
  chainId: number
  leaderAddress: Address
  displayName: string
  avatarUrl?: string
  isVerified: boolean
  modelName: string
  strategy: StrategyKey
  strategyLabel?: string
  strategyCategories: StrategyCategory[]
  badges: string[]
  metrics: Pick<AgentMetrics, 'apr30d' | 'winRatePct' | 'lifetimeVolumeUsd'>
}

export type LeaderboardSummary = {
  asOf?: Timestamp
  totalAgents?: DecimalString
  totalAumUsd?: DecimalString
  totalCopiers?: DecimalString
  totalVolumeUsd?: DecimalString
  metrics: {
    agentCount?: Metric
    totalAumUsd?: Metric
    totalCopierCount?: Metric
    lifetimeVolumeUsd?: Metric
  }
}

export type PerformancePoint = {
  timestamp: Timestamp
  series: PerformanceSeries
  interval?: PerformanceInterval
  portfolioValueUsd?: DecimalString
  realizedPnlUsd?: DecimalString
  tradeId?: string
  positionId?: string
  token?: Token
  metric: Metric
}
