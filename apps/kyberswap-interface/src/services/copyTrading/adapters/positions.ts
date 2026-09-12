import type {
  AgentPositionSummary,
  ClosedPositionExecution,
  ClosedPositionExecutionPage,
  PositionEvent,
  PositionExitKind,
  PositionSummary,
} from 'services/copyTrading/types/positions'
import type { Address, PositionLifecycle, PositionQuantityState } from 'services/copyTrading/types/primitives'
import type {
  AgentPositionEventsResponse,
  AgentPositionResponse,
  AgentPositionsResponse,
  CopyAccountPositionsResponse,
  CopyRunPositionClosedExecutionsResponse,
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
  positionPnlUsd?: ApiMetric
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
  latestSkipPublicErrorCode?: string
  durationSeconds?: string
  durationAsOf?: string
  openedAt?: string
  closedAt?: string
  openedTxHash?: string
  latestTxHash?: string
  totalBaseSoldRaw?: string
  totalQuoteReceivedRaw?: string
  quoteToken?: ApiToken
  totalBaseSoldDecimal?: ApiMetric
  totalQuoteReceivedDecimal?: ApiMetric
  totalQuoteReceivedValueUsd?: ApiMetric
  closedExecutionPage?: ApiClosedPositionExecutionPage
}

type ApiClosedPositionExecution = {
  positionEventId?: string
  positionId?: string
  baseToken?: ApiToken
  baseAmountSoldRaw?: string
  baseAmountSoldDecimal?: ApiMetric
  quoteToken?: ApiToken
  quoteAmountReceivedRaw?: string
  quoteAmountReceivedDecimal?: ApiMetric
  quoteAmountReceivedValueUsd?: ApiMetric
  txHash?: string
  occurredAt?: string
  isFinalClose?: boolean
  realizedPnlUsd?: ApiMetric
  realizedPnlPct?: ApiMetric
  quotePerBasePrice?: ApiMetric
}

type ApiClosedPositionExecutionPage = {
  data?: ApiClosedPositionExecution[]
  pagination?: ApiCursorResponse<unknown>['pagination']
}

const toClosedPositionExecution = (execution: ApiClosedPositionExecution): ClosedPositionExecution => ({
  positionEventId: execution.positionEventId || '',
  positionId: execution.positionId || '',
  baseToken: execution.baseToken ? toToken(execution.baseToken) : undefined,
  baseAmountSoldRaw: execution.baseAmountSoldRaw,
  baseAmountSoldDecimal: metricValue(execution.baseAmountSoldDecimal),
  quoteToken: execution.quoteToken ? toToken(execution.quoteToken) : undefined,
  quoteAmountReceivedRaw: execution.quoteAmountReceivedRaw,
  quoteAmountReceivedDecimal: metricValue(execution.quoteAmountReceivedDecimal),
  quoteAmountReceivedValueUsd: metricValue(execution.quoteAmountReceivedValueUsd),
  txHash: execution.txHash,
  occurredAt: execution.occurredAt,
  isFinalClose: execution.isFinalClose,
  realizedPnlUsd: metricValue(execution.realizedPnlUsd),
  realizedPnlPct: metricValue(execution.realizedPnlPct),
  quotePerBasePrice: metricValue(execution.quotePerBasePrice),
  metrics: {
    baseAmountSoldDecimal: execution.baseAmountSoldDecimal,
    quoteAmountReceivedDecimal: execution.quoteAmountReceivedDecimal,
    quoteAmountReceivedValueUsd: execution.quoteAmountReceivedValueUsd,
    realizedPnlUsd: execution.realizedPnlUsd,
    realizedPnlPct: execution.realizedPnlPct,
    quotePerBasePrice: execution.quotePerBasePrice,
  },
})

const toClosedPositionExecutionPage = (
  page?: ApiClosedPositionExecutionPage,
): ClosedPositionExecutionPage | undefined =>
  page?.pagination
    ? {
        data: (page.data || []).map(toClosedPositionExecution),
        pagination: {
          nextCursor: page.pagination.nextCursor,
          hasMore: page.pagination.hasMore === true,
          limit: page.pagination.limit || 10,
        },
      }
    : undefined

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

const toAgentPosition = (position: ApiPosition): AgentPositionSummary => {
  const token = toToken(position.token)
  const amountRaw = position.displayBaseRaw || position.remainingBaseRaw || '0'
  const lifecycle = toPositionLifecycle(position.lifecycle)

  return {
    positionId: position.positionId || '',
    agentId: position.agentId || '',
    chainId: chainIdNumber(position.chainId),
    tradeId: position.tradeId || '',
    token,
    status: toPositionStatus(lifecycle),
    lifecycle,
    amountRaw,
    amountDecimal: formatRawAmount(amountRaw, token.decimals),
    remainingBaseRaw: position.remainingBaseRaw,
    totalGrossBaseBoughtRaw: position.totalGrossBaseBoughtRaw,
    totalGrossBaseSoldRaw: position.totalGrossBaseSoldRaw,
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
    metrics: {
      realizedPnlUsd: position.realizedPnlUsd,
      unrealizedPnlUsd: position.unrealizedPnlUsd,
      unrealizedPnlPct: position.unrealizedPnlPct,
    },
    quantityState: toPositionQuantityState(position.quantityState),
    exitKind: toPositionExitKind(position.exitKind),
    durationSeconds: position.durationSeconds,
    durationAsOf: position.durationAsOf,
    openedAt: position.openedAt || '',
    closedAt: position.closedAt,
    openedTxHash: position.openedTxHash,
    latestTxHash: position.latestTxHash,
  }
}

const toPosition = (position: ApiPosition): PositionSummary => {
  const agentPosition = toAgentPosition(position)

  return {
    ...agentPosition,
    userPositionId: position.userPositionId,
    agentPositionId: position.agentPositionId,
    copyRunId: position.copyRunId,
    copyAccount: position.copyAccount as Address | undefined,
    upfrontFeeCapturedBaseRaw: position.upfrontFeeCapturedBaseRaw,
    upfrontFeeReleasedBaseRaw: position.upfrontFeeReleasedBaseRaw,
    netBaseReceivedRaw: position.netBaseReceivedRaw,
    remainingNetBaseRaw: position.remainingNetBaseRaw,
    positionPnlUsd: metricValue(position.positionPnlUsd),
    flatFeeCapturedUsd: metricValue(position.flatFeeCapturedUsd),
    cashbackReceivedUsd: metricValue(position.cashbackReceivedUsd),
    netFeeCostUsd: metricValue(position.netFeeCostUsd),
    estimatedCashbackUsd: metricValue(position.estimatedCashbackUsd),
    metrics: {
      ...agentPosition.metrics,
      positionPnlUsd: position.positionPnlUsd,
      flatFeeCapturedUsd: position.flatFeeCapturedUsd,
      cashbackReceivedUsd: position.cashbackReceivedUsd,
      netFeeCostUsd: position.netFeeCostUsd,
      estimatedCashbackUsd: position.estimatedCashbackUsd,
      skippedSellCount: position.skippedSellCount,
      latestSkippedRatio: position.latestSkippedRatio,
      cumulativeSkippedRatio: position.cumulativeSkippedRatio,
    },
    actionKind: position.actionKind as PositionSummary['actionKind'],
    availableActionKinds: (position.availableActionKinds || []) as PositionSummary['availableActionKinds'],
    latestSkipPublicErrorCode: position.latestSkipPublicErrorCode,
    totalBaseSoldRaw: position.totalBaseSoldRaw,
    totalQuoteReceivedRaw: position.totalQuoteReceivedRaw,
    quoteToken: position.quoteToken ? toToken(position.quoteToken) : undefined,
    totalBaseSoldDecimal: metricValue(position.totalBaseSoldDecimal),
    totalQuoteReceivedDecimal: metricValue(position.totalQuoteReceivedDecimal),
    totalQuoteReceivedValueUsd: metricValue(position.totalQuoteReceivedValueUsd),
    closedExecutionPage: toClosedPositionExecutionPage(position.closedExecutionPage),
  }
}

export const adaptPositionsResponse = (
  response: ApiCursorResponse<ApiPosition>,
): CopyRunPositionsResponse | OwnerPositionsResponse | CopyAccountPositionsResponse =>
  cursorResponse(response, toPosition)

export const adaptAgentPositionsResponse = (response: ApiCursorResponse<ApiPosition>): AgentPositionsResponse =>
  cursorResponse(response, toAgentPosition)

export const adaptAgentPositionResponse = (response: ApiSingleResponse<ApiPosition>): AgentPositionResponse =>
  singleResponse(response, toAgentPosition)

export const adaptClosedPositionExecutionsResponse = (
  response: ApiCursorResponse<ApiClosedPositionExecution>,
): CopyRunPositionClosedExecutionsResponse => cursorResponse(response, toClosedPositionExecution)

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
