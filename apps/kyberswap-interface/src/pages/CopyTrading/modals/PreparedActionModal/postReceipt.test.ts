import type { ResponseMeta } from 'services/copyTrading/types/primitives'
import { describe, expect, it, vi } from 'vitest'

import {
  hasCapitalIncreased,
  hasCopyTradingChainCoveredBlock,
  isSameTransactionHash,
  pollCopyTradingProjection,
} from 'pages/CopyTrading/modals/PreparedActionModal/postReceipt'

describe('post-receipt Copy Trading projection helpers', () => {
  it('polls until the direct read reflects the transaction', async () => {
    const fetch = vi.fn().mockResolvedValueOnce('stale').mockResolvedValueOnce('current')
    const waitForNextAttempt = vi.fn().mockResolvedValue(undefined)

    await expect(
      pollCopyTradingProjection<string>({
        errorMessage: 'Still syncing.',
        fetch,
        isConverged: value => value === 'current',
        maxAttempts: 3,
        pollIntervalMs: 25,
        waitForNextAttempt,
      }),
    ).resolves.toBe('current')

    expect(fetch).toHaveBeenCalledTimes(2)
    expect(waitForNextAttempt).toHaveBeenCalledOnce()
    expect(waitForNextAttempt).toHaveBeenCalledWith(25)
  })

  it('keeps transient read failures inside the bounded polling window', async () => {
    const fetch = vi.fn().mockRejectedValueOnce(new Error('Network error')).mockResolvedValueOnce({ ready: true })

    await expect(
      pollCopyTradingProjection<{ ready: boolean }>({
        errorMessage: 'Still syncing.',
        fetch,
        isConverged: value => value.ready,
        maxAttempts: 2,
        waitForNextAttempt: vi.fn().mockResolvedValue(undefined),
      }),
    ).resolves.toEqual({ ready: true })
  })

  it('fails recoverably when projection does not converge in time', async () => {
    await expect(
      pollCopyTradingProjection({
        errorMessage: 'Still syncing.',
        fetch: vi.fn().mockResolvedValue('stale'),
        isConverged: () => false,
        maxAttempts: 2,
        waitForNextAttempt: vi.fn().mockResolvedValue(undefined),
      }),
    ).rejects.toThrow('Still syncing.')
  })

  it('requires the selected chain read to cover the receipt block', () => {
    const meta: ResponseMeta = {
      asOfChains: [{ chainId: '8453', asOfBlockNumber: '101' }],
    }

    expect(hasCopyTradingChainCoveredBlock(meta, 8453, 101n)).toBe(true)
    expect(hasCopyTradingChainCoveredBlock(meta, 8453, 102n)).toBe(false)
    expect(hasCopyTradingChainCoveredBlock(meta, 1, 101n)).toBe(false)
    expect(hasCopyTradingChainCoveredBlock(meta, 8453)).toBe(false)
  })

  it('requires Capital In to increase from the pre-submit Copy snapshot', () => {
    expect(hasCapitalIncreased('101.25', '100')).toBe(true)
    expect(hasCapitalIncreased('100', '100')).toBe(false)
    expect(hasCapitalIncreased('99', '100')).toBe(false)
    expect(hasCapitalIncreased(undefined, '100')).toBe(false)
  })

  it('matches transaction hashes case-insensitively', () => {
    expect(isSameTransactionHash('0xABCD', '0xabcd')).toBe(true)
    expect(isSameTransactionHash(undefined, '0xabcd')).toBe(false)
  })
})
