import type { AdvisoryActionAvailability } from './actionAvailability'
import type { AgentSnapshot, AgentStats, Token } from './agents'
import type {
  CapitalActivityDetail,
  CopyLifecycleActivityDetail,
  ExecutionActivityDetail,
  FeeActivityDetail,
  PositionActivityDetail,
  PositionValuation,
} from './positions'
import type {
  ActivityType,
  Address,
  CapitalInProjectionStatus,
  CopyAccountStatus,
  CopyRunStatus,
  CopyRunView,
  DecimalString,
  LooseString,
  Metric,
  Timestamp,
} from './primitives'

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
  capitalInProjectionStatus: CapitalInProjectionStatus
  startedAt: Timestamp
  stoppedAt?: Timestamp
  capitalInUsd?: DecimalString
  observedCapitalInUsd?: DecimalString
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

export type CopyRunCashbackPolicyScope =
  | 'COPY_RUN_CASHBACK_POLICY_SCOPE_UNSPECIFIED'
  | 'COPY_RUN_CASHBACK_POLICY_SCOPE_DEFAULT'
  | 'COPY_RUN_CASHBACK_POLICY_SCOPE_EXTRA'

export type CopyRunCashbackPolicyStatus =
  | 'COPY_RUN_CASHBACK_POLICY_STATUS_UNSPECIFIED'
  | 'COPY_RUN_CASHBACK_POLICY_STATUS_AVAILABLE'
  | 'COPY_RUN_CASHBACK_POLICY_STATUS_NOT_CONFIGURED'
  | 'COPY_RUN_CASHBACK_POLICY_STATUS_INVALIDATED'
  | 'COPY_RUN_CASHBACK_POLICY_STATUS_UNAVAILABLE'

export type CopyRunCashbackPolicyUnavailableReason =
  | 'COPY_RUN_CASHBACK_POLICY_UNAVAILABLE_REASON_UNSPECIFIED'
  | 'COPY_RUN_CASHBACK_POLICY_UNAVAILABLE_REASON_COVERAGE_PENDING'
  | 'COPY_RUN_CASHBACK_POLICY_UNAVAILABLE_REASON_HISTORICAL_GENERATION_UNSUPPORTED'
  | 'COPY_RUN_CASHBACK_POLICY_UNAVAILABLE_REASON_POLICY_TRANSITION_PENDING'

export type CopyRunCashbackPolicy = {
  copyRunId: string
  chainId: number
  copyAccount: Address
  agentId: string
  capCashbackRatioRaw?: string
  pnlRateRaw?: string
  scope: LooseString<CopyRunCashbackPolicyScope>
  status: LooseString<CopyRunCashbackPolicyStatus>
  selectionPolicyVersion?: string
  cashbackFormulaVersion?: number
  selectedAt?: Timestamp
  invalidatedAt?: Timestamp
  unavailableReason?: LooseString<CopyRunCashbackPolicyUnavailableReason>
  fallbackAt?: Timestamp
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

export type PendingSellObligation = {
  leaderPositionEventId: string
  currentRatioRaw: string
  skippedAt?: Timestamp
  publicErrorCode?: string
  publicErrorMessage?: string
}
