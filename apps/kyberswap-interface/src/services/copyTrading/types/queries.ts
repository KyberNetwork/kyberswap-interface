import type {
  ActivityTypeFilter,
  Address,
  AgentPositionStatusFilter,
  AgentStatsWindow,
  CopyAccountStatusFilter,
  CopyRunView,
  LeaderboardSortBy,
  PerformanceInterval,
  PerformanceSeries,
  PerformanceWindow,
  PositionSortBy,
  PositionStatusFilter,
  SortOrder,
  StrategyKey,
  Timestamp,
} from './primitives'

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
