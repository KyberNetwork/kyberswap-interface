import type { AdvisoryActionAvailability } from 'services/copyTrading/types/actionAvailability'
import type {
  AgentCard,
  AgentProfile,
  AgentSnapshot,
  AgentStats,
  Chain,
  PerformancePoint,
} from 'services/copyTrading/types/agents'
import type {
  Address,
  PerformanceInterval,
  PerformanceSeries,
  StrategyKey,
} from 'services/copyTrading/types/primitives'
import type {
  AgentPerformanceResponse,
  AgentResponse,
  AgentStatsResponse,
  AgentsResponse,
  ChainsResponse,
  CopyRunPerformanceResponse,
  LeaderboardResponse,
  LeaderboardSummaryResponse,
} from 'services/copyTrading/types/responses'

import {
  type ApiCursorResponse,
  type ApiMetric,
  type ApiSingleResponse,
  type ApiToken,
  chainIdNumber,
  cursorResponse,
  metricValue,
  singleResponse,
  toToken,
} from './shared'

type ApiChain = {
  chainId?: string
  slug?: string
  name?: string
  iconUrl?: string
  isEnabled?: boolean
}

export type ApiAgentMetrics = {
  apr30d?: ApiMetric
  winRatePct?: ApiMetric
  lifetimeVolumeUsd?: ApiMetric
  copiers?: ApiMetric
  aumUsd?: ApiMetric
  openPositions?: ApiMetric
  totalRealizedPnlUsd?: ApiMetric
  maxDrawdownPct?: ApiMetric
  winningPositionCount?: ApiMetric
  losingPositionCount?: ApiMetric
  breakevenPositionCount?: ApiMetric
  closedPositionCount?: ApiMetric
}

type ApiAgentCard = {
  agentId?: string
  chainId?: string
  leaderAddress?: string
  displayName?: string
  avatarUrl?: string
  isVerified?: boolean
  badges?: string[]
  modelName?: string
  asOf?: string
  strategyLabel?: string
  strategyCategories?: string[]
  metrics?: ApiAgentMetrics
  flatFeeRatePct?: ApiMetric
  startCopyAvailability?: AdvisoryActionAvailability
}

type ApiAgentProfile = ApiAgentCard & {
  bio?: string
  liveSince?: string
  whitelistedSymbols?: string[]
  tags?: string[]
  strategyExecutionItems?: { label?: string; description?: string }[]
}

export type ApiAgentSnapshot = {
  agentId?: string
  chainId?: string
  leaderAddress?: string
  displayName?: string
  avatarUrl?: string
  isVerified?: boolean
  modelName?: string
  strategyLabel?: string
  strategyCategories?: string[]
  badges?: string[]
  metrics?: ApiAgentMetrics
}

type ApiPerformancePoint = {
  timestamp?: string
  series?: string
  interval?: string
  valueUsd?: ApiMetric
  valuePct?: ApiMetric
  tradeId?: string
  positionId?: string
  token?: ApiToken
}

const performanceSeriesMap: Partial<Record<string, PerformanceSeries>> = {
  PERFORMANCE_SERIES_PORTFOLIO_EQUITY: 'portfolio_value',
  PERFORMANCE_SERIES_CUMULATIVE_REALIZED_PNL: 'cumulative_realized_pnl',
  PERFORMANCE_SERIES_CUMULATIVE_TOTAL_PNL: 'cumulative_total_pnl',
  PERFORMANCE_SERIES_PERIOD_REALIZED_PNL: 'period_realized_pnl',
  PERFORMANCE_SERIES_PER_TRADE_REALIZED_PNL: 'per_trade_realized_pnl',
}

const performanceIntervalMap: Record<string, PerformanceInterval> = {
  PERFORMANCE_INTERVAL_DAY: 'day',
  PERFORMANCE_INTERVAL_WEEK: 'week',
  PERFORMANCE_INTERVAL_MONTH: 'month',
}

const toStrategy = (categories?: string[], label?: string): StrategyKey => {
  const category = categories?.find(value => value !== 'STRATEGY_CATEGORY_UNSPECIFIED')
  if (category) return category.replace('STRATEGY_CATEGORY_', '').toLowerCase() as StrategyKey

  const normalizedLabel = label?.trim().toLowerCase()
  return (
    normalizedLabel === 'focused' || normalizedLabel === 'diversified' || normalizedLabel === 'active'
      ? normalizedLabel
      : 'unknown'
  ) as StrategyKey
}

export const toAgentSnapshot = (snapshot: ApiAgentSnapshot): AgentSnapshot => ({
  agentId: snapshot.agentId || '',
  chainId: chainIdNumber(snapshot.chainId),
  leaderAddress: (snapshot.leaderAddress || '') as Address,
  displayName: snapshot.displayName || snapshot.agentId || '',
  avatarUrl: snapshot.avatarUrl,
  isVerified: snapshot.isVerified === true,
  modelName: snapshot.modelName || '',
  strategy: toStrategy(snapshot.strategyCategories, snapshot.strategyLabel),
  strategyLabel: snapshot.strategyLabel,
  strategyCategories: (snapshot.strategyCategories || []) as AgentSnapshot['strategyCategories'],
  badges: snapshot.badges || [],
  metrics: snapshot.metrics || {},
})

export const toAgentStats = (metrics?: ApiAgentMetrics): AgentStats => ({
  apr30dPct: metricValue(metrics?.apr30d),
  winRatePct: metricValue(metrics?.winRatePct),
  volumeUsd: metricValue(metrics?.lifetimeVolumeUsd),
  copiers: metricValue(metrics?.copiers),
  aumUsd: metricValue(metrics?.aumUsd),
  openPositions: metricValue(metrics?.openPositions),
  totalRealizedPnlUsd: metricValue(metrics?.totalRealizedPnlUsd),
  maxDrawdownPct: metricValue(metrics?.maxDrawdownPct),
  metrics: metrics || {},
})

const toAgentCard = (agent: ApiAgentCard): AgentCard => ({
  agentId: agent.agentId || '',
  chainId: chainIdNumber(agent.chainId),
  leaderAddress: (agent.leaderAddress || '') as Address,
  displayName: agent.displayName || agent.agentId || '',
  avatarUrl: agent.avatarUrl,
  isVerified: agent.isVerified === true,
  badges: agent.badges || [],
  isTrending: agent.badges?.some(badge => badge.toLowerCase() === 'trending') === true,
  strategy: toStrategy(agent.strategyCategories, agent.strategyLabel),
  strategyLabel: agent.strategyLabel,
  strategyCategories: (agent.strategyCategories || []) as AgentCard['strategyCategories'],
  modelName: agent.modelName || '',
  stats: toAgentStats(agent.metrics),
  flatFeeRatePct: metricValue(agent.flatFeeRatePct),
  flatFeeRatePctMetric: agent.flatFeeRatePct,
  startCopyAvailability: agent.startCopyAvailability,
  asOf: agent.asOf,
})

const toAgentProfile = (agent: ApiAgentProfile): AgentProfile => ({
  ...toAgentCard(agent),
  bio: agent.bio,
  liveSince: agent.liveSince,
  whitelistedSymbols: agent.whitelistedSymbols || [],
  tags: agent.tags || [],
  strategyExecutionItems:
    agent.strategyExecutionItems?.map(item => ({
      label: item.label || '',
      description: item.description || '',
    })) || [],
})

const toPerformancePoint = (point: ApiPerformancePoint): PerformancePoint => {
  const value = metricValue(point.valueUsd)
  const series = performanceSeriesMap[point.series || '']

  return {
    timestamp: point.timestamp || '',
    series,
    interval: performanceIntervalMap[point.interval || ''],
    portfolioValueUsd: series === 'portfolio_value' ? value : undefined,
    realizedPnlUsd:
      series === 'cumulative_realized_pnl' || series === 'period_realized_pnl' || series === 'per_trade_realized_pnl'
        ? value
        : undefined,
    totalPnlUsd: series === 'cumulative_total_pnl' ? value : undefined,
    valuePct: metricValue(point.valuePct),
    tradeId: point.tradeId,
    positionId: point.positionId,
    token: point.token ? toToken(point.token) : undefined,
    metric: point.valueUsd || {},
    percentageMetric: point.valuePct,
  }
}

export const adaptChainsResponse = (response: ApiSingleResponse<ApiChain[]>): ChainsResponse => ({
  data: (response.data || []).map(
    (chain): Chain => ({
      chainId: chainIdNumber(chain.chainId),
      slug: chain.slug || '',
      name: chain.name || '',
      iconUrl: chain.iconUrl || '',
      isEnabled: chain.isEnabled === true,
    }),
  ),
  meta: response.meta,
})

export const adaptLeaderboardSummaryResponse = (
  response: ApiSingleResponse<{
    asOf?: string
    agentCount?: ApiMetric
    totalAumUsd?: ApiMetric
    totalCopierCount?: ApiMetric
    lifetimeVolumeUsd?: ApiMetric
  }>,
): LeaderboardSummaryResponse =>
  singleResponse(response, summary => ({
    asOf: summary.asOf,
    totalAgents: metricValue(summary.agentCount),
    totalAumUsd: metricValue(summary.totalAumUsd),
    totalCopiers: metricValue(summary.totalCopierCount),
    totalVolumeUsd: metricValue(summary.lifetimeVolumeUsd),
    metrics: {
      agentCount: summary.agentCount,
      totalAumUsd: summary.totalAumUsd,
      totalCopierCount: summary.totalCopierCount,
      lifetimeVolumeUsd: summary.lifetimeVolumeUsd,
    },
  }))

export const adaptLeaderboardResponse = (response: ApiCursorResponse<ApiAgentCard>): LeaderboardResponse =>
  cursorResponse(response, toAgentCard)

export const adaptAgentsResponse = (response: ApiCursorResponse<ApiAgentCard>): AgentsResponse =>
  cursorResponse(response, toAgentCard)

export const adaptAgentResponse = (response: ApiSingleResponse<ApiAgentProfile>): AgentResponse =>
  singleResponse(response, toAgentProfile)

export const adaptAgentStatsResponse = (response: ApiSingleResponse<ApiAgentMetrics>): AgentStatsResponse =>
  singleResponse(response, toAgentStats)

export const adaptPerformanceResponse = (
  response: ApiCursorResponse<ApiPerformancePoint> & { effectiveWindowStart?: string; evaluationAt?: string },
): AgentPerformanceResponse | CopyRunPerformanceResponse => ({
  ...cursorResponse(response, toPerformancePoint),
  effectiveWindowStart: response.effectiveWindowStart,
  evaluationAt: response.evaluationAt,
})
