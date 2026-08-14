import type { PositionEvent, PositionExitKind, PositionSummary } from 'services/copyTrading/types/positions'
import type { Address, PositionLifecycle, PositionQuantityState } from 'services/copyTrading/types/primitives'
import type {
  AgentPositionEventsResponse,
  AgentPositionResponse,
  AgentPositionsResponse,
  CopyAccountPositionsResponse,
  CopyRunPositionsResponse,
  OwnerPositionsResponse,
} from 'services/copyTrading/types/responses'

import {
  type ApiCursorResponse,
  type ApiMetric,
  type ApiSingleResponse,
  type ApiToken,
  type ApiValuation,
  chainIdNumber,
  cursorResponse,
  formatRawAmount,
  isValuationRenderable,
  metricValue,
  singleResponse,
  toToken,
} from './shared'

type ApiPosition = {
  positionId?: string
  userPositionId?: string
  agentPositionId?: string
  copyRunId?: string
  agentId?: string
  chainId?: string
  copyAccount?: string
  tradeId?: string
  token?: ApiToken
  lifecycle?: string
  remainingBaseRaw?: string
  totalGrossBaseBoughtRaw?: string
  totalGrossBaseSoldRaw?: string
  upfrontFeeCapturedBaseRaw?: string
  upfrontFeeReleasedBaseRaw?: string
  netBaseReceivedRaw?: string
  remainingNetBaseRaw?: string
  displayBaseRaw?: string
  entryValuation?: ApiValuation
  currentValuation?: ApiValuation
  exitValuation?: ApiValuation
  realizedPnlUsd?: ApiMetric
  unrealizedPnlUsd?: ApiMetric
  unrealizedPnlPct?: ApiMetric
  flatFeeCapturedUsd?: ApiMetric
  cashbackReceivedUsd?: ApiMetric
  netFeeCostUsd?: ApiMetric
  estimatedCashbackUsd?: ApiMetric
  skippedSellCount?: ApiMetric
  latestSkippedRatio?: ApiMetric
  cumulativeSkippedRatio?: ApiMetric
  quantityState?: string
  exitKind?: string
  actionKind?: string
  availableActionKinds?: string[]
  isLeftover?: boolean
  leftoverReason?: string
  leftoverValuation?: ApiValuation
  latestSkipPublicErrorCode?: string
  durationSeconds?: string
  durationAsOf?: string
  openedAt?: string
  closedAt?: string
}

const toPositionLifecycle = (lifecycle?: string): PositionLifecycle => {
  const value = lifecycle?.replace('POSITION_LIFECYCLE_', '').toLowerCase()
  return value === 'active' || value === 'closing' || value === 'closed' ? value : 'unknown'
}

const toPositionQuantityState = (quantityState?: string): PositionQuantityState => {
  const value = quantityState?.replace('POSITION_QUANTITY_STATE_', '').toLowerCase()
  return value === 'open_full' || value === 'open_partial' || value === 'closed' ? value : 'unknown'
}

const toPositionStatus = (lifecycle: PositionLifecycle) =>
  lifecycle === 'closed'
    ? ('closed' as const)
    : lifecycle === 'active' || lifecycle === 'closing'
    ? ('open' as const)
    : ('unknown' as const)

const toPositionExitKind = (exitKind?: string): PositionExitKind | undefined => {
  if (
    exitKind === 'POSITION_EXIT_KIND_UNSPECIFIED' ||
    exitKind === 'POSITION_EXIT_KIND_ALIGNED' ||
    exitKind === 'POSITION_EXIT_KIND_MANUAL'
  ) {
    return exitKind
  }

  return undefined
}

const toPosition = (position: ApiPosition): PositionSummary => {
  const token = toToken(position.token)
  const amountRaw = position.displayBaseRaw || position.remainingBaseRaw || '0'
  const lifecycle = toPositionLifecycle(position.lifecycle)

  return {
    positionId: position.positionId || '',
    userPositionId: position.userPositionId,
    agentPositionId: position.agentPositionId,
    copyRunId: position.copyRunId,
    agentId: position.agentId || '',
    chainId: chainIdNumber(position.chainId),
    copyAccount: position.copyAccount as Address | undefined,
    tradeId: position.tradeId || '',
    token,
    status: toPositionStatus(lifecycle),
    lifecycle,
    amountRaw,
    amountDecimal: formatRawAmount(amountRaw, token.decimals),
    remainingBaseRaw: position.remainingBaseRaw,
    totalGrossBaseBoughtRaw: position.totalGrossBaseBoughtRaw,
    totalGrossBaseSoldRaw: position.totalGrossBaseSoldRaw,
    upfrontFeeCapturedBaseRaw: position.upfrontFeeCapturedBaseRaw,
    upfrontFeeReleasedBaseRaw: position.upfrontFeeReleasedBaseRaw,
    netBaseReceivedRaw: position.netBaseReceivedRaw,
    remainingNetBaseRaw: position.remainingNetBaseRaw,
    displayBaseRaw: position.displayBaseRaw,
    entryValuation: position.entryValuation,
    currentValuation: position.currentValuation,
    exitValuation: position.exitValuation,
    entryPriceUsd: isValuationRenderable(position.entryValuation) ? position.entryValuation?.priceUsd : undefined,
    currentPriceUsd: isValuationRenderable(position.currentValuation) ? position.currentValuation?.priceUsd : undefined,
    exitPriceUsd: isValuationRenderable(position.exitValuation) ? position.exitValuation?.priceUsd : undefined,
    valueUsd: isValuationRenderable(position.currentValuation)
      ? position.currentValuation?.valueUsd
      : isValuationRenderable(position.exitValuation)
      ? position.exitValuation?.valueUsd
      : undefined,
    realizedPnlUsd: metricValue(position.realizedPnlUsd),
    unrealizedPnlUsd: metricValue(position.unrealizedPnlUsd),
    unrealizedPnlPct: metricValue(position.unrealizedPnlPct),
    flatFeeCapturedUsd: metricValue(position.flatFeeCapturedUsd),
    cashbackReceivedUsd: metricValue(position.cashbackReceivedUsd),
    netFeeCostUsd: metricValue(position.netFeeCostUsd),
    estimatedCashbackUsd: metricValue(position.estimatedCashbackUsd),
    metrics: {
      realizedPnlUsd: position.realizedPnlUsd,
      unrealizedPnlUsd: position.unrealizedPnlUsd,
      unrealizedPnlPct: position.unrealizedPnlPct,
      flatFeeCapturedUsd: position.flatFeeCapturedUsd,
      cashbackReceivedUsd: position.cashbackReceivedUsd,
      netFeeCostUsd: position.netFeeCostUsd,
      estimatedCashbackUsd: position.estimatedCashbackUsd,
      skippedSellCount: position.skippedSellCount,
      latestSkippedRatio: position.latestSkippedRatio,
      cumulativeSkippedRatio: position.cumulativeSkippedRatio,
    },
    quantityState: toPositionQuantityState(position.quantityState),
    exitKind: toPositionExitKind(position.exitKind),
    actionKind: position.actionKind as PositionSummary['actionKind'],
    availableActionKinds: (position.availableActionKinds || []) as PositionSummary['availableActionKinds'],
    isLeftover: position.isLeftover,
    leftoverReason: position.leftoverReason,
    leftoverValuation: position.leftoverValuation,
    latestSkipPublicErrorCode: position.latestSkipPublicErrorCode,
    durationSeconds: position.durationSeconds,
    durationAsOf: position.durationAsOf,
    openedAt: position.openedAt || '',
    closedAt: position.closedAt,
  }
}

export const adaptPositionsResponse = (
  response: ApiCursorResponse<ApiPosition>,
): AgentPositionsResponse | CopyRunPositionsResponse | OwnerPositionsResponse | CopyAccountPositionsResponse =>
  cursorResponse(response, toPosition)

export const adaptPositionResponse = (response: ApiSingleResponse<ApiPosition>): AgentPositionResponse =>
  singleResponse(response, toPosition)

export const adaptPositionEventsResponse = (
  response: ApiCursorResponse<{
    eventId?: string
    positionId?: string
    chainId?: string
    eventType?: string
    summary?: string
    occurredAt?: string
    txHash?: string
    blockNumber?: string
  }>,
): AgentPositionEventsResponse =>
  cursorResponse(
    response,
    (event): PositionEvent => ({
      eventId: event.eventId || '',
      positionId: event.positionId || '',
      activityType: event.eventType?.toLowerCase() || '',
      chainId: chainIdNumber(event.chainId),
      summary: event.summary || '',
      occurredAt: event.occurredAt || '',
      txHash: event.txHash,
      blockNumber: event.blockNumber,
      metadata: {
        txHash: event.txHash,
        blockNumber: event.blockNumber,
      },
    }),
  )
