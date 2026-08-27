import type {
  ActivityRow,
  AlertFeedContext,
  AlertLeaderActionContext,
  AlertOutcomeStatus,
  AlertUserOutcome,
} from 'services/copyTrading/types/copyRuns'
import type { CotLog } from 'services/copyTrading/types/positions'
import type {
  ActivityCategory,
  ActivitySubtype,
  ActivityType,
  Address,
  TradeSide,
} from 'services/copyTrading/types/primitives'
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
  category?: string
  subtype?: string
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
  }
  alert?: {
    alertId?: string
    leaderContextStatus?: string
    leader?: {
      side?: string
      leaderPositionId?: string
      leaderPositionEventId?: string
      baseToken?: ApiToken
      quoteToken?: ApiToken
      baseAmountRaw?: string
      quoteAmountRaw?: string
      canonicalLeaderTxHash?: string
      occurredAt?: string
    }
    user?: {
      side?: string
      status?: string
      baseAmountRaw?: string
      quoteAmountRaw?: string
      attemptedTxHash?: string
      canonicalFollowerTxHash?: string
      publicErrorCode?: string
      publicErrorMessage?: string
      completeness?: AlertUserOutcome['completeness']
      finality?: AlertUserOutcome['finality']
      quotePerBasePrice?: ApiMetric
    }
    fallbackAgentSummaryEn?: string
    fallbackUserSummaryEn?: string
  }
}

type ApiAlert = NonNullable<ApiActivity['alert']>
type ApiAlertLeader = NonNullable<ApiAlert['leader']>
type ApiAlertUser = NonNullable<ApiAlert['user']>

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
  token?: ApiToken
  side?: string
  model?: string
  strategyVersion?: string
}

const enumValue = (value: string | undefined, prefix: string) =>
  value?.startsWith(prefix) ? value.slice(prefix.length).toLowerCase() : undefined

const toAlertOutcomeStatus = (status?: string): AlertOutcomeStatus => {
  const value = enumValue(status, 'ALERT_OUTCOME_STATUS_')
  switch (value) {
    case 'pending':
    case 'succeeded':
    case 'skipped':
    case 'effect_observed_incomplete':
      return value
    default:
      return 'unknown'
  }
}

const toAlertLeaderContextStatus = (status?: string): AlertFeedContext['leaderContextStatus'] => {
  const value = enumValue(status, 'ALERT_LEADER_CONTEXT_STATUS_')
  switch (value) {
    case 'present':
    case 'not_applicable':
    case 'unavailable':
      return value
    default:
      return 'unknown'
  }
}

const toTradeSide = (side?: string): TradeSide => {
  const value = enumValue(side, 'TRADE_SIDE_')
  return value === 'buy' || value === 'sell' ? value : 'unknown'
}

const toAlertLeader = (leader?: ApiAlertLeader): AlertLeaderActionContext | undefined =>
  leader
    ? {
        ...leader,
        side: toTradeSide(leader.side),
        baseToken: leader.baseToken ? toToken(leader.baseToken) : undefined,
        quoteToken: leader.quoteToken ? toToken(leader.quoteToken) : undefined,
      }
    : undefined

const toAlertUser = (user?: ApiAlertUser): AlertUserOutcome | undefined => {
  if (!user) return undefined

  return {
    ...user,
    side: toTradeSide(user.side),
    status: toAlertOutcomeStatus(user.status),
    quotePerBasePrice: user.quotePerBasePrice,
  }
}

const toAlert = (alert?: ApiActivity['alert']): AlertFeedContext | undefined => {
  if (!alert) return undefined

  return {
    alertId: alert.alertId || '',
    leaderContextStatus: toAlertLeaderContextStatus(alert.leaderContextStatus),
    leader: toAlertLeader(alert.leader),
    user: toAlertUser(alert.user),
    fallbackAgentSummaryEn: alert.fallbackAgentSummaryEn,
    fallbackUserSummaryEn: alert.fallbackUserSummaryEn,
  }
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
  detail ? { ...detail } : undefined

const toActivity = (activity: ApiActivity): ActivityRow => ({
  activityId: activity.activityId || '',
  ownerAddress: (activity.ownerAddress || '') as Address,
  agentId: activity.agentId || '',
  chainId: chainIdNumber(activity.chainId),
  copyRunId: activity.copyRunId,
  copyAccount: activity.copyAccount as Address | undefined,
  activityType: (enumValue(activity.type, 'ACTIVITY_TYPE_') || 'unknown') as ActivityType,
  category: enumValue(activity.category, 'ACTIVITY_CATEGORY_') as ActivityCategory | undefined,
  subtype: enumValue(activity.subtype, 'ACTIVITY_SUBTYPE_') as ActivitySubtype | undefined,
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
  alert: toAlert(activity.alert),
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
  token: log.token ? toToken(log.token) : undefined,
  side: toTradeSide(log.side),
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
