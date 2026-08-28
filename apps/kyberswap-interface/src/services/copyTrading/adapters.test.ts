import { describe, expect, it } from 'vitest'

import { adaptActionLogsResponse, adaptActivityResponse } from './adapters/activity'
import { adaptPerformanceResponse } from './adapters/agents'
import { adaptCopyAccountBalancesResponse, adaptCopyAccountWalletInventoryResponse } from './adapters/copyAccounts'
import { adaptCopyRunCashbackPolicyResponse, adaptCopyRunResponse } from './adapters/copyRuns'
import {
  adaptAgentPositionsResponse,
  adaptClosedPositionExecutionsResponse,
  adaptPositionsResponse,
} from './adapters/positions'

const currentCapital = {
  value: '12.34',
  status: 'METRIC_STATUS_CURRENT' as const,
}

describe('adaptCopyRunResponse', () => {
  it.each([
    ['CAPITAL_IN_PROJECTION_STATUS_READY', currentCapital, '12.34'],
    ['CAPITAL_IN_PROJECTION_STATUS_READY', { value: '12.34', status: 'METRIC_STATUS_UNAVAILABLE' }, undefined],
    ['CAPITAL_IN_PROJECTION_STATUS_SYNCING', currentCapital, '12.34'],
    ['CAPITAL_IN_PROJECTION_STATUS_SYNCING', { value: '12.34', status: 'METRIC_STATUS_STALE' }, '12.34'],
    ['CAPITAL_IN_PROJECTION_STATUS_UNAVAILABLE', { status: 'METRIC_STATUS_UNAVAILABLE' }, undefined],
  ] as const)(
    'maps Capital In independently from its projection badge when %s',
    (capitalInProjectionStatus, capitalInUsd, expectedCapitalInUsd) => {
      const response = adaptCopyRunResponse({
        data: {
          capitalInProjectionStatus,
          capitalInUsd,
        },
      })

      expect(response.data.capitalInUsd).toBe(expectedCapitalInUsd)
      expect(response.data.capitalInProjectionStatus).toBe(
        capitalInProjectionStatus.replace('CAPITAL_IN_PROJECTION_STATUS_', '').toLowerCase(),
      )
    },
  )

  it('maps server-owned detail metrics and preserves a stale Current Balance for labeled display', () => {
    const response = adaptCopyRunResponse({
      data: {
        status: 'COPY_RUN_STATUS_CLOSING',
        stoppedAt: '2026-08-27T01:00:00Z',
        currentBalanceUsd: { value: '105', status: 'METRIC_STATUS_STALE' },
        totalPnlUsd: { value: '5', status: 'METRIC_STATUS_CURRENT' },
        totalPnlPct: { value: '4.8', status: 'METRIC_STATUS_CURRENT' },
        portfolioPnlUsd: { value: '2.5', status: 'METRIC_STATUS_CURRENT' },
        feeBreakdown: {
          feeChargedUsd: { value: '2', status: 'METRIC_STATUS_CURRENT' },
          rebatesUsd: { value: '3.2', status: 'METRIC_STATUS_CURRENT' },
          netFeesUsd: { value: '-1.2', status: 'METRIC_STATUS_CURRENT' },
        },
        copyRunWinRatePct: { value: '60', status: 'METRIC_STATUS_CURRENT' },
        copyRunClassifiedClosedPositionCount: { value: '5', status: 'METRIC_STATUS_CURRENT' },
      },
    })

    expect(response.data).toMatchObject({
      status: 'closing',
      totalPnlUsd: '5',
      totalPnlPct: '4.8',
      portfolioPnlUsd: '2.5',
      feeBreakdown: { feeChargedUsd: '2', rebatesUsd: '3.2', netFeesUsd: '-1.2' },
      copyRunWinRatePct: '60',
      copyRunClassifiedClosedPositionCount: '5',
    })
    expect(response.data.currentBalanceUsd).toBe('105')
    expect(response.data.metrics.currentBalanceUsd?.status).toBe('METRIC_STATUS_STALE')
    expect(response.data).not.toHaveProperty('observedCapitalInUsd')
    expect(response.data).not.toHaveProperty('netFeeCostUsd')
  })
})

describe('adaptPerformanceResponse', () => {
  it('keeps total PnL USD and holding-period return statuses independent', () => {
    const response = adaptPerformanceResponse({
      data: [
        {
          timestamp: '2026-08-27T00:00:00Z',
          series: 'PERFORMANCE_SERIES_CUMULATIVE_TOTAL_PNL',
          valueUsd: { value: '12', status: 'METRIC_STATUS_STALE' },
          valuePct: { value: '3', status: 'METRIC_STATUS_UNAVAILABLE' },
        },
      ],
      pagination: { hasMore: false, limit: 100 },
      effectiveWindowStart: '2026-07-27T00:00:00Z',
      evaluationAt: '2026-08-27T00:00:00Z',
    })

    expect(response.data[0]).toMatchObject({ series: 'cumulative_total_pnl', totalPnlUsd: '12' })
    expect(response.data[0].valuePct).toBeUndefined()
    expect(response.data[0].percentageMetric?.status).toBe('METRIC_STATUS_UNAVAILABLE')
    expect(response.effectiveWindowStart).toBe('2026-07-27T00:00:00Z')
    expect(response.evaluationAt).toBe('2026-08-27T00:00:00Z')
  })
})

describe('adaptActionLogsResponse', () => {
  it('flattens session groups and adapts their nested action logs', () => {
    const response = adaptActionLogsResponse({
      data: [
        {
          sessionId: 'session-1',
          logs: [
            {
              actionLogId: 'log-1',
              action: 'buy',
              actionSummary: 'Buy ETH',
              chainId: '8453',
              occurredAt: '2026-08-14T01:02:03Z',
              side: 'TRADE_SIDE_BUY',
              token: { chainId: '8453', address: '0x1111111111111111111111111111111111111111', symbol: 'ETH' },
            },
          ],
        },
      ],
      pagination: { hasMore: true, limit: 10, nextCursor: 'next' },
    })

    expect(response).toMatchObject({
      data: [
        {
          logId: 'log-1',
          action: 'Buy ETH',
          actionCode: 'buy',
          chainId: 8453,
          side: 'buy',
          token: { symbol: 'ETH' },
        },
      ],
      pagination: { hasMore: true, limit: 10, nextCursor: 'next' },
    })
  })
})

describe('adaptActivityResponse', () => {
  it('preserves the stable alert identity and structured pending context', () => {
    const response = adaptActivityResponse({
      data: [
        {
          activityId: 'activity-1',
          category: 'ACTIVITY_CATEGORY_TRADE',
          subtype: 'ACTIVITY_SUBTYPE_BUY',
          alert: {
            alertId: 'alert-1',
            leaderContextStatus: 'ALERT_LEADER_CONTEXT_STATUS_PRESENT',
            leader: {
              side: 'TRADE_SIDE_BUY',
              baseToken: { chainId: '8453', address: '0x1111111111111111111111111111111111111111', symbol: 'ETH' },
              canonicalLeaderTxHash: '0xleader',
            },
            user: {
              side: 'TRADE_SIDE_BUY',
              status: 'ALERT_OUTCOME_STATUS_PENDING',
              completeness: 'DATA_COMPLETENESS_PENDING',
              finality: 'DATA_FINALITY_PROVISIONAL',
            },
          },
        },
      ],
      pagination: { hasMore: false, limit: 10 },
    })

    expect(response.data[0]).toMatchObject({
      category: 'trade',
      subtype: 'buy',
      alert: {
        alertId: 'alert-1',
        leaderContextStatus: 'present',
        leader: { side: 'buy', baseToken: { symbol: 'ETH' }, canonicalLeaderTxHash: '0xleader' },
        user: { side: 'buy', status: 'pending' },
      },
    })
  })
})

describe('closed position executions', () => {
  it('maps cumulative receipt fields and canonical execution pages', () => {
    const positions = adaptPositionsResponse({
      data: [
        {
          positionId: 'position-1',
          lifecycle: 'POSITION_LIFECYCLE_CLOSED',
          totalBaseSoldRaw: '1000000',
          totalBaseSoldDecimal: { value: '1', status: 'METRIC_STATUS_CURRENT' },
          totalQuoteReceivedRaw: '2500000',
          totalQuoteReceivedDecimal: { value: '2.5', status: 'METRIC_STATUS_CURRENT' },
          latestTxHash: '0xfinal',
        },
      ],
      pagination: { hasMore: false, limit: 10 },
    })
    const executions = adaptClosedPositionExecutionsResponse({
      data: [
        {
          positionEventId: 'event-1',
          positionId: 'position-1',
          baseAmountSoldDecimal: { value: '1', status: 'METRIC_STATUS_CURRENT' },
          quoteAmountReceivedDecimal: { value: '2.5', status: 'METRIC_STATUS_CURRENT' },
          txHash: '0xfinal',
          isFinalClose: true,
        },
      ],
      pagination: { hasMore: false, limit: 10 },
    })

    expect(positions.data[0]).toMatchObject({
      totalBaseSoldRaw: '1000000',
      totalBaseSoldDecimal: '1',
      totalQuoteReceivedRaw: '2500000',
      totalQuoteReceivedDecimal: '2.5',
      latestTxHash: '0xfinal',
    })
    expect(executions.data[0]).toMatchObject({
      positionEventId: 'event-1',
      baseAmountSoldDecimal: '1',
      quoteAmountReceivedDecimal: '2.5',
      txHash: '0xfinal',
      isFinalClose: true,
    })
  })
})

describe('position model boundaries', () => {
  it('uses server Position P&L for follower positions', () => {
    const response = adaptPositionsResponse({
      data: [
        {
          positionId: 'position-1',
          lifecycle: 'POSITION_LIFECYCLE_ACTIVE',
          positionPnlUsd: { value: '4.2', status: 'METRIC_STATUS_CURRENT' },
          realizedPnlUsd: { value: '1', status: 'METRIC_STATUS_CURRENT' },
          unrealizedPnlUsd: { value: '2', status: 'METRIC_STATUS_CURRENT' },
          estimatedCashbackUsd: { value: '1.2', status: 'METRIC_STATUS_CURRENT' },
        },
      ],
      pagination: { hasMore: false, limit: 10 },
    })

    expect(response.data[0].positionPnlUsd).toBe('4.2')
    expect(response.data[0].metrics.positionPnlUsd?.value).toBe('4.2')
  })

  it('keeps leader positions free of follower accounting and action fields', () => {
    const response = adaptAgentPositionsResponse({
      data: [
        {
          positionId: 'leader-position-1',
          agentId: 'agent-1',
          lifecycle: 'POSITION_LIFECYCLE_ACTIVE',
          userPositionId: 'follower-position-1',
          positionPnlUsd: { value: '4.2', status: 'METRIC_STATUS_CURRENT' },
          actionKind: 'POSITION_ACTION_KIND_MANUAL_SELL',
        },
      ],
      pagination: { hasMore: false, limit: 10 },
    })

    expect(response.data[0]).not.toHaveProperty('userPositionId')
    expect(response.data[0]).not.toHaveProperty('positionPnlUsd')
    expect(response.data[0]).not.toHaveProperty('actionKind')
  })
})

describe('adaptCopyAccountBalancesResponse', () => {
  it('preserves a present pinned stable balance with an exact zero on-chain amount', () => {
    const response = adaptCopyAccountBalancesResponse({
      data: [],
      pagination: { hasMore: false, limit: 10 },
      pinnedStableBalance: {
        status: 'PINNED_STABLE_BALANCE_STATUS_PRESENT',
        balance: {
          amountDecimal: '0',
          balanceSource: 'onchain_rpc',
          chainId: '8453',
          copyAccount: '0x2222222222222222222222222222222222222222',
          tokenAddress: '0x3333333333333333333333333333333333333333',
        },
      },
    })

    expect(response.pinnedStableBalance?.balance).toMatchObject({
      amountDecimal: '0',
      balanceSource: 'onchain_rpc',
    })
  })
})

describe('adaptCopyAccountWalletInventoryResponse', () => {
  it('preserves the authoritative total, completeness and pinned zero balance', () => {
    const response = adaptCopyAccountWalletInventoryResponse({
      data: [
        {
          amountDecimal: '2',
          chainId: '8453',
          copyAccount: '0x2222222222222222222222222222222222222222',
          currentValuation: { status: 'DATA_STATUS_STALE', valueUsd: '5' },
          tokenAddress: '0x3333333333333333333333333333333333333333',
        },
      ],
      walletInventoryValueUsd: { status: 'METRIC_STATUS_STALE', value: '5' },
      complete: true,
      pinnedStableBalance: {
        status: 'PINNED_STABLE_BALANCE_STATUS_PRESENT',
        balance: {
          amountDecimal: '0',
          chainId: '8453',
          copyAccount: '0x2222222222222222222222222222222222222222',
          tokenAddress: '0x4444444444444444444444444444444444444444',
        },
      },
    })

    expect(response).toMatchObject({
      complete: true,
      walletInventoryValueUsd: { status: 'METRIC_STATUS_STALE', value: '5' },
      data: [{ chainId: 8453, valueUsd: '5' }],
      pinnedStableBalance: { balance: { amountDecimal: '0' } },
    })
  })
})

describe('adaptCopyRunCashbackPolicyResponse', () => {
  it.each([
    'COPY_RUN_CASHBACK_POLICY_STATUS_AVAILABLE',
    'COPY_RUN_CASHBACK_POLICY_STATUS_NOT_CONFIGURED',
    'COPY_RUN_CASHBACK_POLICY_STATUS_INVALIDATED',
    'COPY_RUN_CASHBACK_POLICY_STATUS_UNAVAILABLE',
  ] as const)('preserves the typed %s policy state and response freshness', status => {
    const response = adaptCopyRunCashbackPolicyResponse({
      data: {
        copyRunId: 'copy-run-1',
        chainId: '8453',
        copyAccount: '0x2222222222222222222222222222222222222222',
        agentId: 'agent-1',
        status,
        scope: 'COPY_RUN_CASHBACK_POLICY_SCOPE_DEFAULT',
      },
      meta: { status: 'DATA_STATUS_STALE' },
    })

    expect(response.data).toMatchObject({
      chainId: 8453,
      status,
      scope: 'COPY_RUN_CASHBACK_POLICY_SCOPE_DEFAULT',
    })
    expect(response.data.capCashbackRatioRaw).toBeUndefined()
    expect(response.data.pnlRateRaw).toBeUndefined()
    expect(response.data.cashbackFormulaVersion).toBeUndefined()
    expect(response.meta?.status).toBe('DATA_STATUS_STALE')
  })
})
