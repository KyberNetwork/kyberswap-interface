import type { AdvisoryActionAvailability } from 'services/copyTrading/types/actionAvailability'
import type { CopyRunCashbackPolicy, CopyRunSummary, OwnerCopySummary } from 'services/copyTrading/types/copyRuns'
import type {
  Address,
  CapitalInProjectionStatus,
  CopyRunStatus,
  CopyRunView,
} from 'services/copyTrading/types/primitives'
import type {
  CopyRunCashbackPolicyResponse,
  CopyRunResponse,
  CopyRunsResponse,
  OwnerCopySummaryResponse,
} from 'services/copyTrading/types/responses'

import { type ApiAgentMetrics, type ApiAgentSnapshot, toAgentSnapshot, toAgentStats } from './agents'
import {
  type ApiCursorResponse,
  type ApiMetric,
  type ApiSingleResponse,
  chainIdNumber,
  cursorResponse,
  metricValue,
  singleResponse,
} from './shared'

type ApiCopyRun = {
  copyRunId?: string
  ownerAddress?: string
  agentId?: string
  chainId?: string
  copyAccount?: string
  status?: string
  capitalInProjectionStatus?: string
  startedAt?: string
  stoppedAt?: string
  capitalInUsd?: ApiMetric
  observedCapitalInUsd?: ApiMetric
  capitalOutUsd?: ApiMetric
  portfolioValueUsd?: ApiMetric
  realizedPnlUsd?: ApiMetric
  unrealizedPnlUsd?: ApiMetric
  myAprSinceCopy?: ApiMetric
  openPositionCount?: ApiMetric
  closedPositionCount?: ApiMetric
  durationSeconds?: string
  durationAsOf?: string
  flatFeesCapturedUsd?: ApiMetric
  cashbackReceivedUsd?: ApiMetric
  netFeeCostUsd?: ApiMetric
  currentBalanceUsd?: ApiMetric
  totalPnlUsd?: ApiMetric
  totalPnlPct?: ApiMetric
  copyRunWinRatePct?: ApiMetric
  copyRunClassifiedClosedPositionCount?: ApiMetric
  agentSnapshot?: ApiAgentSnapshot
  addCapitalAvailability?: AdvisoryActionAvailability
  stopCopyAvailability?: AdvisoryActionAvailability
  withdrawQuoteAvailability?: AdvisoryActionAvailability
}

type ApiCopyRunCashbackPolicy = {
  copyRunId?: string
  chainId?: string
  copyAccount?: string
  agentId?: string
  capCashbackRatioRaw?: string
  pnlRateRaw?: string
  scope?: string
  status?: string
  selectionPolicyVersion?: string
  cashbackFormulaVersion?: number
  selectedAt?: string
  invalidatedAt?: string
  unavailableReason?: string
  fallbackAt?: string
}

type ApiOwnerCopySummary = {
  ownerAddress?: string
  view?: string
  totalAllocatedUsd?: ApiMetric
  portfolioValueUsd?: ApiMetric
  realizedPnlUsd?: ApiMetric
  unrealizedPnlUsd?: ApiMetric
  openPositionCount?: ApiMetric
  activeCopyRuns?: ApiMetric
  closedCopyRuns?: ApiMetric
  closedPositionCount?: ApiMetric
  closedCapitalUsd?: ApiMetric
  flatFeesCapturedUsd?: ApiMetric
  cashbackReceivedUsd?: ApiMetric
  netFeeCostUsd?: ApiMetric
}

const toCopyRunStatus = (status?: string): CopyRunStatus => {
  const value = status?.replace('COPY_RUN_STATUS_', '').toLowerCase()
  return (
    value === 'active' || value === 'closing' || value === 'closed' || value === 'stopped' ? value : 'unknown'
  ) as CopyRunStatus
}

const toCapitalInProjectionStatus = (status?: string): CapitalInProjectionStatus => {
  const value = status
    ?.replace('COPY_RUN_CAPITAL_IN_PROJECTION_STATUS_', '')
    .replace('CAPITAL_IN_PROJECTION_STATUS_', '')
    .toLowerCase()
  return value === 'syncing' || value === 'ready' || value === 'unavailable' ? value : 'unknown'
}

const toCopyRun = (run: ApiCopyRun): CopyRunSummary => {
  const capitalInProjectionStatus = toCapitalInProjectionStatus(run.capitalInProjectionStatus)
  const canonicalCapitalInUsd = capitalInProjectionStatus === 'ready' ? metricValue(run.capitalInUsd) : undefined
  const observedCapitalInUsd = metricValue(run.observedCapitalInUsd)

  return {
    copyRunId: run.copyRunId || '',
    ownerAddress: (run.ownerAddress || '') as Address,
    agentId: run.agentId || run.agentSnapshot?.agentId || '',
    chainId: chainIdNumber(run.chainId),
    copyAccount: (run.copyAccount || '') as Address,
    status: toCopyRunStatus(run.status),
    startedAt: run.startedAt || '',
    stoppedAt: run.stoppedAt,
    capitalInUsd: canonicalCapitalInUsd,
    observedCapitalInUsd,
    capitalOutUsd: metricValue(run.capitalOutUsd),
    portfolioValueUsd: metricValue(run.portfolioValueUsd),
    realizedPnlUsd: metricValue(run.realizedPnlUsd),
    unrealizedPnlUsd: metricValue(run.unrealizedPnlUsd),
    myAprSinceCopyPct: metricValue(run.myAprSinceCopy),
    openPositionCount: metricValue(run.openPositionCount),
    closedPositionCount: metricValue(run.closedPositionCount),
    flatFeesCapturedUsd: metricValue(run.flatFeesCapturedUsd),
    cashbackReceivedUsd: metricValue(run.cashbackReceivedUsd),
    netFeeCostUsd: metricValue(run.netFeeCostUsd),
    currentBalanceUsd: metricValue(run.currentBalanceUsd),
    totalPnlUsd: metricValue(run.totalPnlUsd),
    totalPnlPct: metricValue(run.totalPnlPct),
    copyRunWinRatePct: metricValue(run.copyRunWinRatePct),
    copyRunClassifiedClosedPositionCount: metricValue(run.copyRunClassifiedClosedPositionCount),
    durationSeconds: run.durationSeconds,
    durationAsOf: run.durationAsOf,
    addCapitalAvailability: run.addCapitalAvailability,
    stopCopyAvailability: run.stopCopyAvailability,
    withdrawQuoteAvailability: run.withdrawQuoteAvailability,
    metrics: {
      capitalInUsd: run.capitalInUsd,
      observedCapitalInUsd: run.observedCapitalInUsd,
      capitalOutUsd: run.capitalOutUsd,
      portfolioValueUsd: run.portfolioValueUsd,
      realizedPnlUsd: run.realizedPnlUsd,
      unrealizedPnlUsd: run.unrealizedPnlUsd,
      myAprSinceCopy: run.myAprSinceCopy,
      openPositionCount: run.openPositionCount,
      closedPositionCount: run.closedPositionCount,
      flatFeesCapturedUsd: run.flatFeesCapturedUsd,
      cashbackReceivedUsd: run.cashbackReceivedUsd,
      netFeeCostUsd: run.netFeeCostUsd,
      currentBalanceUsd: run.currentBalanceUsd,
      totalPnlUsd: run.totalPnlUsd,
      totalPnlPct: run.totalPnlPct,
      copyRunWinRatePct: run.copyRunWinRatePct,
      copyRunClassifiedClosedPositionCount: run.copyRunClassifiedClosedPositionCount,
    },
    agentSnapshot: run.agentSnapshot ? toAgentSnapshot(run.agentSnapshot) : undefined,
    agentStats: toAgentStats(run.agentSnapshot?.metrics as ApiAgentMetrics | undefined),
  }
}

export const adaptOwnerCopySummaryResponse = (
  response: ApiSingleResponse<ApiOwnerCopySummary>,
): OwnerCopySummaryResponse =>
  singleResponse(
    response,
    (summary): OwnerCopySummary => ({
      ownerAddress: (summary.ownerAddress || '') as Address,
      view: (summary.view === 'OWNER_COPY_VIEW_HISTORY' ? 'history' : 'open') as CopyRunView,
      totalAllocatedUsd: metricValue(summary.totalAllocatedUsd),
      portfolioValueUsd: metricValue(summary.portfolioValueUsd),
      realizedPnlUsd: metricValue(summary.realizedPnlUsd),
      unrealizedPnlUsd: metricValue(summary.unrealizedPnlUsd),
      openPositions: metricValue(summary.openPositionCount),
      activeCopies: metricValue(summary.activeCopyRuns),
      closedCopies: metricValue(summary.closedCopyRuns),
      closedPositions: metricValue(summary.closedPositionCount),
      closedCapitalUsd: metricValue(summary.closedCapitalUsd),
      flatFeesCapturedUsd: metricValue(summary.flatFeesCapturedUsd),
      cashbackReceivedUsd: metricValue(summary.cashbackReceivedUsd),
      netFeeCostUsd: metricValue(summary.netFeeCostUsd),
      metrics: {
        totalAllocatedUsd: summary.totalAllocatedUsd,
        portfolioValueUsd: summary.portfolioValueUsd,
        realizedPnlUsd: summary.realizedPnlUsd,
        unrealizedPnlUsd: summary.unrealizedPnlUsd,
        openPositionCount: summary.openPositionCount,
        activeCopyRuns: summary.activeCopyRuns,
        closedCopyRuns: summary.closedCopyRuns,
        closedPositionCount: summary.closedPositionCount,
        closedCapitalUsd: summary.closedCapitalUsd,
        flatFeesCapturedUsd: summary.flatFeesCapturedUsd,
        cashbackReceivedUsd: summary.cashbackReceivedUsd,
        netFeeCostUsd: summary.netFeeCostUsd,
      },
    }),
  )

export const adaptCopyRunsResponse = (response: ApiCursorResponse<ApiCopyRun>): CopyRunsResponse =>
  cursorResponse(response, toCopyRun)

export const adaptCopyRunResponse = (response: ApiSingleResponse<ApiCopyRun>): CopyRunResponse =>
  singleResponse(response, toCopyRun)

export const adaptCopyRunCashbackPolicyResponse = (
  response: ApiSingleResponse<ApiCopyRunCashbackPolicy>,
): CopyRunCashbackPolicyResponse =>
  singleResponse(
    response,
    (policy): CopyRunCashbackPolicy => ({
      copyRunId: policy.copyRunId || '',
      chainId: chainIdNumber(policy.chainId),
      copyAccount: (policy.copyAccount || '') as Address,
      agentId: policy.agentId || '',
      capCashbackRatioRaw: policy.capCashbackRatioRaw,
      pnlRateRaw: policy.pnlRateRaw,
      scope: policy.scope || 'COPY_RUN_CASHBACK_POLICY_SCOPE_UNSPECIFIED',
      status: policy.status || 'COPY_RUN_CASHBACK_POLICY_STATUS_UNSPECIFIED',
      selectionPolicyVersion: policy.selectionPolicyVersion,
      cashbackFormulaVersion: policy.cashbackFormulaVersion,
      selectedAt: policy.selectedAt,
      invalidatedAt: policy.invalidatedAt,
      unavailableReason: policy.unavailableReason,
      fallbackAt: policy.fallbackAt,
    }),
  )
