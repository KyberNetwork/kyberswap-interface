import { describe, expect, it } from 'vitest'

import { adaptActionLogsResponse } from './adapters/activity'
import { adaptCopyAccountBalancesResponse, adaptCopyAccountWalletInventoryResponse } from './adapters/copyAccounts'
import { adaptCopyRunCashbackPolicyResponse, adaptCopyRunResponse } from './adapters/copyRuns'

const currentCapital = {
  value: '12.34',
  status: 'METRIC_STATUS_CURRENT' as const,
}

describe('adaptCopyRunResponse', () => {
  it.each([
    ['CAPITAL_IN_PROJECTION_STATUS_READY', currentCapital, '56.78', '12.34'],
    ['CAPITAL_IN_PROJECTION_STATUS_READY', { value: '12.34', status: 'METRIC_STATUS_UNAVAILABLE' }, '56.78', undefined],
    ['CAPITAL_IN_PROJECTION_STATUS_SYNCING', currentCapital, '56.78', undefined],
    ['CAPITAL_IN_PROJECTION_STATUS_SYNCING', { value: '12.34', status: 'METRIC_STATUS_STALE' }, '56.78', undefined],
    ['CAPITAL_IN_PROJECTION_STATUS_UNAVAILABLE', currentCapital, '56.78', undefined],
    ['CAPITAL_IN_PROJECTION_STATUS_UNAVAILABLE', currentCapital, undefined, undefined],
  ] as const)(
    'only exposes canonical Capital In when %s is ready',
    (capitalInProjectionStatus, capitalInUsd, observedValue, expectedCapitalInUsd) => {
      const response = adaptCopyRunResponse({
        data: {
          capitalInProjectionStatus,
          capitalInUsd,
          observedCapitalInUsd: observedValue ? { value: observedValue, status: 'METRIC_STATUS_CURRENT' } : undefined,
        },
      })

      expect(response.data.capitalInUsd).toBe(expectedCapitalInUsd)
      expect(response.data.observedCapitalInUsd).toBe(observedValue)
    },
  )

  it.each([
    ['METRIC_STATUS_STALE', '56.78'],
    ['METRIC_STATUS_UNAVAILABLE', undefined],
  ] as const)('maps observed capital according to its %s metric status', (status, expectedObservedCapitalInUsd) => {
    const response = adaptCopyRunResponse({
      data: {
        capitalInProjectionStatus: 'CAPITAL_IN_PROJECTION_STATUS_SYNCING',
        observedCapitalInUsd: { value: '56.78', status },
      },
    })

    expect(response.data.observedCapitalInUsd).toBe(expectedObservedCapitalInUsd)
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
        },
      ],
      pagination: { hasMore: true, limit: 10, nextCursor: 'next' },
    })
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
