export type LooseString<T extends string> = T | (string & Record<never, never>)
export type DecimalString = string
export type Timestamp = string
export type Address = `0x${string}` | (string & Record<never, never>)

export type DataStatus =
  | 'DATA_STATUS_CURRENT'
  | 'DATA_STATUS_STALE'
  | 'DATA_STATUS_UNAVAILABLE'
  | 'DATA_STATUS_UNSPECIFIED'

export type DataCompleteness =
  | 'DATA_COMPLETENESS_UNSPECIFIED'
  | 'DATA_COMPLETENESS_COMPLETE'
  | 'DATA_COMPLETENESS_PARTIAL'
  | 'DATA_COMPLETENESS_PENDING'

export type DataFinality = 'DATA_FINALITY_UNSPECIFIED' | 'DATA_FINALITY_PROVISIONAL' | 'DATA_FINALITY_FINAL'

export type DataQualityReason =
  | 'DATA_QUALITY_REASON_UNSPECIFIED'
  | 'DATA_QUALITY_REASON_SOURCE_LAG'
  | 'DATA_QUALITY_REASON_DEPENDENCY_PENDING'
  | 'DATA_QUALITY_REASON_OPERATOR_ACTION_PENDING'
  | 'DATA_QUALITY_REASON_SETTLEMENT_PENDING'
  | 'DATA_QUALITY_REASON_POLICY_TRANSITION_PENDING'
  | 'DATA_QUALITY_REASON_PRICE_PENDING'
  | 'DATA_QUALITY_REASON_REORG_REPAIR'
  | 'DATA_QUALITY_REASON_PENDING_USER_OPERATION'
  | 'DATA_QUALITY_REASON_PROVIDER_UNAVAILABLE'

export type FieldGroup =
  | 'FIELD_GROUP_UNSPECIFIED'
  | 'FIELD_GROUP_IDENTITY'
  | 'FIELD_GROUP_LIFECYCLE'
  | 'FIELD_GROUP_CAPITAL'
  | 'FIELD_GROUP_VALUATION'
  | 'FIELD_GROUP_PERFORMANCE'
  | 'FIELD_GROUP_POLICY'
  | 'FIELD_GROUP_ACTION_ADVISORY'
  | 'FIELD_GROUP_ACTIVITY'
  | 'FIELD_GROUP_TRADE_TOKEN_CONFIGURATION'
  | 'FIELD_GROUP_TOKEN_METADATA'
  | 'FIELD_GROUP_EXTERNAL_ENRICHMENT'

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

export type FieldGroupQuality = {
  freshness?: DataStatus
  completeness?: DataCompleteness
  finality?: DataFinality
  reason?: DataQualityReason
  valueAsOf?: Timestamp
  coverageAsOf?: Timestamp
  computedAt?: Timestamp
  group?: FieldGroup
}

export type ResponseMeta = {
  requestId?: string
  generatedAt?: Timestamp
  dataAsOf?: Timestamp
  stalenessReason?: string
  asOfChains?: ChainFreshness[]
  status?: DataStatus
  fieldQualities?: FieldGroupQuality[]
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
  | 'cumulative_total_pnl'
  | 'period_realized_pnl'
  | 'per_trade_realized_pnl'
export type AgentStatsWindow = '30d'
export type SortOrder = 'desc' | 'asc'
export type PositionStatus = 'open' | 'closed' | 'unknown'
export type PositionStatusFilter = 'all' | Exclude<PositionStatus, 'unknown'>
export type AgentPositionStatusFilter = PositionStatusFilter
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
  | 'current_balance'
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
export type TradeSide = 'buy' | 'sell' | 'unknown'
export type ActivitySurface = 'copy_run_log' | 'alert_feed'
export type ActivityCategory = 'trade' | 'capital' | 'failed_action' | 'fee_rebate'
export type ActivitySubtype =
  | 'buy'
  | 'sell'
  | 'deposited'
  | 'capital_topped_up'
  | 'capital_withdrawn'
  | 'skipped_buy'
  | 'skipped_sell'
  | 'flat_fee_captured'
  | 'rebate_received'
export type LeaderboardSortBy = 'apr_30d_pct' | 'win_rate_pct' | 'volume_usd' | 'aum_usd' | 'copiers' | 'open_positions'
export type PositionSortBy = 'opened_at' | 'closed_at' | 'value_usd'
