import type { SubmittedActionStatusData, SubmittedActionStatusRequest } from 'services/copyTrading/types/actionStatus'
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
  statusContext: { expectedOwner: owner, creationTransactionHash: hash, sell: { sellRatioRaw: '1234567890123456789' } },
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
  return vi.fn((_request: SubmittedActionStatusRequest) => ({ unwrap }))
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
      resultMode: 'SUBMITTED_ACTION_RESULT_MODE_RECEIPT_FIRST',
      statusContext: action.statusContext,
      transactionHash: hash,
      previousReceipt: undefined,
    })
    expect(getStatus).toHaveBeenNthCalledWith(3, {
      ownerAddress: owner,
      resultMode: 'SUBMITTED_ACTION_RESULT_MODE_RECEIPT_FIRST',
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

  it.each(['SUBMITTED_ACTION_STATUS_CONFIRMING', 'SUBMITTED_ACTION_STATUS_SYNCING'] as const)(
    'finishes at a verified receipt while %s',
    async status => {
      const early: SubmittedActionStatusData = {
        ...pending(status, 5000),
        display: { status: 'SUBMITTED_ACTION_DISPLAY_STATUS_SYNCING' },
        receiptResult: { effects: [{ transfer: { amountRaw: '123' } }] },
      }
      const getStatus = statusReader(early, succeeded)
      const waitForNextAttempt = vi.fn()
      await expect(pollSubmittedActionStatus({ action, hash, getStatus, waitForNextAttempt })).resolves.toEqual(early)
      expect(getStatus).toHaveBeenCalledOnce()
      expect(waitForNextAttempt).not.toHaveBeenCalled()
    },
  )

  it.each([
    undefined,
    {},
    { status: 'SUBMITTED_ACTION_DISPLAY_STATUS_PENDING' },
    { status: 'SUBMITTED_ACTION_DISPLAY_STATUS_SYNCING' },
  ])('finishes at strict success independently of public display: %j', async display => {
    const data = { ...succeeded, display }
    await expect(pollSubmittedActionStatus({ action, hash, getStatus: statusReader(data) })).resolves.toEqual(data)
  })

  it('finishes when display is READY while the action is still syncing', async () => {
    const data = { ...pending('SUBMITTED_ACTION_STATUS_SYNCING'), display: succeeded.display }
    const getStatus = statusReader(data, succeeded)
    const waitForNextAttempt = vi.fn()
    await expect(pollSubmittedActionStatus({ action, hash, getStatus, waitForNextAttempt })).resolves.toEqual(data)
    expect(getStatus).toHaveBeenCalledOnce()
    expect(waitForNextAttempt).not.toHaveBeenCalled()
  })

  it.each(['SUBMITTED_ACTION_STATUS_CONFIRMING', 'SUBMITTED_ACTION_STATUS_SYNCING'] as const)(
    'finishes when display is READY while %s without receiptResult',
    async status => {
      const data = { ...pending(status), display: succeeded.display }
      const getStatus = statusReader(data)
      const waitForNextAttempt = vi.fn()
      await expect(pollSubmittedActionStatus({ action, hash, getStatus, waitForNextAttempt })).resolves.toEqual(data)
      expect(getStatus).toHaveBeenCalledOnce()
      expect(waitForNextAttempt).not.toHaveBeenCalled()
    },
  )

  it('does not complete from a raw successful receipt alone', async () => {
    const getStatus = statusReader(
      { ...pending('SUBMITTED_ACTION_STATUS_CONFIRMING', 3000), transaction: { ...succeeded.transaction, receipt } },
      { ...pending('SUBMITTED_ACTION_STATUS_SYNCING'), guidance: { retryAfterMs: 2000 } },
      succeeded,
    )
    const waitForNextAttempt = vi.fn()
    await expect(pollSubmittedActionStatus({ action, hash, getStatus, waitForNextAttempt })).resolves.toEqual(succeeded)
    expect(getStatus).toHaveBeenCalledTimes(3)
    expect(waitForNextAttempt.mock.calls).toEqual([[3000], [2000]])
  })

  it('prioritizes FAILED even when display is READY', async () => {
    await expect(
      pollSubmittedActionStatus({
        action,
        hash,
        getStatus: statusReader({ ...succeeded, status: 'SUBMITTED_ACTION_STATUS_FAILED' }),
      }),
    ).rejects.toBeInstanceOf(SubmittedActionFailedError)
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
        getStatus: statusReader({
          status: 'SUBMITTED_ACTION_STATUS_FAILED',
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

describe('receipt-first observations', () => {
  it('always requests receipt-first results with the original context', async () => {
    const getStatus = statusReader(succeeded)
    await pollSubmittedActionStatus({ action, hash, getStatus })
    const request = getStatus.mock.calls[0][0]
    expect(request.resultMode).toBe('SUBMITTED_ACTION_RESULT_MODE_RECEIPT_FIRST')
    expect(request.statusContext).toBe(action.statusContext)
    expect(request.statusContext.creationTransactionHash).toBe(hash)
  })

  it('keeps the receipt reference across reorgs until effects are verified', async () => {
    const early = {
      ...pending('SUBMITTED_ACTION_STATUS_CONFIRMING'),
      transaction: { receipt },
    }
    const reorg = { ...pending('SUBMITTED_ACTION_STATUS_PENDING'), reason: 'SUBMITTED_ACTION_REASON_REORGED' }
    const getStatus = statusReader(early, reorg, succeeded)
    await pollSubmittedActionStatus({ action, hash, getStatus, waitForNextAttempt: vi.fn() })
    expect(getStatus.mock.calls[2][0].previousReceipt).toEqual(receipt)
  })

  it('waits for strict failure when a reverted receipt is still confirming', async () => {
    const getStatus = statusReader(
      {
        ...pending('SUBMITTED_ACTION_STATUS_CONFIRMING'),
        transaction: { outcome: 'ACTION_TRANSACTION_RECEIPT_OUTCOME_REVERTED' },
      },
      { status: 'SUBMITTED_ACTION_STATUS_FAILED' },
    )
    const waitForNextAttempt = vi.fn()
    await expect(pollSubmittedActionStatus({ action, hash, getStatus, waitForNextAttempt })).rejects.toBeInstanceOf(
      SubmittedActionFailedError,
    )
    expect(waitForNextAttempt).toHaveBeenCalledOnce()
  })
})
