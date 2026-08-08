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

export type AdvisoryActionStatus =
  | 'ADVISORY_ACTION_STATUS_UNSPECIFIED'
  | 'ADVISORY_ACTION_STATUS_AVAILABLE'
  | 'ADVISORY_ACTION_STATUS_PENDING'
  | 'ADVISORY_ACTION_STATUS_UNAVAILABLE'

export type AdvisoryActionAvailability = {
  status?: AdvisoryActionStatus
  reason?: PreparedActionReason
  asOf?: Timestamp
}

export type PositionActionKind =
  | 'POSITION_ACTION_KIND_UNSPECIFIED'
  | 'POSITION_ACTION_KIND_MANUAL_SELL'
  | 'POSITION_ACTION_KIND_CLOSE_POSITION'

export type PositionExitKind =
  | 'POSITION_EXIT_KIND_UNSPECIFIED'
  | 'POSITION_EXIT_KIND_ALIGNED'
  | 'POSITION_EXIT_KIND_MANUAL'

export type StrategyCategory =
  | 'STRATEGY_CATEGORY_UNSPECIFIED'
  | 'STRATEGY_CATEGORY_FOCUSED'
  | 'STRATEGY_CATEGORY_DIVERSIFIED'
  | 'STRATEGY_CATEGORY_ACTIVE'

export type ApiWindow = 'WINDOW_UNSPECIFIED' | 'WINDOW_7D' | 'WINDOW_30D' | 'WINDOW_90D' | 'WINDOW_ALL'

export type WindowPolicy =
  | 'WINDOW_POLICY_UNSPECIFIED'
  | 'WINDOW_POLICY_TRAILING'
  | 'WINDOW_POLICY_SINCE_LIVE'
  | 'WINDOW_POLICY_SINCE_COPY_START'

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
export type CopyRunStatus = 'active' | 'closing' | 'closed' | 'stopped' | 'unknown'
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

export type PositionValuation = {
  valueUsd?: DecimalString
  priceUsd?: DecimalString
  priceSource?: string
  priceAsOf?: Timestamp
  asOf?: Timestamp
  isEstimated?: boolean
  isFinal?: boolean
  status?: DataStatus
}

export type PositionMetrics = {
  realizedPnlUsd?: Metric
  unrealizedPnlUsd?: Metric
  unrealizedPnlPct?: Metric
  flatFeeCapturedUsd?: Metric
  cashbackReceivedUsd?: Metric
  netFeeCostUsd?: Metric
  estimatedCashbackUsd?: Metric
  skippedSellCount?: Metric
  latestSkippedRatio?: Metric
  cumulativeSkippedRatio?: Metric
}

export type PositionSummary = {
  positionId: string
  userPositionId?: string
  agentPositionId?: string
  copyRunId?: string
  agentId: string
  chainId: number
  copyAccount?: Address
  tradeId: string
  token: Token
  status: LooseString<PositionStatus>
  lifecycle: PositionLifecycle
  amountRaw: DecimalString
  amountDecimal?: DecimalString
  remainingBaseRaw?: string
  totalGrossBaseBoughtRaw?: string
  totalGrossBaseSoldRaw?: string
  upfrontFeeCapturedBaseRaw?: string
  upfrontFeeReleasedBaseRaw?: string
  netBaseReceivedRaw?: string
  remainingNetBaseRaw?: string
  displayBaseRaw?: string
  entryValuation?: PositionValuation
  currentValuation?: PositionValuation
  exitValuation?: PositionValuation
  entryPriceUsd?: DecimalString
  currentPriceUsd?: DecimalString
  exitPriceUsd?: DecimalString
  valueUsd?: DecimalString
  realizedPnlUsd?: DecimalString
  unrealizedPnlUsd?: DecimalString
  unrealizedPnlPct?: DecimalString
  flatFeeCapturedUsd?: DecimalString
  cashbackReceivedUsd?: DecimalString
  netFeeCostUsd?: DecimalString
  estimatedCashbackUsd?: DecimalString
  metrics: PositionMetrics
  quantityState: PositionQuantityState
  exitKind?: PositionExitKind
  actionKind?: PositionActionKind
  availableActionKinds: PositionActionKind[]
  isLeftover?: boolean
  leftoverReason?: string
  leftoverValuation?: PositionValuation
  latestSkipPublicErrorCode?: string
  durationSeconds?: DecimalString
  durationAsOf?: Timestamp
  openedAt: Timestamp
  closedAt?: Timestamp
}

export type CopyLifecycleActivityDetail = {
  eventId?: string
  eventType?: string
  beforeStatus?: string
  afterStatus?: string
}

export type PositionActivityDetail = {
  eventId?: string
  actionType?: string
  baseTokenAddress?: Address
  quoteTokenAddress?: Address
  baseAmountRaw?: string
  quoteAmountRaw?: string
  accountingStatus?: string
  grossBaseSoldRaw?: string
  grossQuoteReceivedRaw?: string
  baseToken?: Token
  quoteToken?: Token
  grossBaseBoughtRaw?: string
  upfrontFeeCapturedBaseRaw?: string
  upfrontFeeReleasedBaseRaw?: string
  netBaseReceivedRaw?: string
  netBaseSoldRaw?: string
  displayBaseRaw?: string
  settlementValueUsd?: Metric
  realizedPnlUsd?: Metric
  flatFeeCapturedUsd?: Metric
  cashbackReceivedUsd?: Metric
}

export type CapitalActivityDetail = {
  movementType?: string
  amountRaw?: string
  tokenAddress?: Address
  token?: Token
  valueUsd?: Metric
}

export type FeeActivityDetail = {
  amountRaw?: string
  tokenAddress?: Address
  token?: Token
  valueUsd?: Metric
}

export type ExecutionActivityDetail = {
  executionKind?: string
  eventSeq?: string
  eventType?: string
  actionKind?: string
  copyJobId?: string
  exitActionId?: string
  executionId?: string
  copyJobAction?: string
  copyJobStatus?: string
  actionStatus?: string
  executionStatus?: string
  publicErrorCode?: string
  publicErrorMessage?: string
  configIndex?: number
  minBaseTokenRateRaw?: string
  configDeadlineRaw?: string
  token?: Token
  displayAmountRaw?: string
  valueUsd?: Metric
}

export type PositionEvent = {
  eventId: string
  positionId: string
  activityType: LooseString<ActivityType>
  chainId: number
  summary: string
  occurredAt: Timestamp
  txHash?: string
  blockNumber?: string
  metadata?: Record<string, unknown>
}

export type CotLog = {
  logId: string
  agentId: string
  chainId: number
  positionId?: string
  trigger: string
  data: string
  reasoning: string
  action: string
  actionCode?: string
  status: string
  summary?: string
  txHash?: string
  blockNumber?: string
  tokenAddress?: Address
  model?: string
  strategyVersion?: string
  occurredAt: Timestamp
}

export type OwnerCopySummary = {
  ownerAddress: Address
  view: CopyRunView
  totalAllocatedUsd?: DecimalString
  realizedPnlUsd?: DecimalString
  unrealizedPnlUsd?: DecimalString
  openPositions?: DecimalString
  activeCopies?: DecimalString
  closedCopies?: DecimalString
  closedPositions?: DecimalString
  closedCapitalUsd?: DecimalString
  portfolioValueUsd?: DecimalString
  leftoverPositions?: DecimalString
  leftoverValueUsd?: DecimalString
  flatFeesCapturedUsd?: DecimalString
  cashbackReceivedUsd?: DecimalString
  netFeeCostUsd?: DecimalString
  estimatedCashbackPendingUsd?: DecimalString
  metrics: Record<string, Metric | undefined>
}

export type CopyRunSummary = {
  copyRunId: string
  ownerAddress: Address
  agentId: string
  chainId: number
  copyAccount: Address
  status: CopyRunStatus
  startedAt: Timestamp
  stoppedAt?: Timestamp
  capitalInUsd?: DecimalString
  capitalOutUsd?: DecimalString
  portfolioValueUsd?: DecimalString
  realizedPnlUsd?: DecimalString
  unrealizedPnlUsd?: DecimalString
  myAprSinceCopyPct?: DecimalString
  openPositionCount?: DecimalString
  closedPositionCount?: DecimalString
  leftoverPositionCount?: DecimalString
  leftoverValueUsd?: DecimalString
  flatFeesCapturedUsd?: DecimalString
  cashbackReceivedUsd?: DecimalString
  netFeeCostUsd?: DecimalString
  estimatedCashbackPendingUsd?: DecimalString
  durationSeconds?: DecimalString
  durationAsOf?: Timestamp
  addCapitalAvailability?: AdvisoryActionAvailability
  stopCopyAvailability?: AdvisoryActionAvailability
  withdrawQuoteAvailability?: AdvisoryActionAvailability
  metrics: Record<string, Metric | undefined>
  agentSnapshot?: AgentSnapshot
  agentStats: AgentStats
}

export type CopyAccountSummary = {
  chainId: number
  copyAccount: Address
  ownerAddress: Address
  status: CopyAccountStatus
  activeCopyRuns?: DecimalString
  totalAllocatedUsd?: DecimalString
  portfolioValueUsd?: DecimalString
  availableBalanceUsd?: DecimalString
  realizedPnlUsd?: DecimalString
  unrealizedPnlUsd?: DecimalString
  openPositionCount?: DecimalString
  closedPositionCount?: DecimalString
  leftoverPositionCount?: DecimalString
  leftoverValueUsd?: DecimalString
  flatFeesCapturedUsd?: DecimalString
  cashbackReceivedUsd?: DecimalString
  netFeeCostUsd?: DecimalString
  estimatedCashbackPendingUsd?: DecimalString
  copyRunId?: string
  startedAt?: Timestamp
  stoppedAt?: Timestamp
  addCapitalAvailability?: AdvisoryActionAvailability
  stopCopyAvailability?: AdvisoryActionAvailability
  withdrawQuoteAvailability?: AdvisoryActionAvailability
  metrics: Record<string, Metric | undefined>
  agentSnapshot?: AgentSnapshot
}

export type ActivityRow = {
  activityId: string
  ownerAddress: Address
  agentId: string
  chainId: number
  copyRunId?: string
  copyAccount?: Address
  activityType: LooseString<ActivityType>
  summary: string
  occurredAt: Timestamp
  userPositionId?: string
  followerPositionId?: string
  tradeId?: string
  txHash?: string
  agentDisplayName?: string
  agentAvatarUrl?: string
  copyLifecycle?: CopyLifecycleActivityDetail
  position?: PositionActivityDetail
  capital?: CapitalActivityDetail
  fee?: FeeActivityDetail
  execution?: ExecutionActivityDetail
}

export type WalletBalanceRow = {
  chainId: number
  copyAccount: Address
  tokenAddress: Address
  amountDecimal: DecimalString
  balanceSource: string
  freshnessStatus: string
  balanceAsOfBlock: DecimalString
  cachedAt: Timestamp
  stalenessReason?: string
  token?: Token
  valueUsd?: DecimalString
  currentValuation?: PositionValuation
}

export type PinnedStableBalanceStatus =
  | 'PINNED_STABLE_BALANCE_STATUS_UNSPECIFIED'
  | 'PINNED_STABLE_BALANCE_STATUS_PRESENT'
  | 'PINNED_STABLE_BALANCE_STATUS_REGISTRATION_PENDING'
  | 'PINNED_STABLE_BALANCE_STATUS_NOT_INDEXED'
  | 'PINNED_STABLE_BALANCE_STATUS_UNAVAILABLE'
  | 'PINNED_STABLE_BALANCE_STATUS_TOKEN_MISMATCH'

export type PinnedStableBalance = {
  status?: PinnedStableBalanceStatus
  balance?: WalletBalanceRow
}

export type CursorQuery = {
  cursor?: string
  limit?: number
}

export type LeaderboardFilters = {
  chainId?: number
  strategy?: StrategyKey
  search?: string
}

export type LeaderboardSummaryQuery = LeaderboardFilters
export type LeaderboardQuery = CursorQuery &
  LeaderboardFilters & {
    sortBy?: LeaderboardSortBy
    sortOrder?: SortOrder
  }

export type AgentsQuery = CursorQuery & LeaderboardFilters

export type AgentQuery = {
  agentId: string
}

export type AgentStatsQuery = AgentQuery & {
  window?: AgentStatsWindow
}

export type PerformanceQuery = CursorQuery & {
  series?: PerformanceSeries
  window?: PerformanceWindow
  interval?: PerformanceInterval
}

export type AgentPerformanceQuery = AgentQuery & PerformanceQuery

export type AgentPositionsQuery = CursorQuery &
  AgentQuery & {
    status?: AgentPositionStatusFilter
    token?: Address
    sortBy?: PositionSortBy
    sortOrder?: SortOrder
  }

export type AgentPositionQuery = AgentQuery & {
  positionId: string
}

export type AgentPositionEventsQuery = CursorQuery & AgentPositionQuery

export type CotLogsQuery = CursorQuery &
  AgentQuery & {
    leaderPositionId?: string
    from?: Timestamp
    to?: Timestamp
  }

export type OwnerQuery = {
  ownerAddress: Address
  chainId?: number
}

export type OwnerCopySummaryQuery = OwnerQuery & {
  view: CopyRunView
}

export type CopyRunsQuery = CursorQuery &
  OwnerQuery & {
    view: CopyRunView
    agentId?: string
    sortBy?: 'started_at' | 'stopped_at' | 'agent_apr_30d' | 'agent_win_rate' | 'agent_volume' | 'capital_in'
    sortOrder?: SortOrder
  }

export type CopyRunQuery = {
  ownerAddress: Address
  copyRunId: string
}

export type CopyRunPositionsQuery = CursorQuery &
  CopyRunQuery & {
    status?: PositionStatusFilter
    sortBy?: PositionSortBy
    sortOrder?: SortOrder
  }

export type CopyRunPerformanceQuery = CursorQuery & CopyRunQuery & PerformanceQuery

export type OwnerPositionsQuery = CursorQuery &
  OwnerQuery & {
    status?: PositionStatusFilter
    agentId?: string
    sortBy?: PositionSortBy
    sortOrder?: SortOrder
  }

export type OwnerActivityQuery = CursorQuery &
  OwnerQuery & {
    copyRunId?: string
    activityType?: ActivityTypeFilter
    group?: 'buys' | 'sells' | 'deposits_withdrawals' | 'skipped'
  }

export type OwnerCopyAccountsQuery = CursorQuery &
  OwnerQuery & {
    status?: CopyAccountStatusFilter
  }

export type CopyAccountQuery = {
  chainId: number
  copyAccount: Address
}

export type CopyAccountBalancesQuery = CursorQuery & CopyAccountQuery

export type CopyAccountPositionsQuery = CursorQuery &
  CopyAccountQuery & {
    status?: PositionStatusFilter
    sortBy?: PositionSortBy
    sortOrder?: SortOrder
  }

export type CopyAccountHistoryQuery = CursorQuery &
  CopyAccountQuery & {
    activityType?: ActivityTypeFilter
    group?: 'buys' | 'sells' | 'deposits_withdrawals' | 'skipped'
  }

export type PendingSellObligationsQuery = CursorQuery &
  CopyAccountQuery & {
    userPositionId: string
  }

export type PendingSellObligation = {
  leaderPositionEventId: string
  currentRatioRaw: string
  skippedAt?: Timestamp
  publicErrorCode?: string
  publicErrorMessage?: string
}

export type ChainsResponse = SingleResponse<Chain[]>
export type LeaderboardSummaryResponse = SingleResponse<LeaderboardSummary>
export type LeaderboardResponse = CursorResponse<AgentCard>
export type AgentsResponse = CursorResponse<AgentCard>
export type AgentResponse = SingleResponse<AgentProfile>
export type AgentStatsResponse = SingleResponse<AgentStats>
export type AgentPerformanceResponse = CursorResponse<PerformancePoint>
export type AgentPositionsResponse = CursorResponse<PositionSummary>
export type AgentPositionResponse = SingleResponse<PositionSummary>
export type AgentPositionEventsResponse = CursorResponse<PositionEvent>
export type CotLogsResponse = CursorResponse<CotLog>
export type OwnerCopySummaryResponse = SingleResponse<OwnerCopySummary>
export type CopyRunsResponse = CursorResponse<CopyRunSummary>
export type CopyRunResponse = SingleResponse<CopyRunSummary>
export type CopyRunPositionsResponse = CursorResponse<PositionSummary>
export type CopyRunPerformanceResponse = CursorResponse<PerformancePoint>
export type OwnerPositionsResponse = CursorResponse<PositionSummary>
export type OwnerActivityResponse = CursorResponse<ActivityRow>
export type OwnerCopyAccountsResponse = CursorResponse<CopyAccountSummary>
export type CopyAccountResponse = SingleResponse<CopyAccountSummary>
export type CopyAccountBalancesResponse = CursorResponse<WalletBalanceRow> & {
  pinnedStableBalance?: PinnedStableBalance
}
export type CopyAccountPositionsResponse = CursorResponse<PositionSummary>
export type CopyAccountHistoryResponse = CursorResponse<ActivityRow>
export type PendingSellObligationsResponse = CursorResponse<PendingSellObligation>

export type RawAmountMetric = Pick<Metric, 'valueRaw' | 'status' | 'asOf'>

export type SwapQuotePreview = {
  expectedQuote?: RawAmountMetric
  minimumQuote?: RawAmountMetric
  effectiveSlippageBps?: number
}

export type PreparedToken = {
  chainId?: string
  address?: Address
  symbol?: string
  name?: string
  decimals?: number
  logoUrl?: string
}

export type PreparedCallKind =
  | 'PREPARED_CALL_KIND_UNSPECIFIED'
  | 'PREPARED_CALL_KIND_START_COPY_CREATE'
  | 'PREPARED_CALL_KIND_START_COPY_FUND'
  | 'PREPARED_CALL_KIND_ADD_CAPITAL'
  | 'PREPARED_CALL_KIND_STOP_COPY'
  | 'PREPARED_CALL_KIND_WITHDRAW_QUOTE'
  | 'PREPARED_CALL_KIND_MANUAL_SELL'
  | 'PREPARED_CALL_KIND_CLOSE_POSITION'

export type PreparedCall = {
  kind?: PreparedCallKind
  to?: Address
  data?: `0x${string}`
  valueRaw?: string
}

export type PreparedActionStatus =
  | 'PREPARED_ACTION_STATUS_UNSPECIFIED'
  | 'PREPARED_ACTION_STATUS_READY'
  | 'PREPARED_ACTION_STATUS_PARTIALLY_COMPLETED'
  | 'PREPARED_ACTION_STATUS_COMPLETED'
  | 'PREPARED_ACTION_STATUS_PENDING'
  | 'PREPARED_ACTION_STATUS_UNAVAILABLE'

export type PreparedActionReason =
  | 'PREPARED_ACTION_REASON_UNSPECIFIED'
  | 'PREPARED_ACTION_REASON_ALREADY_ACTIVE'
  | 'PREPARED_ACTION_REASON_NOT_CURRENT_OWNER'
  | 'PREPARED_ACTION_REASON_ACCOUNT_NOT_ACTIVE'
  | 'PREPARED_ACTION_REASON_ACCOUNT_NOT_STOPPED'
  | 'PREPARED_ACTION_REASON_ACCOUNT_PERMANENTLY_PAUSED'
  | 'PREPARED_ACTION_REASON_EXIT_IN_PROGRESS'
  | 'PREPARED_ACTION_REASON_EXIT_NOT_TERMINAL'
  | 'PREPARED_ACTION_REASON_SOURCE_STALE'
  | 'PREPARED_ACTION_REASON_SOURCE_COVERAGE_PENDING'
  | 'PREPARED_ACTION_REASON_FACTORY_PAUSED'
  | 'PREPARED_ACTION_REASON_FEE_POLICY_CHANGED'
  | 'PREPARED_ACTION_REASON_SIGNER_POLICY_CHANGED'
  | 'PREPARED_ACTION_REASON_REQUEST_ID_CONFLICT'
  | 'PREPARED_ACTION_REASON_UNSUPPORTED_ACCOUNT_GENERATION'
  | 'PREPARED_ACTION_REASON_NO_QUOTE_BALANCE'
  | 'PREPARED_ACTION_REASON_INSUFFICIENT_QUOTE_BALANCE'
  | 'PREPARED_ACTION_REASON_CONTROLLER_PAUSED'
  | 'PREPARED_ACTION_REASON_COPY_RUN_STOPPED'
  | 'PREPARED_ACTION_REASON_UNSUPPORTED_QUOTE_TOKEN'
  | 'PREPARED_ACTION_REASON_AMOUNT_BELOW_MINIMUM'
  | 'PREPARED_ACTION_REASON_INVALID_STOP_INTENT'
  | 'PREPARED_ACTION_REASON_NO_EXECUTABLE_ROUTE'
  | 'PREPARED_ACTION_REASON_INNER_CALL_REVERTED'
  | 'PREPARED_ACTION_REASON_NO_SELLABLE_BASE'
  | 'PREPARED_ACTION_REASON_NO_PENDING_SELL_OBLIGATION'
  | 'PREPARED_ACTION_REASON_SELL_OBLIGATION_CHANGED'
  | 'PREPARED_ACTION_REASON_POSITION_NOT_OPEN'
  | 'PREPARED_ACTION_REASON_CLOSE_NOT_ELIGIBLE'

export type PreparedActionWarning =
  | 'PREPARED_ACTION_WARNING_UNSPECIFIED'
  | 'PREPARED_ACTION_WARNING_ALLOCATION_STALE'
  | 'PREPARED_ACTION_WARNING_INVALID_STOP_INTENT_RECOVERED'
  | 'PREPARED_ACTION_WARNING_OWNER_SNAPSHOT_REQUIRES_REFRESH'

export type ProjectorCoverage = {
  projector?: string
  completedThroughBlockNumber?: string
  coverageGeneration?: string
  sourceReorgSequence?: string
}

export type EvidenceAnchor = {
  blockNumber?: string
  blockHash?: string
  blockTime?: Timestamp
  coverageGeneration?: string
  sourceReorgSequence?: string
  actionFactEventSeq?: string
  projectors?: ProjectorCoverage[]
}

export type ActionBlock = {
  blockNumber?: string
  blockHash?: string
  blockTime?: Timestamp
}

export type ActionEvidence = {
  evidenceAnchor?: EvidenceAnchor
  actionBlock?: ActionBlock
}

export type FeePolicyPreview = {
  advertisedUpfrontFeeRateRaw?: string
  advertisedRateStatus?: MetricStatus
}

export type StartCopyStage =
  | 'START_COPY_STAGE_UNSPECIFIED'
  | 'START_COPY_STAGE_CREATE_REQUIRED'
  | 'START_COPY_STAGE_FUNDING_REQUIRED'
  | 'START_COPY_STAGE_COMPLETE'

export type StartCopyPreview = {
  stage?: StartCopyStage
  startRequestId?: string
  predictedCopyAccount?: Address
  quoteToken?: PreparedToken
  requestedTargetRaw?: string
  initialCapitalCredited?: RawAmountMetric
  remainingTargetDeficit?: RawAmountMetric
  minimumInitialCapitalRaw?: string
  walletQuoteBalance?: RawAmountMetric
  feePolicy?: FeePolicyPreview
}

export type AddCapitalPreview = {
  quoteToken?: PreparedToken
  addedCapitalRaw?: string
  minimumAddCapitalRaw?: string
  walletQuoteBalance?: RawAmountMetric
  currentAllocatedCapital?: RawAmountMetric
  newAllocatedCapital?: RawAmountMetric
}

export type PreparedPositionLifecycle =
  | 'POSITION_LIFECYCLE_UNSPECIFIED'
  | 'POSITION_LIFECYCLE_ACTIVE'
  | 'POSITION_LIFECYCLE_CLOSING'
  | 'POSITION_LIFECYCLE_CLOSED'

export type StopPositionPreview = {
  userPositionId?: string
  tradeId?: string
  baseToken?: PreparedToken
  userBaseRaw?: string
  cashback?: RawAmountMetric
  currentValuation?: PositionValuation
  lifecycle?: PreparedPositionLifecycle
  unrealizedPnlUsd?: Metric
  swapQuote?: SwapQuotePreview
}

export type StopCopyPreview = {
  positions?: StopPositionPreview[]
  totalCurrentValueUsd?: Metric
  totalCashback?: RawAmountMetric
  quoteToken?: PreparedToken
  totalSwapQuote?: SwapQuotePreview
}

export type WithdrawQuotePreview = {
  quoteToken?: PreparedToken
  quoteBalance?: RawAmountMetric
  sweepAmountRaw?: string
  recipientAddress?: Address
}

export type PositionSellContext =
  | 'POSITION_SELL_CONTEXT_UNSPECIFIED'
  | 'POSITION_SELL_CONTEXT_ALIGN_SKIP'
  | 'POSITION_SELL_CONTEXT_STOP_COPY'

export type PositionSellPreview = {
  context?: PositionSellContext
  userPositionId?: string
  tradeId?: string
  baseToken?: PreparedToken
  quoteToken?: PreparedToken
  remainingBaseBefore?: RawAmountMetric
  sellBase?: RawAmountMetric
  upfrontFeeReleasedBase?: RawAmountMetric
  sellRatioRaw?: string
  unresolvedSkipCount?: number
  cashback?: RawAmountMetric
  swapQuote?: SwapQuotePreview
}

export type PreparedAction = {
  status?: PreparedActionStatus
  chainId?: string
  expectedAccount?: Address
  copyAccount?: Address
  preparedAt?: Timestamp
  reprepareAfter?: Timestamp
  liquidationConfigDeadline?: Timestamp
  call?: PreparedCall
  reason?: PreparedActionReason
  warnings?: PreparedActionWarning[]
  evidence?: ActionEvidence
  startCopy?: StartCopyPreview
  addCapital?: AddCapitalPreview
  stopCopy?: StopCopyPreview
  withdrawQuote?: WithdrawQuotePreview
  manualSell?: PositionSellPreview
  closePosition?: PositionSellPreview
}

export type PreparedActionResponse = { data: PreparedAction }
export type PrepareStartCopyResponse = PreparedActionResponse
export type PrepareAddCapitalResponse = PreparedActionResponse
export type PrepareStopCopyResponse = PreparedActionResponse
export type PrepareWithdrawQuoteResponse = PreparedActionResponse
export type PrepareManualSellResponse = PreparedActionResponse
export type PrepareClosePositionResponse = PreparedActionResponse

export type PrepareStartCopyRequest = {
  ownerAddress: Address
  agentId: string
  chainId: string
  targetCapitalRaw: string
  startRequestId: string
}

export type PrepareCopyRunRequest = {
  ownerAddress: Address
  copyRunId: string
}

export type PrepareAddCapitalRequest = PrepareCopyRunRequest & {
  amountRaw: string
}

export type PrepareStopCopyRequest = PrepareCopyRunRequest & {
  userPositionIds: string[]
  slippageBps: number
}

export type PrepareWithdrawQuoteRequest = PrepareCopyRunRequest

export type PreparePositionRequest = PrepareCopyRunRequest & {
  userPositionId: string
  accessToken: string
  slippageBps: number
}

export type PrepareManualSellRequest = PreparePositionRequest & {
  expectedUnresolvedSkipCount: number
  expectedSellRatioRaw: string
}

export type PrepareClosePositionRequest = PreparePositionRequest

export type CreateWalletSessionChallengeRequest = {
  chainId: string
  ownerAddress: Address
}

export type WalletSessionChallengeResponse = {
  data: {
    siweMessage: string
    challengeToken: string
    expiresAt: Timestamp
  }
}

export type CreateWalletSessionRequest = {
  challengeToken: string
  signature: `0x${string}`
}

export type WalletSessionResponse = {
  data: {
    accessToken: string
    tokenType: 'Bearer'
    chainId: string
    ownerAddress: Address
    expiresAt: Timestamp
  }
}
