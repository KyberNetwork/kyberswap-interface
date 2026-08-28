import type { PreparedActionReason } from './actionAvailability'
import type { PositionValuation } from './positions'
import type { Address, LooseString, Metric, MetricStatus, Timestamp } from './primitives'

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

export type PreparedActionWarning =
  | 'PREPARED_ACTION_WARNING_UNSPECIFIED'
  | 'PREPARED_ACTION_WARNING_ALLOCATION_STALE'
  | 'PREPARED_ACTION_WARNING_INVALID_STOP_INTENT_RECOVERED'
  | 'PREPARED_ACTION_WARNING_OWNER_SNAPSHOT_REQUIRES_REFRESH'

export type ActionDisplayEnrichmentStatus =
  | 'ACTION_DISPLAY_ENRICHMENT_STATUS_UNSPECIFIED'
  | 'ACTION_DISPLAY_ENRICHMENT_STATUS_NOT_APPLICABLE'
  | 'ACTION_DISPLAY_ENRICHMENT_STATUS_COMPLETE'
  | 'ACTION_DISPLAY_ENRICHMENT_STATUS_UNAVAILABLE'

export type ActionDisplayEnrichmentUnavailableReason =
  | 'ACTION_DISPLAY_ENRICHMENT_UNAVAILABLE_REASON_UNSPECIFIED'
  | 'ACTION_DISPLAY_ENRICHMENT_UNAVAILABLE_REASON_SOURCE_UNAVAILABLE'
  | 'ACTION_DISPLAY_ENRICHMENT_UNAVAILABLE_REASON_BUDGET_EXHAUSTED'

export type ActionDisplayEnrichment = {
  status: ActionDisplayEnrichmentStatus
  unavailableReason?: ActionDisplayEnrichmentUnavailableReason
}

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
  | 'START_COPY_STAGE_CREATE_CONFIRMING'
  | 'START_COPY_STAGE_FUNDING_REQUIRED'
  | 'START_COPY_STAGE_COMPLETE'

export type StartCopyApprovalScheme =
  | 'START_COPY_APPROVAL_SCHEME_UNSPECIFIED'
  | 'START_COPY_APPROVAL_SCHEME_STANDARD'
  | 'START_COPY_APPROVAL_SCHEME_ZERO_THEN_SET'

export type StartCopyPermitScheme =
  | 'START_COPY_PERMIT_SCHEME_UNSPECIFIED'
  | 'START_COPY_PERMIT_SCHEME_ALLOWANCE_ONLY'
  | 'START_COPY_PERMIT_SCHEME_ERC20_EIP2612'
  | 'START_COPY_PERMIT_SCHEME_ERC20_DAI_LIKE'

export type StartCopyEip712DomainKind =
  | 'START_COPY_EIP712_DOMAIN_KIND_UNSPECIFIED'
  | 'START_COPY_EIP712_DOMAIN_KIND_CHAIN_ID'
  | 'START_COPY_EIP712_DOMAIN_KIND_CHAIN_ID_SALT'

export type StartCopyAllowanceRequirement = {
  spenderAddress?: Address
  currentAllowanceRaw?: string
  requiredAllowanceRaw?: string
  approvalScheme?: LooseString<StartCopyApprovalScheme>
  permitScheme?: LooseString<StartCopyPermitScheme>
  eip712DomainName?: string
  eip712DomainVersion?: string
  eip712DomainKind?: LooseString<StartCopyEip712DomainKind>
}

export type CopyConfirmPolicy = {
  minPriceDeviationBps?: number
  maxPriceDeviationBps?: number
  priceDeviationStatus?: MetricStatus
  configurationGeneration?: string
  configurationRevision?: string
  configurationAsOf?: Timestamp
  minPriceDeviationRaw?: string
  maxPriceDeviationRaw?: string
  minPriceDeviationPct?: string
  maxPriceDeviationPct?: string
}

export type StartCopyPreview = {
  stage?: StartCopyStage
  startRequestId?: string
  predictedCopyAccount?: Address
  quoteToken?: PreparedToken
  requestedTargetRaw?: string
  createAmountRaw?: string
  initialCapitalCredited?: RawAmountMetric
  remainingTargetDeficit?: RawAmountMetric
  minimumInitialCapitalRaw?: string
  walletQuoteBalance?: RawAmountMetric
  feePolicy?: FeePolicyPreview
  allowanceRequirement?: StartCopyAllowanceRequirement
  copyConfirmPolicy?: CopyConfirmPolicy
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
  displayEnrichment: ActionDisplayEnrichment
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

export type StartCopyFundingMode = 'START_COPY_FUNDING_MODE_UNFUNDED' | 'START_COPY_FUNDING_MODE_FUNDED'

type PrepareStartCopyRequestBase = {
  ownerAddress: Address
  agentId: string
  chainId: string
  targetCapitalRaw: string
  startRequestId: string
  fundingMode: StartCopyFundingMode
}

export type PrepareStartCopyRequest = PrepareStartCopyRequestBase &
  (
    | { fundingMode: 'START_COPY_FUNDING_MODE_UNFUNDED'; createPermitData?: never }
    | { fundingMode: 'START_COPY_FUNDING_MODE_FUNDED'; createPermitData?: string }
  )

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

export type PrepareWithdrawQuoteRequest = PrepareCopyRunRequest & {
  amountRaw: string
}

export type PreparePositionRequest = PrepareCopyRunRequest & {
  userPositionId: string
  slippageBps: number
}

export type PrepareManualSellRequest = PreparePositionRequest & {
  expectedUnresolvedSkipCount: number
  expectedSellRatioRaw: string
}

export type PrepareClosePositionRequest = PreparePositionRequest
