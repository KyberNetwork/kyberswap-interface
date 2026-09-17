import type { Dispatch, SetStateAction } from 'react'
import type { SubmittedActionStatusRequest } from 'services/copyTrading/types/actionStatus'
import type { PreparedAction } from 'services/copyTrading/types/preparedActions'
import { describe, expect, it, vi } from 'vitest'

import {
  SubmittedActionFailedError,
  pollSubmittedActionStatus,
} from 'pages/CopyTrading/modals/PreparedActionModal/postReceipt'
import {
  DEFAULT_PREPARED_ACTION_STATE,
  type PreparedActionExpectation,
  type PreparedActionFlowState,
} from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import { usePreparedAction } from 'pages/CopyTrading/modals/PreparedActionModal/usePreparedAction'

const walletMocks = vi.hoisted(() => ({
  call: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
  sendTransaction: vi.fn(),
  validateGenerationPolicy: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('pages/CopyTrading/modals/PreparedActionModal/useGenerationPolicy', () => ({
  useGenerationPolicy: () => walletMocks.validateGenerationPolicy,
}))
vi.mock('components/Web3Provider', () => ({ wagmiConfig: {} }))
vi.mock('@wagmi/core', async importOriginal => ({
  ...(await importOriginal<typeof import('@wagmi/core')>()),
  getPublicClient: () => walletMocks,
}))
vi.mock('utils/walletClient', () => ({ getGatedWalletClient: async () => walletMocks }))

const account = '0x1111111111111111111111111111111111111111'
const predictedCopyAccount = '0x2222222222222222222222222222222222222222'
const callTarget = '0x3333333333333333333333333333333333333333'
const startRequestId = '123e4567-e89b-42d3-a456-426614174000'
const targetCapitalRaw = '50000000'
const generationId = 'generation-v1'
const displayEnrichment = { status: 'ACTION_DISPLAY_ENRICHMENT_STATUS_NOT_APPLICABLE' as const }

const expected: PreparedActionExpectation = {
  account,
  callKinds: ['PREPARED_CALL_KIND_START_COPY_CREATE'],
  chainId: 8453,
  generationId,
  preview: 'startCopy',
  startCopyCreateAmountRaw: targetCapitalRaw,
  startCopyRequestId: startRequestId,
  startCopyTargetRaw: targetCapitalRaw,
}

const allowanceDiagnostic: PreparedAction = {
  generationId,
  displayEnrichment,
  status: 'PREPARED_ACTION_STATUS_UNAVAILABLE',
  reason: 'PREPARED_ACTION_REASON_INSUFFICIENT_QUOTE_ALLOWANCE',
  chainId: '8453',
  expectedAccount: account,
  startCopy: {
    stage: 'START_COPY_STAGE_CREATE_REQUIRED',
    startRequestId,
    predictedCopyAccount,
    requestedTargetRaw: targetCapitalRaw,
    createAmountRaw: targetCapitalRaw,
  },
}

const completedAction: PreparedAction = {
  generationId,
  displayEnrichment,
  status: 'PREPARED_ACTION_STATUS_COMPLETED',
  chainId: '8453',
  expectedAccount: account,
  copyAccount: predictedCopyAccount,
  startCopy: {
    stage: 'START_COPY_STAGE_COMPLETE',
    startRequestId,
    predictedCopyAccount,
    requestedTargetRaw: targetCapitalRaw,
    createAmountRaw: targetCapitalRaw,
  },
}

const readyAction: PreparedAction = {
  generationId,
  displayEnrichment,
  status: 'PREPARED_ACTION_STATUS_READY',
  chainId: '8453',
  expectedAccount: account,
  startCopy: {
    stage: 'START_COPY_STAGE_CREATE_REQUIRED',
    startRequestId,
    predictedCopyAccount,
    requestedTargetRaw: targetCapitalRaw,
    createAmountRaw: targetCapitalRaw,
  },
  call: {
    kind: 'PREPARED_CALL_KIND_START_COPY_CREATE',
    to: callTarget,
    data: '0x',
    valueRaw: '0',
  },
}

const expiredAction: PreparedAction = {
  ...readyAction,
  reprepareAfter: '2020-01-01T00:00:00.000Z',
}

const createStateHarness = (initialState: PreparedActionFlowState = DEFAULT_PREPARED_ACTION_STATE) => {
  let state = initialState
  const setState: Dispatch<SetStateAction<PreparedActionFlowState>> = update => {
    state = typeof update === 'function' ? update(state) : update
  }
  return { getState: () => state, setState }
}

describe('usePreparedAction', () => {
  it('keeps the current modal phase while the initial preparation is pending', async () => {
    const harness = createStateHarness()
    let resolvePreparation: (action: PreparedAction) => void = () => undefined
    const prepare = vi
      .fn<[], Promise<PreparedAction>>()
      .mockImplementation(() => new Promise(resolve => (resolvePreparation = resolve)))
    const flow = usePreparedAction({
      state: harness.getState(),
      setState: harness.setState,
      expected,
      prepare,
      reviewUnavailable: action => action.reason === 'PREPARED_ACTION_REASON_INSUFFICIENT_QUOTE_ALLOWANCE',
    })

    const request = flow.prepare()

    expect(harness.getState()).toEqual({ phase: 'idle', isPreparing: true })

    resolvePreparation(allowanceDiagnostic)
    await request

    expect(harness.getState()).toEqual({ phase: 'review', action: allowanceDiagnostic })
  })

  it('fires the data refresh without waiting to show success', async () => {
    const harness = createStateHarness()
    let resolveRefresh: () => void = () => undefined
    const onComplete = vi.fn(() => new Promise<void>(resolve => (resolveRefresh = resolve)))
    const flow = usePreparedAction({
      state: harness.getState(),
      setState: harness.setState,
      expected,
      prepare: vi.fn().mockResolvedValue(completedAction),
      onComplete,
    })

    await flow.prepare()

    expect(onComplete).toHaveBeenCalledOnce()
    expect(harness.getState()).toEqual({ phase: 'success', action: completedAction })
    resolveRefresh()
  })

  it('refreshes screen data when post-receipt synchronization is still pending', async () => {
    const hash = `0x${'1'.repeat(64)}` as const
    const receiptBlockNumber = 123n
    const harness = createStateHarness({
      phase: 'sync_error',
      action: completedAction,
      hash,
      receiptBlockNumber,
      retryStage: 'sync',
    })
    let rejectSynchronization: (error: Error) => void = () => undefined
    const afterReceipt = vi.fn(() => new Promise<void>((_resolve, reject) => (rejectSynchronization = reject)))
    const onComplete = vi.fn()
    const flow = usePreparedAction({
      state: harness.getState(),
      setState: harness.setState,
      expected,
      prepare: vi.fn(),
      afterReceipt,
      onComplete,
    })

    const request = flow.retry()

    expect(afterReceipt).toHaveBeenCalledWith(completedAction, hash, receiptBlockNumber)
    expect(onComplete).toHaveBeenCalledOnce()
    expect(harness.getState()).toEqual({ phase: 'syncing', action: completedAction, hash, receiptBlockNumber })

    rejectSynchronization(new Error('The new Copy is not available yet.'))
    await request

    expect(harness.getState()).toEqual({
      phase: 'sync_error',
      action: completedAction,
      error: 'The new Copy is not available yet.',
      hash,
      receiptBlockNumber,
      retryStage: 'sync',
    })
  })

  it('prepares a fresh call when retrying after a reverted transaction', async () => {
    const hash = `0x${'2'.repeat(64)}` as const
    const harness = createStateHarness({
      phase: 'error',
      action: readyAction,
      error: 'The transaction reverted on-chain. Prepare a new call before trying again.',
      hash,
    })
    const prepare = vi.fn().mockResolvedValue(readyAction)
    const flow = usePreparedAction({
      state: harness.getState(),
      setState: harness.setState,
      expected,
      prepare,
    })

    await flow.retry()

    expect(prepare).toHaveBeenCalledOnce()
    expect(harness.getState()).toMatchObject({ phase: 'review', action: readyAction })
    expect(harness.getState().hash).toBeUndefined()
  })

  it('blocks wallet submission when the generation retires after review', async () => {
    walletMocks.validateGenerationPolicy.mockRejectedValueOnce(new Error('This contract generation is read-only.'))
    walletMocks.sendTransaction.mockClear()
    const harness = createStateHarness({ phase: 'review', action: readyAction })
    const flow = usePreparedAction({
      state: harness.getState(),
      setState: harness.setState,
      expected,
      prepare: vi.fn(),
    })
    await flow.confirm()
    expect(harness.getState()).toMatchObject({ phase: 'error', error: 'This contract generation is read-only.' })
    expect(walletMocks.sendTransaction).not.toHaveBeenCalled()
  })

  it('uses the expired recovery state for an expired preparation', async () => {
    const harness = createStateHarness()
    const flow = usePreparedAction({
      state: harness.getState(),
      setState: harness.setState,
      expected,
      prepare: vi.fn().mockResolvedValue(expiredAction),
    })

    await flow.prepare()

    expect(harness.getState()).toEqual({
      phase: 'expired',
      action: expiredAction,
      error: 'This preparation has expired. Please try again.',
    })
  })

  it('uses the expired recovery state when the review expires before confirmation', async () => {
    const harness = createStateHarness({ phase: 'review', action: expiredAction })
    const flow = usePreparedAction({
      state: harness.getState(),
      setState: harness.setState,
      expected,
      prepare: vi.fn(),
    })

    await flow.confirm()

    expect(harness.getState()).toEqual({
      phase: 'expired',
      action: expiredAction,
      error: 'This preparation has expired. Please try again.',
    })
  })

  it.each([
    {
      phase: 'expired' as const,
      action: expiredAction,
      error: 'This preparation has expired. Please try again.',
    },
    { phase: 'error' as const, error: 'The request could not be completed.' },
  ])('returns to an empty review with loading while retrying a $phase state', async initialState => {
    const harness = createStateHarness(initialState)
    let resolvePreparation: (action: PreparedAction) => void = () => undefined
    const prepare = vi
      .fn<[], Promise<PreparedAction>>()
      .mockImplementation(() => new Promise(resolve => (resolvePreparation = resolve)))
    const flow = usePreparedAction({
      state: harness.getState(),
      setState: harness.setState,
      expected,
      prepare,
    })

    const request = flow.retry()

    expect(harness.getState()).toEqual({ phase: 'review', isPreparing: true })

    resolvePreparation(readyAction)
    await request

    expect(harness.getState()).toEqual({ phase: 'review', action: readyAction })
  })

  it('keeps other unavailable actions in the recovery state', async () => {
    const harness = createStateHarness()
    const action: PreparedAction = {
      ...allowanceDiagnostic,
      reason: 'PREPARED_ACTION_REASON_CONTROLLER_PAUSED',
    }
    const flow = usePreparedAction({
      state: harness.getState(),
      setState: harness.setState,
      expected,
      prepare: vi.fn().mockResolvedValue(action),
      reviewUnavailable: candidate => candidate.reason === 'PREPARED_ACTION_REASON_INSUFFICIENT_QUOTE_ALLOWANCE',
    })

    await flow.prepare()

    expect(harness.getState()).toEqual({
      phase: 'unavailable',
      action,
      error: 'Copy Trading actions are temporarily paused.',
    })
  })

  it('discards a preparation response superseded by a newer request', async () => {
    const harness = createStateHarness()
    const firstAction = { ...allowanceDiagnostic, preparedAt: '2026-08-14T00:00:00Z' }
    const secondAction = { ...allowanceDiagnostic, preparedAt: '2026-08-14T00:00:01Z' }
    let resolveFirst: (action: PreparedAction) => void = () => undefined
    let resolveSecond: (action: PreparedAction) => void = () => undefined
    const prepare = vi
      .fn<[], Promise<PreparedAction>>()
      .mockImplementationOnce(() => new Promise(resolve => (resolveFirst = resolve)))
      .mockImplementationOnce(() => new Promise(resolve => (resolveSecond = resolve)))
    const flow = usePreparedAction({
      state: harness.getState(),
      setState: harness.setState,
      expected,
      prepare,
      reviewUnavailable: action => action.reason === 'PREPARED_ACTION_REASON_INSUFFICIENT_QUOTE_ALLOWANCE',
    })

    const firstRequest = flow.prepare()
    const secondRequest = flow.prepare()
    resolveSecond(secondAction)
    await secondRequest
    expect(harness.getState()).toEqual({ phase: 'review', action: secondAction })

    resolveFirst(firstAction)
    await firstRequest
    expect(harness.getState()).toEqual({ phase: 'review', action: secondAction })
  })
})

describe('submitted status recovery', () => {
  it('retries status with the original context/hash without preparation or submission', async () => {
    const hash = `0x${'3'.repeat(64)}` as const
    const action = { ...readyAction, statusContext: { expectedOwner: account } }
    const harness = createStateHarness({ phase: 'sync_error', action, hash, retryStage: 'sync' })
    const unwrap = vi
      .fn()
      .mockRejectedValueOnce({ status: 503 })
      .mockResolvedValueOnce({
        data: { status: 'SUBMITTED_ACTION_STATUS_SUCCEEDED', result: { copyRunId: 'run-1' } },
      })
    const getStatus = vi.fn(() => ({ unwrap }))
    const prepare = vi.fn()
    const useRetryFlow = () =>
      usePreparedAction({
        state: harness.getState(),
        setState: harness.setState,
        expected,
        prepare,
        afterReceipt: async (submitted, transactionHash) => {
          await pollSubmittedActionStatus({ action: submitted, hash: transactionHash, getStatus })
        },
      })
    await useRetryFlow().retry()
    expect(harness.getState()).toMatchObject({ phase: 'sync_error', action, hash })
    await useRetryFlow().retry()
    expect(harness.getState()).toMatchObject({ phase: 'success', action, hash })
    expect(prepare).not.toHaveBeenCalled()
    expect(getStatus.mock.calls[0]).toEqual(getStatus.mock.calls[1])
  })

  it('maps a verified failed status to fresh preparation recovery', async () => {
    const hash = `0x${'4'.repeat(64)}` as const
    const harness = createStateHarness({ phase: 'sync_error', action: readyAction, hash, retryStage: 'sync' })
    await usePreparedAction({
      state: harness.getState(),
      setState: harness.setState,
      expected,
      prepare: vi.fn(),
      afterReceipt: vi.fn().mockRejectedValue(new SubmittedActionFailedError('Matched transaction reverted.')),
    }).retry()
    expect(harness.getState()).toMatchObject({ phase: 'error', hash, error: 'Matched transaction reverted.' })
  })

  it.each(['SUBMITTED_ACTION_NEXT_STEP_PREPARE_START_COPY', 'SUBMITTED_ACTION_NEXT_STEP_CHECK_WITHDRAWAL_REMAINDER'])(
    'keeps the existing success flow when the status response includes %s',
    async nextStep => {
      const hash = `0x${'5'.repeat(64)}` as const
      const action = { ...readyAction, statusContext: { expectedOwner: account } }
      const harness = createStateHarness({ phase: 'sync_error', action, hash, retryStage: 'sync' })
      const prepare = vi.fn()
      const getStatus = vi.fn(() => ({
        unwrap: vi.fn().mockResolvedValue({
          data: { status: 'SUBMITTED_ACTION_STATUS_SUCCEEDED', result: { copyRunId: 'run-1' }, nextStep },
        }),
      }))
      await usePreparedAction({
        state: harness.getState(),
        setState: harness.setState,
        expected,
        prepare,
        afterReceipt: async (submitted, transactionHash) => {
          await pollSubmittedActionStatus({ action: submitted, hash: transactionHash, getStatus })
        },
      }).retry()
      expect(prepare).not.toHaveBeenCalled()
      expect(harness.getState()).toEqual({ phase: 'success', action, hash })
    },
  )
})

describe('replacement transaction receipts', () => {
  it.each(['confirm', 'retry'] as const)('polls and retains the replacement hash after %s', async entry => {
    const originalHash = `0x${'6'.repeat(64)}` as const
    const replacementHash = `0x${'7'.repeat(64)}` as const
    const action = { ...readyAction, statusContext: { expectedOwner: account } }
    const harness = createStateHarness(
      entry === 'confirm'
        ? { phase: 'review', action }
        : { phase: 'sync_error', action, hash: originalHash, retryStage: 'receipt' },
    )
    walletMocks.call.mockReset().mockResolvedValue({})
    walletMocks.sendTransaction.mockReset().mockResolvedValue(originalHash)
    walletMocks.waitForTransactionReceipt.mockReset().mockResolvedValue({
      status: 'success',
      transactionHash: replacementHash,
      blockNumber: 123n,
    })
    const unwrap = vi
      .fn()
      .mockRejectedValueOnce({ status: 503 })
      .mockResolvedValueOnce({
        data: { status: 'SUBMITTED_ACTION_STATUS_SUCCEEDED', result: { copyRunId: 'run-1' } },
      })
    const getStatus = vi.fn((_request: SubmittedActionStatusRequest) => ({ unwrap }))
    const prepare = vi.fn()
    const useFlow = () =>
      usePreparedAction({
        state: harness.getState(),
        setState: harness.setState,
        expected,
        prepare,
        afterReceipt: async (submitted, hash) => {
          await pollSubmittedActionStatus({ action: submitted, hash, getStatus })
        },
      })
    await useFlow()[entry]()
    expect(walletMocks.waitForTransactionReceipt).toHaveBeenCalledWith({ hash: originalHash })
    expect(harness.getState()).toMatchObject({ phase: 'sync_error', hash: replacementHash, retryStage: 'sync' })
    await useFlow().retry()
    expect(harness.getState()).toEqual({ phase: 'success', action, hash: replacementHash })
    expect(getStatus).toHaveBeenCalledTimes(2)
    for (const [request] of getStatus.mock.calls) {
      expect(request.transactionHash).toBe(replacementHash)
      expect(request.statusContext).toBe(action.statusContext)
    }
    expect(walletMocks.waitForTransactionReceipt).toHaveBeenCalledOnce()
    expect(walletMocks.sendTransaction).toHaveBeenCalledTimes(entry === 'confirm' ? 1 : 0)
    expect(prepare).not.toHaveBeenCalled()
  })

  it.each(['confirm', 'retry'] as const)(
    'shows the replacement hash when its receipt reverted after %s',
    async entry => {
      const originalHash = `0x${'8'.repeat(64)}` as const
      const replacementHash = `0x${'9'.repeat(64)}` as const
      const harness = createStateHarness(
        entry === 'confirm'
          ? { phase: 'review', action: readyAction }
          : { phase: 'sync_error', action: readyAction, hash: originalHash, retryStage: 'receipt' },
      )
      walletMocks.call.mockReset().mockResolvedValue({})
      walletMocks.sendTransaction.mockReset().mockResolvedValue(originalHash)
      walletMocks.waitForTransactionReceipt.mockReset().mockResolvedValue({
        status: 'reverted',
        transactionHash: replacementHash,
        blockNumber: 123n,
      })
      const afterReceipt = vi.fn()
      const flow = usePreparedAction({
        state: harness.getState(),
        setState: harness.setState,
        expected,
        prepare: vi.fn(),
        afterReceipt,
      })
      await flow[entry]()
      expect(harness.getState()).toMatchObject({ phase: 'error', hash: replacementHash })
      expect(afterReceipt).not.toHaveBeenCalled()
    },
  )
})
