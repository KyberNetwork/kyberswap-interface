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
  generationId: 'generation-v1',
  expectedAccount: owner,
  reprepareAfter: '2020-01-01T00:00:00Z',
  displayEnrichment: { status: 'ACTION_DISPLAY_ENRICHMENT_STATUS_UNAVAILABLE' },
  statusContext: { expectedOwner: owner, sell: { sellRatioRaw: '1234567890123456789' } },
}
const succeeded: SubmittedActionStatusData = {
  status: 'SUBMITTED_ACTION_STATUS_SUCCEEDED',
  transaction: { outcome: 'ACTION_TRANSACTION_RECEIPT_OUTCOME_SUCCESS' },
  result: { copyRunId: 'run-1' },
  display: { status: 'SUBMITTED_ACTION_DISPLAY_STATUS_READY', copyRunId: 'run-1', readOwnerAddress: owner },
}
const receipt = { blockNumber: '100', blockHash: '0xabc' }
const pending = (status: SubmittedActionStatusData['status'], retryAfterMs = 2000): SubmittedActionStatusData => ({
  status,
  display: { status: 'SUBMITTED_ACTION_DISPLAY_STATUS_PENDING' },
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
  ])('accepts a successful Stop outcome without a published result or intent', async data => {
    await expect(
      pollSubmittedActionStatus({
        action: { ...action, stopCopy: {} },
        hash,
        getStatus: statusReader(data),
      }),
    ).resolves.toEqual(data)
  })

  it.each(['SUBMITTED_ACTION_STATUS_SYNCING', 'SUBMITTED_ACTION_STATUS_SUCCEEDED', undefined] as const)(
    'finishes on display READY with status %s and no result',
    async status => {
      const data = { status, display: succeeded.display }
      const getStatus = statusReader(data)
      const waitForNextAttempt = vi.fn()
      await expect(pollSubmittedActionStatus({ action, hash, getStatus, waitForNextAttempt })).resolves.toEqual(data)
      expect(getStatus).toHaveBeenCalledOnce()
      expect(waitForNextAttempt).not.toHaveBeenCalled()
    },
  )

  it.each([
    undefined,
    {},
    { status: 'SUBMITTED_ACTION_DISPLAY_STATUS_UNSPECIFIED' },
    { status: 'SUBMITTED_ACTION_DISPLAY_STATUS_PENDING' },
    { status: 'NEW_UNKNOWN_STATUS' },
  ])('does not infer data readiness from a successful outcome or strict status: %j', async display => {
    await expect(
      pollSubmittedActionStatus({ action, hash, getStatus: statusReader({ ...succeeded, display }) }),
    ).rejects.toThrow('could not be verified')
  })

  it.each(['SUBMITTED_ACTION_STATUS_SYNCING', 'SUBMITTED_ACTION_STATUS_SUCCEEDED'] as const)(
    'keeps polling display PENDING with a successful transaction and status %s',
    async status => {
      const getStatus = statusReader(
        { ...pending(status, 3000), transaction: succeeded.transaction, result: succeeded.result },
        { status, display: succeeded.display },
      )
      const waitForNextAttempt = vi.fn().mockResolvedValue(undefined)
      await expect(pollSubmittedActionStatus({ action, hash, getStatus, waitForNextAttempt })).resolves.toEqual({
        status,
        display: succeeded.display,
      })
      expect(getStatus).toHaveBeenCalledTimes(2)
      expect(waitForNextAttempt).toHaveBeenCalledWith(3000)
    },
  )

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
        getStatus: statusReader({
          status: 'SUBMITTED_ACTION_STATUS_CONFIRMING',
          transaction: { outcome: 'ACTION_TRANSACTION_RECEIPT_OUTCOME_REVERTED' },
        }),
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
