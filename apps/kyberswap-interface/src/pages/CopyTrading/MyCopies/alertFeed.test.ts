import type { ActivityRow } from 'services/copyTrading/types/copyRuns'
import { describe, expect, it } from 'vitest'

import { formatAlertFeedTime, getAlertFeedItemViewModel } from 'pages/CopyTrading/MyCopies/alertFeed'

const baseActivity: ActivityRow = {
  activityId: 'activity-1',
  ownerAddress: '0xowner',
  agentId: 'gamma-falcon',
  agentDisplayName: 'Gamma Falcon',
  chainId: 8453,
  copyRunId: 'copy-run-1',
  activityType: 'position_opened',
  summary: '',
  occurredAt: '2026-09-03T01:00:00Z',
}

describe('getAlertFeedItemViewModel', () => {
  it('formats a successful buy from structured alert fields', () => {
    const result = getAlertFeedItemViewModel({
      ...baseActivity,
      alert: {
        alertId: 'alert-1',
        leaderContextStatus: 'present',
        leader: {
          side: 'buy',
          leaderPositionId: '0x1234567890abcdef',
          baseToken: { chainId: 8453, address: '0xeth', symbol: 'ETH', decimals: 18 },
          quoteToken: { chainId: 8453, address: '0xusdc', symbol: 'USDC', decimals: 6 },
        },
        user: {
          side: 'buy',
          status: 'succeeded',
          baseAmountRaw: '78000000000000000',
          quotePerBasePrice: { value: '3204', status: 'METRIC_STATUS_CURRENT' },
        },
      },
    })

    expect(result).toMatchObject({
      agentAction: 'bought',
      agentName: 'Gamma Falcon',
      agentTokenSymbol: 'ETH',
      indicatorTone: 'buy',
      key: 'alert-1',
      referenceId: '0x1234567890abcdef',
      userAction: 'bought',
      userAmount: '0.078',
      userPrice: '3,204',
      userQuoteTokenSymbol: 'USDC',
      userTokenSymbol: 'ETH',
      userTone: 'buy',
    })
  })

  it('formats a skipped sell and exposes its Copy Details deep-link target', () => {
    const result = getAlertFeedItemViewModel({
      ...baseActivity,
      alert: {
        alertId: 'alert-2',
        leaderContextStatus: 'present',
        leader: {
          side: 'sell',
          baseToken: { chainId: 8453, address: '0xpepe', symbol: 'PEPE', decimals: 18 },
        },
        user: {
          side: 'sell',
          status: 'skipped',
          publicErrorMessage: 'price deviation',
        },
      },
    })

    expect(result).toMatchObject({
      agentAction: 'sold',
      indicatorTone: 'warning',
      key: 'alert-2',
      manualSellCopyRunId: 'copy-run-1',
      userAction: 'skipped',
      userReason: 'price deviation',
      userTone: 'sell',
    })
  })

  it('falls back to server-approved copy when structured context is incomplete', () => {
    const result = getAlertFeedItemViewModel({
      ...baseActivity,
      alert: {
        alertId: 'alert-3',
        leaderContextStatus: 'unavailable',
        fallbackAgentSummaryEn: 'Gamma Falcon trade detected',
        fallbackUserSummaryEn: 'Your Copy: awaiting details',
      },
    })

    expect(result).toMatchObject({
      agentFallback: 'Gamma Falcon trade detected',
      key: 'alert-3',
      userFallback: 'Your Copy: awaiting details',
    })
  })

  it('does not expose the Manual Sell deep-link without a copy run id', () => {
    const result = getAlertFeedItemViewModel({
      ...baseActivity,
      copyRunId: undefined,
      alert: {
        alertId: 'alert-4',
        leaderContextStatus: 'present',
        leader: { side: 'sell' },
        user: { side: 'sell', status: 'skipped' },
      },
    })

    expect(result.manualSellCopyRunId).toBeUndefined()
  })
})

describe('formatAlertFeedTime', () => {
  const now = '2026-09-03T02:00:00Z'

  it.each([
    ['2026-09-03T01:59:45Z', 'just now'],
    ['2026-09-03T01:48:00Z', '12 min ago'],
    ['2026-09-03T00:00:00Z', '2 hrs ago'],
    ['2026-09-01T02:00:00Z', '2 days ago'],
  ])('formats %s as %s', (value, expected) => {
    expect(formatAlertFeedTime(value, now)).toBe(expected)
  })

  it('returns a placeholder for an invalid timestamp', () => {
    expect(formatAlertFeedTime('not-a-date', now)).toBe('-')
  })
})
