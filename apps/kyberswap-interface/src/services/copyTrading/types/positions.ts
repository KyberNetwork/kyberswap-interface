import type { Token } from './agents'
import type {
  ActivityType,
  Address,
  DataStatus,
  DecimalString,
  LooseString,
  Metric,
  PositionLifecycle,
  PositionQuantityState,
  PositionStatus,
  Timestamp,
} from './primitives'

export type PositionActionKind =
  | 'POSITION_ACTION_KIND_UNSPECIFIED'
  | 'POSITION_ACTION_KIND_MANUAL_SELL'
  | 'POSITION_ACTION_KIND_CLOSE_POSITION'

export type PositionExitKind =
  | 'POSITION_EXIT_KIND_UNSPECIFIED'
  | 'POSITION_EXIT_KIND_ALIGNED'
  | 'POSITION_EXIT_KIND_MANUAL'

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
