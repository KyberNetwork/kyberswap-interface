export type LooseString<T extends string> = T | (string & Record<never, never>)
export type DecimalString = string
export type Timestamp = string
export type Address = `0x${string}` | (string & Record<never, never>)

export type ResponseMeta = {
  requestId: string
  generatedAt: Timestamp
  dataAsOf: Timestamp
  isStale: boolean
  asOfChains: number[]
  stalenessReason?: string
}

export type SingleResponse<T> = {
  data: T
  meta: ResponseMeta
}

export type CursorPagination = {
  nextCursor: string
  hasMore: boolean
  limit: number
}

export type PagePagination = {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export type CursorResponse<T> = {
  data: T[]
  pagination: CursorPagination
  meta: ResponseMeta
}

export type PageResponse<T> = {
  data: T[]
  pagination: PagePagination
  meta: ResponseMeta
}

export type PerformanceWindow = '7d' | '30d' | '90d' | 'all'
export type PerformanceInterval = 'hour' | 'day' | 'week' | 'month'
export type PerformanceSeries = 'portfolio_value'
export type AgentStatsWindow = '30d'
export type SortOrder = 'desc' | 'asc'
export type PositionStatus = 'open' | 'closed'
export type PositionStatusFilter = 'all' | PositionStatus
export type CopyRunStatus = 'active' | 'closed'
export type CopyAccountStatus = 'active' | 'closed' | 'unknown'
export type CopyAccountStatusFilter = 'all' | CopyAccountStatus
export type Risk = LooseString<'low' | 'moderate' | 'medium' | 'high' | 'aggressive'>
export type StrategyKey = LooseString<'focused' | 'diversified' | 'active'>

export type ActivityType =
  | 'copy_started'
  | 'copy_stopped'
  | 'position_opened'
  | 'position_closed'
  | 'capital_added'
  | 'capital_removed'
  | 'fee_charged'
  | 'rebate_received'
  | 'trade_skipped'
  | 'execution_failed'

export type ActivityTypeFilter = 'all' | ActivityType
export type LeaderboardSortBy = 'apr_30d_pct' | 'win_rate_pct' | 'volume_usd' | 'aum_usd' | 'copiers'
export type PositionSortBy = 'opened_at' | 'closed_at' | 'value_usd' | 'realized_pnl_usd' | 'unrealized_pnl_usd'

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
  symbol: string
  name: string
  decimals: number
  iconUrl?: string
}

export type AgentStats = {
  apr30dPct: DecimalString
  winRatePct: DecimalString
  volumeUsd: DecimalString
  copiers: number
  aumUsd: DecimalString
  openPositions: number
  totalRealizedPnlUsd: DecimalString
}

export type AgentCard = {
  agentId: string
  leaderAddress: Address
  displayName: string
  avatarUrl?: string
  isVerified: boolean
  badges: string[]
  isTrending: boolean
  risk: Risk
  strategy: StrategyKey
  modelName: string
  chains: Chain[]
  stats: AgentStats
  asOf: Timestamp
}

export type AgentProfile = {
  agentId: string
  leaderAddresses: Address[]
  displayName: string
  avatarUrl?: string
  bio?: string
  risk: Risk
  strategy: StrategyKey
  modelName: string
  badges: string[]
  isTrending: boolean
  chains: Chain[]
  performanceFeePct: DecimalString
  liveSince: Timestamp
  stats: AgentStats
  whitelistedSymbols: string[]
  tags: string[]
}

export type LeaderboardSummary = {
  totalAgents: number
  totalAumUsd: DecimalString
  totalCopiers: number
  totalVolumeUsd: DecimalString
}

export type PerformancePoint = {
  timestamp: Timestamp
  portfolioValueUsd: DecimalString
  realizedPnlUsd?: DecimalString
  unrealizedPnlUsd?: DecimalString
  metadata?: Record<string, unknown>
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
  trackingStatus?: string
  statusReason?: string
  amountRaw: DecimalString
  amountDecimal: DecimalString
  entryPriceUsd: DecimalString
  currentPriceUsd?: DecimalString
  exitPriceUsd?: DecimalString
  valueUsd: DecimalString
  realizedPnlUsd?: DecimalString
  unrealizedPnlUsd?: DecimalString
  unrealizedPnlPct?: DecimalString
  feeUsd?: DecimalString
  rebateUsd?: DecimalString
  openedAt: Timestamp
  closedAt?: Timestamp
  valuation?: Record<string, unknown>
}

export type PositionEvent = {
  eventId: string
  positionId: string
  activityType: LooseString<ActivityType>
  summary: string
  occurredAt: Timestamp
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
  status: string
  txHash?: string
  occurredAt: Timestamp
}

export type OwnerCopySummary = {
  totalAllocatedUsd: DecimalString
  realizedPnlUsd: DecimalString
  unrealizedPnlUsd: DecimalString
  openPositions: number
  activeCopies: number
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
  capitalInUsd: DecimalString
  capitalOutUsd?: DecimalString
  portfolioValueUsd: DecimalString
  realizedPnlUsd: DecimalString
  unrealizedPnlUsd: DecimalString
  myAprSinceCopyPct?: DecimalString
  openPositionCount: number
  closedTradeCount: number
  feesPaidUsd: DecimalString
  rebatesReceivedUsd: DecimalString
  netFeesPaidUsd: DecimalString
  estimatedRebatePendingUsd: DecimalString
  agentStats: AgentStats
}

export type CopyAccountSummary = {
  chainId: number
  copyAccount: Address
  ownerAddress: Address
  status: CopyAccountStatus
  activeCopyRuns: number
  totalAllocatedUsd: DecimalString
  portfolioValueUsd: DecimalString
  availableBalanceUsd: DecimalString
  realizedPnlUsd: DecimalString
  unrealizedPnlUsd: DecimalString
  netFeesPaidUsd: DecimalString
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
  metadata?: Record<string, unknown>
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
}

export type PageQuery = {
  page?: number
  pageSize?: number
}

export type CursorQuery = {
  cursor?: string
  limit?: number
}

export type LeaderboardFilters = {
  chainId?: number
  strategy?: StrategyKey
  risk?: Risk
  search?: string
}

export type LeaderboardSummaryQuery = LeaderboardFilters
export type LeaderboardQuery = PageQuery &
  LeaderboardFilters & {
    sortBy?: LeaderboardSortBy
    sortOrder?: SortOrder
  }

export type AgentsQuery = PageQuery & LeaderboardFilters

export type AgentQuery = {
  agentId: string
}

export type AgentStatsQuery = AgentQuery & {
  window?: AgentStatsWindow
  chainId?: number
}

export type PerformanceQuery = CursorQuery & {
  series?: PerformanceSeries
  window?: PerformanceWindow
  interval?: PerformanceInterval
}

export type AgentPerformanceQuery = AgentQuery &
  PerformanceQuery & {
    chainId?: number
  }

export type AgentPositionsQuery = CursorQuery &
  AgentQuery & {
    status?: PositionStatusFilter
    chainId?: number
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
    chainId?: number
    positionId?: string
    from?: Timestamp
    to?: Timestamp
  }

export type OwnerQuery = {
  ownerAddress: Address
  chainId?: number
}

export type CopyRunsQuery = CursorQuery &
  OwnerQuery & {
    status?: CopyRunStatus
    agentId?: string
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

export type CopyRunPerformanceQuery = CursorQuery &
  CopyRunQuery & {
    series?: PerformanceSeries
    window?: PerformanceWindow
    interval?: PerformanceInterval
  }

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
  }

export type OwnerCopyAccountsQuery = PageQuery &
  OwnerQuery & {
    status?: CopyAccountStatusFilter
  }

export type CopyAccountQuery = {
  chainId: number
  copyAccount: Address
}

export type CopyAccountBalancesQuery = CursorQuery &
  CopyAccountQuery & {
    tokenAddresses?: Address[]
  }

export type CopyAccountPositionsQuery = CursorQuery &
  CopyAccountQuery & {
    status?: PositionStatusFilter
    sortBy?: PositionSortBy
    sortOrder?: SortOrder
  }

export type CopyAccountHistoryQuery = CursorQuery &
  CopyAccountQuery & {
    activityType?: ActivityTypeFilter
  }

export type ChainsResponse = SingleResponse<Chain[]>
export type LeaderboardSummaryResponse = SingleResponse<LeaderboardSummary>
export type LeaderboardResponse = PageResponse<AgentCard>
export type AgentsResponse = PageResponse<AgentCard>
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
export type OwnerCopyAccountsResponse = PageResponse<CopyAccountSummary>
export type CopyAccountResponse = SingleResponse<CopyAccountSummary>
export type CopyAccountBalancesResponse = CursorResponse<WalletBalanceRow>
export type CopyAccountPositionsResponse = CursorResponse<PositionSummary>
export type CopyAccountHistoryResponse = CursorResponse<ActivityRow>
