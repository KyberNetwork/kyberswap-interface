import type { AdvisoryActionAvailability } from 'services/copyTrading/types/actionAvailability'
import type {
  CopyRunCashbackPolicy,
  CopyRunFeeBreakdown,
  CopyRunListItem,
  CopyRunSummary,
  OwnerCopySummary,
  StopCopyProgress,
} from 'services/copyTrading/types/copyRuns'
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

type ApiStopCopyProgress = Partial<StopCopyProgress>

type ApiCopyRunListItem = {
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
  capitalOutUsd?: ApiMetric
  portfolioValueUsd?: ApiMetric
  unrealizedPnlUsd?: ApiMetric
  myAprSinceCopy?: ApiMetric
  openPositionCount?: ApiMetric
  closedPositionCount?: ApiMetric
  leftoverPositionCount?: ApiMetric
  leftoverValueUsd?: ApiMetric
  durationSeconds?: string
  durationAsOf?: string
  currentBalanceUsd?: ApiMetric
  totalPnlUsd?: ApiMetric
  totalPnlPct?: ApiMetric
  stopCopyProgress?: ApiStopCopyProgress
  agentSnapshot?: ApiAgentSnapshot
  addCapitalAvailability?: AdvisoryActionAvailability
  stopCopyAvailability?: AdvisoryActionAvailability
  withdrawQuoteAvailability?: AdvisoryActionAvailability
}

type ApiCopyRunFeeBreakdown = {
  feeChargedUsd?: ApiMetric
  rebatesUsd?: ApiMetric
  netFeesUsd?: ApiMetric
}

type ApiCopyRunSummary = ApiCopyRunListItem & {
  portfolioPnlUsd?: ApiMetric
  feeBreakdown?: ApiCopyRunFeeBreakdown
  copyRunWinRatePct?: ApiMetric
  copyRunClassifiedClosedPositionCount?: ApiMetric
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

const toStopCopyProgress = (progress?: ApiStopCopyProgress): StopCopyProgress | undefined =>
  progress
    ? {
        selectedPositionCount: progress.selectedPositionCount || 0,
        indexedPositionCount: progress.indexedPositionCount || 0,
        terminalPositionCount: progress.terminalPositionCount || 0,
        pendingPositionCount: progress.pendingPositionCount || 0,
        status: progress.status,
        asOf: progress.asOf,
      }
    : undefined

const toCopyRunListItem = (run: ApiCopyRunListItem): CopyRunListItem => {
  const capitalInProjectionStatus = toCapitalInProjectionStatus(run.capitalInProjectionStatus)

  return {
    copyRunId: run.copyRunId || '',
    ownerAddress: (run.ownerAddress || '') as Address,
    agentId: run.agentId || run.agentSnapshot?.agentId || '',
    chainId: chainIdNumber(run.chainId),
    copyAccount: (run.copyAccount || '') as Address,
    status: toCopyRunStatus(run.status),
    startedAt: run.startedAt || '',
    stoppedAt: run.stoppedAt,
    capitalInUsd: metricValue(run.capitalInUsd),
    capitalInProjectionStatus,
    capitalOutUsd: metricValue(run.capitalOutUsd),
    portfolioValueUsd: metricValue(run.portfolioValueUsd),
    unrealizedPnlUsd: metricValue(run.unrealizedPnlUsd),
    myAprSinceCopyPct: metricValue(run.myAprSinceCopy),
    openPositionCount: metricValue(run.openPositionCount),
    closedPositionCount: metricValue(run.closedPositionCount),
    leftoverPositionCount: metricValue(run.leftoverPositionCount),
    leftoverValueUsd: metricValue(run.leftoverValueUsd),
    currentBalanceUsd: metricValue(run.currentBalanceUsd),
    totalPnlUsd: metricValue(run.totalPnlUsd),
    totalPnlPct: metricValue(run.totalPnlPct),
    durationSeconds: run.durationSeconds,
    durationAsOf: run.durationAsOf,
    addCapitalAvailability: run.addCapitalAvailability,
    stopCopyAvailability: run.stopCopyAvailability,
    withdrawQuoteAvailability: run.withdrawQuoteAvailability,
    stopCopyProgress: toStopCopyProgress(run.stopCopyProgress),
    metrics: {
      capitalInUsd: run.capitalInUsd,
      capitalOutUsd: run.capitalOutUsd,
      portfolioValueUsd: run.portfolioValueUsd,
      unrealizedPnlUsd: run.unrealizedPnlUsd,
      myAprSinceCopy: run.myAprSinceCopy,
      openPositionCount: run.openPositionCount,
      closedPositionCount: run.closedPositionCount,
      leftoverPositionCount: run.leftoverPositionCount,
      leftoverValueUsd: run.leftoverValueUsd,
      currentBalanceUsd: run.currentBalanceUsd,
      totalPnlUsd: run.totalPnlUsd,
      totalPnlPct: run.totalPnlPct,
    },
    agentSnapshot: run.agentSnapshot ? toAgentSnapshot(run.agentSnapshot) : undefined,
    agentStats: toAgentStats(run.agentSnapshot?.metrics as ApiAgentMetrics | undefined),
  }
}

const toCopyRunFeeBreakdown = (fees?: ApiCopyRunFeeBreakdown): CopyRunFeeBreakdown | undefined =>
  fees
    ? {
        feeChargedUsd: metricValue(fees.feeChargedUsd),
        rebatesUsd: metricValue(fees.rebatesUsd),
        netFeesUsd: metricValue(fees.netFeesUsd),
        metrics: {
          feeChargedUsd: fees.feeChargedUsd,
          rebatesUsd: fees.rebatesUsd,
          netFeesUsd: fees.netFeesUsd,
        },
      }
    : undefined

const toCopyRunSummary = (run: ApiCopyRunSummary): CopyRunSummary => {
  const item = toCopyRunListItem(run)

  return {
    ...item,
    portfolioPnlUsd: metricValue(run.portfolioPnlUsd),
    feeBreakdown: toCopyRunFeeBreakdown(run.feeBreakdown),
    copyRunWinRatePct: metricValue(run.copyRunWinRatePct),
    copyRunClassifiedClosedPositionCount: metricValue(run.copyRunClassifiedClosedPositionCount),
    metrics: {
      ...item.metrics,
      portfolioPnlUsd: run.portfolioPnlUsd,
      copyRunWinRatePct: run.copyRunWinRatePct,
      copyRunClassifiedClosedPositionCount: run.copyRunClassifiedClosedPositionCount,
    },
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

export const adaptCopyRunsResponse = (response: ApiCursorResponse<ApiCopyRunListItem>): CopyRunsResponse =>
  cursorResponse(response, toCopyRunListItem)

export const adaptCopyRunResponse = (response: ApiSingleResponse<ApiCopyRunSummary>): CopyRunResponse =>
  singleResponse(response, toCopyRunSummary)

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
