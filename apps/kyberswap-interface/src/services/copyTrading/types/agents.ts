import type { AdvisoryActionAvailability } from 'services/copyTrading/types/actionAvailability'
import type {
  Address,
  DecimalString,
  Metric,
  PerformanceInterval,
  PerformanceSeries,
  StrategyKey,
  Timestamp,
} from 'services/copyTrading/types/primitives'

export type StrategyCategory =
  | 'STRATEGY_CATEGORY_UNSPECIFIED'
  | 'STRATEGY_CATEGORY_FOCUSED'
  | 'STRATEGY_CATEGORY_DIVERSIFIED'
  | 'STRATEGY_CATEGORY_ACTIVE'

export type AccountGenerationLifecycle =
  | 'ACCOUNT_GENERATION_LIFECYCLE_UNSPECIFIED'
  | 'ACCOUNT_GENERATION_LIFECYCLE_CREATE_ENABLED'
  | 'ACCOUNT_GENERATION_LIFECYCLE_EXISTING_ACCOUNTS_ONLY'
  | 'ACCOUNT_GENERATION_LIFECYCLE_READ_ONLY'

export type AccountGenerationProductCapability =
  | 'ACCOUNT_GENERATION_PRODUCT_CAPABILITY_UNSPECIFIED'
  | 'ACCOUNT_GENERATION_PRODUCT_CAPABILITY_START_COPY'
  | 'ACCOUNT_GENERATION_PRODUCT_CAPABILITY_ADD_CAPITAL'
  | 'ACCOUNT_GENERATION_PRODUCT_CAPABILITY_STOP_COPY'
  | 'ACCOUNT_GENERATION_PRODUCT_CAPABILITY_WITHDRAW_QUOTE'
  | 'ACCOUNT_GENERATION_PRODUCT_CAPABILITY_MANUAL_SELL'
  | 'ACCOUNT_GENERATION_PRODUCT_CAPABILITY_CLOSE_POSITION'
  | 'ACCOUNT_GENERATION_PRODUCT_CAPABILITY_WITHDRAW_TOKENS'

export type AccountGeneration = {
  generationId: string
  lifecycle: AccountGenerationLifecycle
  capabilities: AccountGenerationProductCapability[]
}

export type GenerationScopedStartCopyAvailability = {
  generationId: string
  availability?: AdvisoryActionAvailability
}

export type GenerationScopedAgentFeePolicy = {
  generationId: string
  flatFeeRatePct?: Metric
  cashbackFormulaVersion?: number
}

export type Chain = {
  chainId: number
  slug: string
  name: string
  iconUrl: string
  isEnabled: boolean
  quoteToken?: ChainQuoteToken
  accountGenerations?: AccountGeneration[]
}

export type Token = {
  chainId: number
  address: Address
  symbol?: string
  name?: string
  decimals?: number
  iconUrl?: string
}

export type ChainQuoteToken = Token & { decimals: number }

export type AgentMetrics = {
  roiPct?: Metric
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
  roiPct?: DecimalString
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
  startCopyAvailabilities?: GenerationScopedStartCopyAvailability[]
  feePolicies?: GenerationScopedAgentFeePolicy[]
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
  metrics: Pick<AgentMetrics, 'roiPct' | 'winRatePct' | 'lifetimeVolumeUsd'>
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
  series?: PerformanceSeries
  interval?: PerformanceInterval
  portfolioValueUsd?: DecimalString
  realizedPnlUsd?: DecimalString
  totalPnlUsd?: DecimalString
  valuePct?: DecimalString
  tradeId?: string
  positionId?: string
  token?: Token
  metric: Metric
  percentageMetric?: Metric
}
