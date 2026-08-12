import { describe, expect, it } from 'vitest'

import { adaptCopyAccountBalancesResponse, adaptCopyRunCashbackPolicyResponse, adaptCopyRunResponse } from './adapters'

const currentCapital = {
  value: '12.34',
  status: 'METRIC_STATUS_CURRENT' as const,
}

describe('adaptCopyRunResponse', () => {
  it.each([
    ['CAPITAL_IN_PROJECTION_STATUS_READY', 'ready', '12.34'],
    ['CAPITAL_IN_PROJECTION_STATUS_SYNCING', 'syncing', undefined],
    ['CAPITAL_IN_PROJECTION_STATUS_UNAVAILABLE', 'unavailable', undefined],
  ] as const)(
    'maps %s and exposes capital in only when ready',
    (capitalInProjectionStatus, expectedStatus, expectedCapitalInUsd) => {
      const response = adaptCopyRunResponse({
        data: {
          capitalInProjectionStatus,
          capitalInUsd: currentCapital,
        },
      })

      expect(response.data.capitalInProjectionStatus).toBe(expectedStatus)
      expect(response.data.capitalInUsd).toBe(expectedCapitalInUsd)
    },
  )
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
