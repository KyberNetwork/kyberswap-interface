import type { ActivityRow } from 'services/copyTrading/types/copyRuns'
import type { CotLog } from 'services/copyTrading/types/positions'
import type { ActivityType, Address } from 'services/copyTrading/types/primitives'
import type {
  CopyAccountHistoryResponse,
  CotLogsResponse,
  OwnerActivityResponse,
} from 'services/copyTrading/types/responses'

import { type ApiCursorResponse, type ApiMetric, type ApiToken, chainIdNumber, cursorResponse, toToken } from './shared'

type ApiActivity = {
  activityId?: string
  ownerAddress?: string
  agentId?: string
  chainId?: string
  copyRunId?: string
  copyAccount?: string
  type?: string
  summary?: string
  occurredAt?: string
  userPositionId?: string
  followerPositionId?: string
  tradeId?: string
  txHash?: string
  agentDisplayName?: string
  agentAvatarUrl?: string
  copyLifecycle?: {
    eventId?: string
    eventType?: string
    beforeStatus?: string
    afterStatus?: string
  }
  position?: {
    eventId?: string
    actionType?: string
    baseTokenAddress?: string
    quoteTokenAddress?: string
    baseAmountRaw?: string
    quoteAmountRaw?: string
    accountingStatus?: string
    grossBaseSoldRaw?: string
    grossQuoteReceivedRaw?: string
    baseToken?: ApiToken
    quoteToken?: ApiToken
    grossBaseBoughtRaw?: string
    upfrontFeeCapturedBaseRaw?: string
    upfrontFeeReleasedBaseRaw?: string
    netBaseReceivedRaw?: string
    netBaseSoldRaw?: string
    displayBaseRaw?: string
    settlementValueUsd?: ApiMetric
    realizedPnlUsd?: ApiMetric
    flatFeeCapturedUsd?: ApiMetric
    cashbackReceivedUsd?: ApiMetric
  }
  capital?: {
    movementType?: string
    amountRaw?: string
    tokenAddress?: string
    token?: ApiToken
    valueUsd?: ApiMetric
  }
  fee?: {
    amountRaw?: string
    tokenAddress?: string
    token?: ApiToken
    valueUsd?: ApiMetric
  }
  execution?: {
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
    token?: ApiToken
    displayAmountRaw?: string
    valueUsd?: ApiMetric
  }
}

type ApiAgentActionLog = {
  actionLogId?: string
  chainId?: string
  occurredAt?: string
  trigger?: string
  dataSummary?: string
  reasoningSummary?: string
  actionSummary?: string
  action?: string
  status?: string
  txHash?: string
  leaderPositionId?: string
  summary?: string
  blockNumber?: string
  tokenAddress?: string
  model?: string
  strategyVersion?: string
}

type ApiAgentActionLogSessionGroup = {
  sessionId?: string
  logs?: ApiAgentActionLog[]
}

const toPositionActivity = (detail: ApiActivity['position']): ActivityRow['position'] =>
  detail
    ? {
        ...detail,
        baseTokenAddress: detail.baseTokenAddress as Address | undefined,
        quoteTokenAddress: detail.quoteTokenAddress as Address | undefined,
        baseToken: detail.baseToken ? toToken(detail.baseToken) : undefined,
        quoteToken: detail.quoteToken ? toToken(detail.quoteToken) : undefined,
      }
    : undefined

const toCapitalActivity = (detail: ApiActivity['capital']): ActivityRow['capital'] =>
  detail
    ? {
        ...detail,
        tokenAddress: detail.tokenAddress as Address | undefined,
        token: detail.token ? toToken(detail.token) : undefined,
      }
    : undefined

const toFeeActivity = (detail: ApiActivity['fee']): ActivityRow['fee'] =>
  detail
    ? {
        ...detail,
        tokenAddress: detail.tokenAddress as Address | undefined,
        token: detail.token ? toToken(detail.token) : undefined,
      }
    : undefined

const toExecutionActivity = (detail: ApiActivity['execution']): ActivityRow['execution'] =>
  detail
    ? {
        ...detail,
        token: detail.token ? toToken(detail.token) : undefined,
      }
    : undefined

const toActivity = (activity: ApiActivity): ActivityRow => ({
  activityId: activity.activityId || '',
  ownerAddress: (activity.ownerAddress || '') as Address,
  agentId: activity.agentId || '',
  chainId: chainIdNumber(activity.chainId),
  copyRunId: activity.copyRunId,
  copyAccount: activity.copyAccount as Address | undefined,
  activityType: (activity.type?.replace('ACTIVITY_TYPE_', '').toLowerCase() || 'unknown') as ActivityType,
  summary: activity.summary || '',
  occurredAt: activity.occurredAt || '',
  userPositionId: activity.userPositionId,
  followerPositionId: activity.followerPositionId,
  tradeId: activity.tradeId,
  txHash: activity.txHash,
  agentDisplayName: activity.agentDisplayName,
  agentAvatarUrl: activity.agentAvatarUrl,
  copyLifecycle: activity.copyLifecycle,
  position: toPositionActivity(activity.position),
  capital: toCapitalActivity(activity.capital),
  fee: toFeeActivity(activity.fee),
  execution: toExecutionActivity(activity.execution),
})

export const adaptActivityResponse = (
  response: ApiCursorResponse<ApiActivity>,
): OwnerActivityResponse | CopyAccountHistoryResponse => cursorResponse(response, toActivity)

const toActionLog = (log: ApiAgentActionLog): CotLog => ({
  logId: log.actionLogId || '',
  agentId: '',
  chainId: chainIdNumber(log.chainId),
  positionId: log.leaderPositionId,
  trigger: log.trigger || '',
  data: log.dataSummary || '',
  reasoning: log.reasoningSummary || '',
  action: log.actionSummary || log.action || '',
  actionCode: log.action,
  status: log.status || '',
  summary: log.summary,
  txHash: log.txHash,
  blockNumber: log.blockNumber,
  tokenAddress: log.tokenAddress as Address | undefined,
  model: log.model,
  strategyVersion: log.strategyVersion,
  occurredAt: log.occurredAt || '',
})

export const adaptActionLogsResponse = (
  response: ApiCursorResponse<ApiAgentActionLogSessionGroup>,
): CotLogsResponse => {
  const groupedResponse = cursorResponse(response, group => (group.logs || []).map(toActionLog))

  return {
    ...groupedResponse,
    data: groupedResponse.data.flat(),
  }
}
