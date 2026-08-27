import type { AgentCard, AgentProfile, AgentStats, Chain, LeaderboardSummary, PerformancePoint } from './agents'
import type {
  ActivityRow,
  CopyAccountSummary,
  CopyRunCashbackPolicy,
  CopyRunSummary,
  OwnerCopySummary,
  PendingSellObligation,
  PinnedStableBalance,
  WalletBalanceRow,
} from './copyRuns'
import type { ClosedPositionExecution, CotLog, PositionEvent, PositionSummary } from './positions'
import type { CursorResponse, Metric, ResponseMeta, SingleResponse, Timestamp } from './primitives'

export type ChainsResponse = SingleResponse<Chain[]>
export type LeaderboardSummaryResponse = SingleResponse<LeaderboardSummary>
export type LeaderboardResponse = CursorResponse<AgentCard>
export type AgentsResponse = CursorResponse<AgentCard>
export type AgentResponse = SingleResponse<AgentProfile>
export type AgentStatsResponse = SingleResponse<AgentStats>
export type PerformanceResponse = CursorResponse<PerformancePoint> & {
  effectiveWindowStart?: Timestamp
  evaluationAt?: Timestamp
}
export type AgentPerformanceResponse = PerformanceResponse
export type AgentPositionsResponse = CursorResponse<PositionSummary>
export type AgentPositionResponse = SingleResponse<PositionSummary>
export type AgentPositionEventsResponse = CursorResponse<PositionEvent>
export type CotLogsResponse = CursorResponse<CotLog>
export type OwnerCopySummaryResponse = SingleResponse<OwnerCopySummary>
export type CopyRunsResponse = CursorResponse<CopyRunSummary>
export type CopyRunResponse = SingleResponse<CopyRunSummary>
export type CopyRunCashbackPolicyResponse = SingleResponse<CopyRunCashbackPolicy>
export type CopyRunPositionsResponse = CursorResponse<PositionSummary>
export type CopyRunPositionClosedExecutionsResponse = CursorResponse<ClosedPositionExecution>
export type CopyRunPerformanceResponse = PerformanceResponse
export type OwnerPositionsResponse = CursorResponse<PositionSummary>
export type OwnerActivityResponse = CursorResponse<ActivityRow>
export type OwnerCopyAccountsResponse = CursorResponse<CopyAccountSummary>
export type CopyAccountResponse = SingleResponse<CopyAccountSummary>
export type CopyAccountBalancesResponse = CursorResponse<WalletBalanceRow> & {
  pinnedStableBalance?: PinnedStableBalance
}

export type CopyAccountWalletInventoryResponse = {
  data: WalletBalanceRow[]
  walletInventoryValueUsd?: Metric
  complete: boolean
  pinnedStableBalance?: PinnedStableBalance
  meta?: ResponseMeta
}

export type CopyAccountPositionsResponse = CursorResponse<PositionSummary>
export type CopyAccountHistoryResponse = CursorResponse<ActivityRow>
export type PendingSellObligationsResponse = CursorResponse<PendingSellObligation>
