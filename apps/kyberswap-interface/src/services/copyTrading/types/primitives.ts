export type LooseString<T extends string> = T | (string & Record<never, never>)
export type DecimalString = string
export type Timestamp = string
export type Address = `0x${string}` | (string & Record<never, never>)

export type DataStatus =
  | 'DATA_STATUS_CURRENT'
  | 'DATA_STATUS_STALE'
  | 'DATA_STATUS_UNAVAILABLE'
  | 'DATA_STATUS_UNSPECIFIED'

export type MetricStatus =
  | 'METRIC_STATUS_CURRENT'
  | 'METRIC_STATUS_STALE'
  | 'METRIC_STATUS_UNAVAILABLE'
  | 'METRIC_STATUS_NOT_APPLICABLE'
  | 'METRIC_STATUS_UNSPECIFIED'

export type ApiWindow = 'WINDOW_UNSPECIFIED' | 'WINDOW_7D' | 'WINDOW_30D' | 'WINDOW_90D' | 'WINDOW_ALL'

export type WindowPolicy =
  | 'WINDOW_POLICY_UNSPECIFIED'
  | 'WINDOW_POLICY_TRAILING'
  | 'WINDOW_POLICY_SINCE_LIVE'
  | 'WINDOW_POLICY_SINCE_COPY_START'

export type Metric = {
  value?: DecimalString
  valueRaw?: string
  status?: MetricStatus
  asOf?: Timestamp
  window?: ApiWindow
  nominalWindowDays?: number
  actualWindowSeconds?: string
  windowPolicy?: WindowPolicy
  windowStart?: Timestamp
  windowEnd?: Timestamp
}

export type ChainFreshness = {
  chainId?: string
  dataAsOf?: Timestamp
  asOfBlockNumber?: string
  safeBlockNumber?: string
  syncedAt?: Timestamp
  status?: DataStatus
}

export type ResponseMeta = {
  requestId?: string
  generatedAt?: Timestamp
  dataAsOf?: Timestamp
  stalenessReason?: string
  asOfChains?: ChainFreshness[]
  status?: DataStatus
}

export type SingleResponse<T> = {
  data: T
  meta?: ResponseMeta
}

export type CursorPagination = {
  nextCursor?: string
  hasMore: boolean
  limit: number
}

export type CursorResponse<T> = {
  data: T[]
  pagination: CursorPagination
  meta?: ResponseMeta
}

export type PerformanceWindow = '7d' | '30d' | '90d' | 'all'
export type PerformanceInterval = 'day' | 'week' | 'month'
export type PerformanceSeries =
  | 'portfolio_value'
  | 'cumulative_realized_pnl'
  | 'period_realized_pnl'
  | 'per_trade_realized_pnl'
export type AgentStatsWindow = '30d'
export type SortOrder = 'desc' | 'asc'
export type PositionStatus = 'open' | 'closed' | 'unknown'
export type PositionStatusFilter = 'all' | Exclude<PositionStatus, 'unknown'> | 'leftover'
export type AgentPositionStatusFilter = Exclude<PositionStatusFilter, 'leftover'>
export type PositionLifecycle = 'active' | 'closing' | 'closed' | 'unknown'
export type PositionQuantityState = 'open_full' | 'open_partial' | 'closed' | 'unknown'
export type CopyRunView = 'open' | 'history'
export type CopyRunSortBy =
  | 'started_at'
  | 'stopped_at'
  | 'agent_apr_30d'
  | 'agent_win_rate'
  | 'agent_volume'
  | 'capital_in'
export type CopyRunStatus = 'active' | 'closing' | 'closed' | 'stopped' | 'unknown'
export type CapitalInProjectionStatus = 'syncing' | 'ready' | 'unavailable' | 'unknown'
export type CopyAccountStatus = 'active' | 'closed' | 'closing' | 'stopped' | 'unknown'
export type CopyAccountStatusFilter = 'all' | Exclude<CopyAccountStatus, 'unknown'>
export type StrategyKey = LooseString<'focused' | 'diversified' | 'active' | 'unknown'>

export type ActivityType =
  | 'copy_started'
  | 'copy_stopped'
  | 'position_opened'
  | 'position_closed'
  | 'capital_deposited'
  | 'capital_topped_up'
  | 'capital_withdrawn'
  | 'capital_returned'
  | 'flat_fee_captured'
  | 'cashback_received'
  | 'aligned_trade_skipped'
  | 'exit_started'
  | 'exit_succeeded'
  | 'exit_skipped'
  | 'exit_failed'
  | 'execution_failed'
  | 'position_reduced'

export type ActivityTypeFilter = 'all' | ActivityType
export type LeaderboardSortBy = 'apr_30d_pct' | 'win_rate_pct' | 'volume_usd' | 'aum_usd' | 'copiers' | 'open_positions'
export type PositionSortBy = 'opened_at' | 'closed_at' | 'value_usd'
