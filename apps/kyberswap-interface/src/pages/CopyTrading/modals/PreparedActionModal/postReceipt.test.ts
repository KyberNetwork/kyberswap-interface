import type { SubmittedActionStatusData } from 'services/copyTrading/types/actionStatus'
import type { PreparedAction } from 'services/copyTrading/types/preparedActions'
import { describe, expect, it, vi } from 'vitest'

import {
  SubmittedActionFailedError,
  pollSubmittedActionStatus,
} from 'pages/CopyTrading/modals/PreparedActionModal/postReceipt'

const hash = `0x${'1'.repeat(64)}` as const
const owner = '0x1111111111111111111111111111111111111111'
const action: PreparedAction = {
  expectedAccount: owner,
  reprepareAfter: '2020-01-01T00:00:00Z',
  displayEnrichment: { status: 'ACTION_DISPLAY_ENRICHMENT_STATUS_UNAVAILABLE' },
  statusContext: { expectedOwner: owner, sell: { sellRatioRaw: '1234567890123456789' } },
}
const succeeded: SubmittedActionStatusData = {
  status: 'SUBMITTED_ACTION_STATUS_SUCCEEDED',
  result: { copyRunId: 'run-1' },
}
const receipt = { blockNumber: '100', blockHash: '0xabc' }
const pending = (status: SubmittedActionStatusData['status'], retryAfterMs = 2000): SubmittedActionStatusData => ({
  status,
  guidance: { retryAfterMs },
})
const statusReader = (...responses: SubmittedActionStatusData[]) => {
  const unwrap = vi.fn()
  responses.forEach(data => unwrap.mockResolvedValueOnce({ data }))
  return vi.fn(() => ({ unwrap }))
}

describe('submitted action convergence after receipt', () => {
  it('uses the original expired preparation context and carries the last receipt across a reorg', async () => {
    const getStatus = statusReader(
      { ...pending('SUBMITTED_ACTION_STATUS_CONFIRMING'), transaction: { receipt } },
      { ...pending('SUBMITTED_ACTION_STATUS_PENDING'), reason: 'SUBMITTED_ACTION_REASON_REORGED' },
      pending('SUBMITTED_ACTION_STATUS_SYNCING', 3000),
      succeeded,
    )
    const waitForNextAttempt = vi.fn().mockResolvedValue(undefined)
    await expect(pollSubmittedActionStatus({ action, hash, getStatus, waitForNextAttempt })).resolves.toEqual(succeeded)
    expect(getStatus).toHaveBeenNthCalledWith(1, {
      ownerAddress: owner,
      statusContext: action.statusContext,
      transactionHash: hash,
      previousReceipt: undefined,
    })
    expect(getStatus).toHaveBeenNthCalledWith(3, {
      ownerAddress: owner,
      statusContext: action.statusContext,
      transactionHash: hash,
      previousReceipt: receipt,
    })
    expect(waitForNextAttempt.mock.calls).toEqual([[2000], [2000], [3000]])
  })

  it('accepts Stop success without waiting for optional exit progress', async () => {
    const data = { ...succeeded, result: { stop: { stopIntentId: 'stop-1' } } }
    await expect(
      pollSubmittedActionStatus({
        action: { ...action, stopCopy: {} },
        hash,
        getStatus: statusReader(data),
      }),
    ).resolves.toEqual(data)
  })

  it.each([
    { ...succeeded, result: undefined },
    { ...succeeded, result: { stop: {} } },
  ])('rejects an incomplete successful Stop result', async data => {
    await expect(
      pollSubmittedActionStatus({
        action: { ...action, stopCopy: {} },
        hash,
        getStatus: statusReader(data),
      }),
    ).rejects.toThrow('incomplete')
  })

  it('retries transient UNKNOWN but stops at a target mismatch', async () => {
    const getStatus = statusReader(
      { ...pending('SUBMITTED_ACTION_STATUS_UNKNOWN', 5000), reason: 'SUBMITTED_ACTION_REASON_SOURCE_UNAVAILABLE' },
      {
        status: 'SUBMITTED_ACTION_STATUS_UNKNOWN',
        reason: 'SUBMITTED_ACTION_REASON_TARGET_MISMATCH',
        guidance: { message: 'Target mismatch.' },
      },
    )
    const waitForNextAttempt = vi.fn().mockResolvedValue(undefined)
    await expect(pollSubmittedActionStatus({ action, hash, getStatus, waitForNextAttempt })).rejects.toThrow(
      'Target mismatch.',
    )
    expect(waitForNextAttempt).toHaveBeenCalledOnce()
    expect(waitForNextAttempt).toHaveBeenCalledWith(5000)
    expect(getStatus).toHaveBeenCalledTimes(2)
  })

  it('keeps HTTP errors separate from a verified reverted transaction', async () => {
    const error = { status: 503, data: { message: 'service unavailable' } }
    const getStatus = vi.fn(() => ({ unwrap: vi.fn().mockRejectedValue(error) }))
    await expect(pollSubmittedActionStatus({ action, hash, getStatus })).rejects.toBe(error)
    expect(getStatus).toHaveBeenCalledOnce()
    await expect(
      pollSubmittedActionStatus({
        action,
        hash,
        getStatus: statusReader({ status: 'SUBMITTED_ACTION_STATUS_FAILED' }),
      }),
    ).rejects.toBeInstanceOf(SubmittedActionFailedError)
  })

  it('bounds polling and leaves an unresolved result recoverable', async () => {
    const getStatus = statusReader(
      pending('SUBMITTED_ACTION_STATUS_SYNCING'),
      pending('SUBMITTED_ACTION_STATUS_SYNCING'),
    )
    const waitForNextAttempt = vi.fn().mockResolvedValue(undefined)
    await expect(
      pollSubmittedActionStatus({ action, hash, getStatus, maxAttempts: 2, waitForNextAttempt }),
    ).rejects.toThrow('still updating')
    expect(getStatus).toHaveBeenCalledTimes(2)
    expect(waitForNextAttempt).toHaveBeenCalledOnce()
  })

  it.each([undefined, { expectedOwner: 'another-owner' }])(
    'never reconstructs missing or mismatched context',
    async statusContext => {
      const getStatus = statusReader(succeeded)
      await expect(
        pollSubmittedActionStatus({ action: { ...action, statusContext }, hash, getStatus }),
      ).rejects.toThrow('status context')
      expect(getStatus).not.toHaveBeenCalled()
    },
  )
})
