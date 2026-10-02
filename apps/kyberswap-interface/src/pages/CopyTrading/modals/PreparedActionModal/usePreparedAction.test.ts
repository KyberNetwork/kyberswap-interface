import type { Dispatch, SetStateAction } from 'react'
import type { SubmittedActionStatusData } from 'services/copyTrading/types/actionStatus'
import type { PreparedAction } from 'services/copyTrading/types/preparedActions'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  DEFAULT_PREPARED_ACTION_STATE,
  type PreparedActionExpectation,
  type PreparedActionFlowState,
} from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import { requestPreparation } from 'pages/CopyTrading/modals/PreparedActionModal/requestPreparation'
import { usePreparedAction } from 'pages/CopyTrading/modals/PreparedActionModal/usePreparedAction'

const reactHooks = vi.hoisted(() => ({ useState: vi.fn(), useRef: vi.fn() }))
vi.mock('react', async importOriginal => ({
  ...(await importOriginal<typeof import('react')>()),
  useState: reactHooks.useState,
  useRef: reactHooks.useRef,
  useCallback: (callback: unknown) => callback,
}))

const statusMocks = vi.hoisted(() => ({ getStatus: vi.fn(), refresh: vi.fn() }))
vi.mock('services/copyTrading/api/endpoints/preparedActions', () => ({
  default: { useGetSubmittedActionStatusMutation: () => [statusMocks.getStatus] },
}))
vi.mock('pages/CopyTrading/hooks/useRefreshCopyTrading', () => ({ default: () => statusMocks.refresh }))
beforeEach(() => {
  statusMocks.getStatus.mockReset()
  statusMocks.refresh.mockReset()
  walletMocks.sendTransaction.mockReset()
})

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
const readyDisplay = {
  status: 'SUBMITTED_ACTION_DISPLAY_STATUS_READY' as const,
  copyRunId: 'run-1',
  readOwnerAddress: account,
}
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
  statusContext: { expectedOwner: account },
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
  statusContext: { expectedOwner: account },
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
  const refs: { current: unknown }[] = []
  let refIndex = 0
  reactHooks.useState.mockImplementation(() => {
    refIndex = 0
    return [state, setState]
  })
  reactHooks.useRef.mockImplementation(value => {
    const index = refIndex++
    return refs[index] || (refs[index] = { current: value })
  })
  return { getState: () => state, setState }
}

describe('usePreparedAction', () => {
  it('keeps an explicit reset when an older direct preparation resolves', async () => {
    const harness = createStateHarness()
    let resolvePreparation: (action: PreparedAction) => void = () => undefined
    const flow = usePreparedAction({
      getExpected: () => expected,
      prepare: () => new Promise(resolve => (resolvePreparation = resolve)),
    })

    const request = flow.prepareAndConfirm()
    flow.reset()
    resolvePreparation(readyAction)
    await request

    expect(harness.getState()).toEqual({ phase: 'idle' })
    expect(walletMocks.sendTransaction).not.toHaveBeenCalled()
  })

  it('handles an authorization error through the flow without exposing its state setter', () => {
    const harness = createStateHarness({ phase: 'review', action: allowanceDiagnostic })
    const flow = usePreparedAction({ getExpected: () => expected, prepare: vi.fn() })

    flow.fail(new Error('Authorization rejected.'))

    expect(harness.getState()).toEqual({
      phase: 'error',
      action: allowanceDiagnostic,
      error: 'Authorization rejected.',
    })
  })

  describe.each(['prepare', 'prepareAndConfirm', 'confirm'] as const)('%s status context validation', entry => {
    it.each([
      {
        statusContext: undefined,
        error: 'The preparation is missing its status context. Please prepare again.',
      },
      { statusContext: {}, error: 'The prepared status context owner does not match your wallet.' },
      {
        statusContext: { expectedOwner: predictedCopyAccount },
        error: 'The prepared status context owner does not match your wallet.',
      },
    ])('blocks an invalid status context: $statusContext', async ({ statusContext, error }) => {
      const action = { ...readyAction, statusContext }
      const harness = createStateHarness({ phase: 'review', action })
      const flow = usePreparedAction({
        getExpected: () => expected,
        prepare: vi.fn().mockResolvedValue(action),
      })

      await flow[entry]()

      expect(harness.getState()).toEqual({ phase: 'error', action, error })
      expect(walletMocks.sendTransaction).not.toHaveBeenCalled()
      expect(statusMocks.getStatus).not.toHaveBeenCalled()
    })
  })

  it('keeps the current modal phase while the initial preparation is pending', async () => {
    const harness = createStateHarness()
    let resolvePreparation: (action: PreparedAction) => void = () => undefined
    const prepare = vi
      .fn<[], Promise<PreparedAction>>()
      .mockImplementation(() => new Promise(resolve => (resolvePreparation = resolve)))
    const flow = usePreparedAction({
      getExpected: () => expected,
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
    statusMocks.refresh.mockImplementation(() => new Promise<void>(resolve => (resolveRefresh = resolve)))
    const flow = usePreparedAction({
      getExpected: () => expected,
      prepare: vi.fn().mockResolvedValue(completedAction),
    })

    await flow.prepare()

    expect(statusMocks.refresh).toHaveBeenCalledOnce()
    expect(harness.getState()).toEqual({ phase: 'success', action: completedAction })
    resolveRefresh()
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
      getExpected: () => expected,
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
      getExpected: () => expected,
      prepare: vi.fn(),
    })
    await flow.confirm()
    expect(harness.getState()).toMatchObject({ phase: 'error', error: 'This contract generation is read-only.' })
    expect(walletMocks.sendTransaction).not.toHaveBeenCalled()
  })

  it('uses the expired recovery state for an expired preparation', async () => {
    const harness = createStateHarness()
    const flow = usePreparedAction({
      getExpected: () => expected,
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
      getExpected: () => expected,
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
      getExpected: () => expected,
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
      getExpected: () => expected,
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
      getExpected: () => expected,
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
        data: {
          status: 'SUBMITTED_ACTION_STATUS_SUCCEEDED',
          transaction: { outcome: 'ACTION_TRANSACTION_RECEIPT_OUTCOME_SUCCESS' },
          display: readyDisplay,
          result: { copyRunId: 'run-1' },
        },
      })
    const getStatus = statusMocks.getStatus.mockReturnValue({ unwrap })
    const prepare = vi.fn()
    const useRetryFlow = () =>
      usePreparedAction({
        getExpected: () => expected,
        prepare,
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
    statusMocks.getStatus.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({
        data: {
          status: 'SUBMITTED_ACTION_STATUS_FAILED',
          transaction: { outcome: 'ACTION_TRANSACTION_RECEIPT_OUTCOME_REVERTED' },
          guidance: { message: 'Matched transaction reverted.' },
        },
      }),
    })
    await usePreparedAction({
      getExpected: () => expected,
      prepare: vi.fn(),
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
      statusMocks.getStatus.mockReturnValue({
        unwrap: vi.fn().mockResolvedValue({
          data: {
            status: 'SUBMITTED_ACTION_STATUS_SUCCEEDED',
            transaction: { outcome: 'ACTION_TRANSACTION_RECEIPT_OUTCOME_SUCCESS' },
            display: readyDisplay,
            result: { copyRunId: 'run-1' },
            nextStep,
          },
        }),
      })
      await usePreparedAction({
        getExpected: () => expected,
        prepare,
      }).retry()
      expect(prepare).not.toHaveBeenCalled()
      expect(harness.getState()).toEqual({ phase: 'success', action, hash, display: readyDisplay })
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
        data: {
          status: 'SUBMITTED_ACTION_STATUS_SUCCEEDED',
          transaction: { outcome: 'ACTION_TRANSACTION_RECEIPT_OUTCOME_SUCCESS' },
          display: readyDisplay,
          result: { copyRunId: 'run-1' },
        },
      })
    const getStatus = statusMocks.getStatus.mockReturnValue({ unwrap })
    const prepare = vi.fn()
    const useFlow = () =>
      usePreparedAction({
        getExpected: () => expected,
        prepare,
      })
    await useFlow()[entry]()
    expect(walletMocks.waitForTransactionReceipt).toHaveBeenCalledWith({ hash: originalHash })
    expect(harness.getState()).toMatchObject({ phase: 'sync_error', hash: replacementHash, retryStage: 'sync' })
    await useFlow().retry()
    expect(harness.getState()).toEqual({ phase: 'success', action, hash: replacementHash, display: readyDisplay })
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
      const flow = usePreparedAction({
        getExpected: () => expected,
        prepare: vi.fn(),
      })
      await flow[entry]()
      expect(harness.getState()).toMatchObject({ phase: 'error', hash: replacementHash })
      expect(statusMocks.getStatus).not.toHaveBeenCalled()
    },
  )
})

describe('authorized preparation', () => {
  const pendingAction: PreparedAction = {
    ...completedAction,
    status: 'PREPARED_ACTION_STATUS_PENDING',
    startCopy: { ...completedAction.startCopy, stage: 'START_COPY_STAGE_CREATE_CONFIRMING' },
  }

  it.each([
    { action: readyAction, phase: 'review' },
    { action: pendingAction, phase: 'pending' },
    { action: allowanceDiagnostic, phase: 'unavailable' },
    { action: completedAction, phase: 'success' },
  ] as const)('handles $phase through the shared flow without submitting', async ({ action, phase }) => {
    const harness = createStateHarness({ phase: 'review', action: allowanceDiagnostic })
    const prepare = vi.fn()
    const authorizedPreparation = vi.fn().mockResolvedValue(action)
    const onPrepared = vi.fn()
    const flow = usePreparedAction({
      getExpected: () => expected,
      prepare,
      // The Start attempt has already applied authorization.
      reviewUnavailable: () => false,
      onPrepared,
    })

    await flow.prepare(authorizedPreparation)

    expect(harness.getState()).toMatchObject({ phase, action })
    expect(onPrepared).toHaveBeenCalledWith(action)
    expect(authorizedPreparation).toHaveBeenCalledOnce()
    expect(prepare).not.toHaveBeenCalled()
    expect(walletMocks.sendTransaction).not.toHaveBeenCalled()
  })

  it.each([
    { ...readyAction, generationId: 'other-generation' },
    { ...readyAction, status: 'PREPARED_ACTION_STATUS_PARTIALLY_COMPLETED' as const },
    expiredAction,
  ])('validates an authorized response before capturing its identity', async action => {
    const harness = createStateHarness({ phase: 'review', action: allowanceDiagnostic })
    const onPrepared = vi.fn()
    await usePreparedAction({
      getExpected: () => expected,
      prepare: vi.fn(),
      onPrepared,
    }).prepare(vi.fn().mockResolvedValue(action))

    expect(['error', 'expired']).toContain(harness.getState().phase)
    expect(onPrepared).not.toHaveBeenCalled()
    expect(walletMocks.sendTransaction).not.toHaveBeenCalled()
  })

  it('keeps action-specific identity errors inside preparation recovery', async () => {
    const harness = createStateHarness()
    await usePreparedAction({
      getExpected: () => expected,
      prepare: vi.fn().mockResolvedValue(readyAction),
      onPrepared: () => {
        throw new Error('The predicted account changed.')
      },
    }).prepare()
    expect(harness.getState()).toMatchObject({ phase: 'error', error: 'The predicted account changed.' })
    expect(walletMocks.sendTransaction).not.toHaveBeenCalled()
  })
})

describe('shared result ownership', () => {
  it('uses display data for action callbacks while the API is syncing without a result', async () => {
    const hash = `0x${'c'.repeat(64)}` as const
    const harness = createStateHarness({ phase: 'sync_error', action: readyAction, hash, retryStage: 'sync' })
    statusMocks.getStatus.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({
        data: {
          status: 'SUBMITTED_ACTION_STATUS_SYNCING',
          transaction: { outcome: 'ACTION_TRANSACTION_RECEIPT_OUTCOME_SUCCESS' },
          display: readyDisplay,
        },
      }),
    })
    const onSubmittedSuccess = vi.fn()
    const prepare = vi.fn()
    await usePreparedAction({ getExpected: () => expected, prepare, onSubmittedSuccess }).retry()
    expect(harness.getState()).toEqual({ phase: 'success', action: readyAction, hash, display: readyDisplay })
    expect(statusMocks.refresh).toHaveBeenCalledTimes(2)
    expect(onSubmittedSuccess).toHaveBeenCalledWith(readyDisplay, readyAction)
    expect(prepare).not.toHaveBeenCalled()
    expect(walletMocks.sendTransaction).not.toHaveBeenCalled()
  })

  it.each([
    {
      capitalInUsd: { value: '25.50', status: 'METRIC_STATUS_CURRENT' as const },
      finality: 'DATA_FINALITY_PROVISIONAL' as const,
    },
    {
      capitalOutUsd: { value: '12.25', status: 'METRIC_STATUS_STALE' as const },
      finality: 'DATA_FINALITY_FINAL' as const,
    },
    { userPositionId: 'position-1', finality: 'DATA_FINALITY_PROVISIONAL' as const },
  ])('preserves action-specific display data for the flow: %j', async fields => {
    const hash = `0x${'d'.repeat(64)}` as const
    const display = { ...readyDisplay, ...fields }
    const harness = createStateHarness({ phase: 'sync_error', action: readyAction, hash, retryStage: 'sync' })
    statusMocks.getStatus.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({ data: { status: 'SUBMITTED_ACTION_STATUS_SYNCING', display } }),
    })
    const onSubmittedSuccess = vi.fn()
    await usePreparedAction({ getExpected: () => expected, prepare: vi.fn(), onSubmittedSuccess }).retry()
    expect(onSubmittedSuccess).toHaveBeenCalledWith(display, readyAction)
    expect(harness.getState()).toEqual({ phase: 'success', action: readyAction, hash, display })
    expect(statusMocks.getStatus).toHaveBeenCalledOnce()
    expect(walletMocks.sendTransaction).not.toHaveBeenCalled()
  })

  it('refreshes at receipt and display readiness, then lets the action consume display data', async () => {
    const hash = `0x${'a'.repeat(64)}` as const
    const harness = createStateHarness({ phase: 'sync_error', action: readyAction, hash, retryStage: 'sync' })
    let resolveStatus: (response: { data: SubmittedActionStatusData }) => void = () => undefined
    statusMocks.getStatus.mockReturnValue({
      unwrap: () => new Promise(resolve => (resolveStatus = resolve)),
    })
    let resolveResult: () => void = () => undefined
    const onSubmittedSuccess = vi.fn(() => new Promise<void>(resolve => (resolveResult = resolve)))
    const request = usePreparedAction({
      getExpected: () => expected,
      prepare: vi.fn(),
      onSubmittedSuccess,
    }).retry()

    expect(statusMocks.refresh).toHaveBeenCalledOnce()
    expect(onSubmittedSuccess).not.toHaveBeenCalled()
    expect(harness.getState().phase).toBe('syncing')
    const result = { copyRunId: 'run-1', readOwnerAddress: account }
    resolveStatus({
      data: {
        status: 'SUBMITTED_ACTION_STATUS_SUCCEEDED',
        transaction: { outcome: 'ACTION_TRANSACTION_RECEIPT_OUTCOME_SUCCESS' },
        display: readyDisplay,
        result,
      },
    })
    await vi.waitFor(() => expect(onSubmittedSuccess).toHaveBeenCalledWith(readyDisplay, readyAction))
    expect(statusMocks.refresh).toHaveBeenCalledTimes(2)
    expect(harness.getState().phase).toBe('syncing')
    resolveResult()
    await request
    expect(harness.getState()).toEqual({ phase: 'success', action: readyAction, hash, display: readyDisplay })
  })

  it('keeps refresh failures separate from the verified transaction result', async () => {
    const hash = `0x${'b'.repeat(64)}` as const
    const harness = createStateHarness({ phase: 'sync_error', action: readyAction, hash, retryStage: 'sync' })
    statusMocks.refresh.mockRejectedValue(new Error('Refresh unavailable'))
    statusMocks.getStatus.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({
        data: {
          status: 'SUBMITTED_ACTION_STATUS_SUCCEEDED',
          transaction: { outcome: 'ACTION_TRANSACTION_RECEIPT_OUTCOME_SUCCESS' },
          display: readyDisplay,
          result: {},
        },
      }),
    })
    await usePreparedAction({
      getExpected: () => expected,
      prepare: vi.fn(),
    }).retry()
    expect(harness.getState()).toEqual({ phase: 'success', action: readyAction, hash, display: readyDisplay })
  })
})

// Reuse the flow fixtures for the preparation helper's direct execution handoff.
describe('requestPreparation', () => {
  it('forwards a validated ready action without entering the review phase', async () => {
    const harness = createStateHarness()
    const onReady = vi.fn((action: PreparedAction) => harness.setState({ phase: 'awaiting_signature', action }))

    await requestPreparation(
      {
        getExpected: () => expected,
        isCurrent: () => true,
        finish: vi.fn(),
        prepare: vi.fn().mockResolvedValue(readyAction),
        setState: harness.setState,
      },
      { onReady },
    )

    expect(onReady).toHaveBeenCalledWith(readyAction)
    expect(harness.getState()).toEqual({ phase: 'awaiting_signature', action: readyAction })
  })
})

describe('funding validation before wallet submission', () => {
  it('blocks confirmation when funding discovery changed after review', async () => {
    const harness = createStateHarness({ phase: 'review', action: readyAction })
    const validateBeforeSubmit = vi.fn(() => {
      throw new Error('Funding token changed')
    })
    await usePreparedAction({ getExpected: () => expected, prepare: vi.fn(), validateBeforeSubmit }).confirm()
    expect(harness.getState()).toMatchObject({ phase: 'error', error: 'Funding token changed' })
    expect(walletMocks.sendTransaction).not.toHaveBeenCalled()
  })

  it('checks funding again after simulation before sending a transaction', async () => {
    const harness = createStateHarness({ phase: 'review', action: readyAction })
    const validateBeforeSubmit = vi
      .fn()
      .mockImplementationOnce(() => undefined)
      .mockImplementationOnce(() => {
        throw new Error('Funding token changed during simulation')
      })
    walletMocks.call.mockResolvedValueOnce(undefined)
    await usePreparedAction({ getExpected: () => expected, prepare: vi.fn(), validateBeforeSubmit }).confirm()
    expect(validateBeforeSubmit).toHaveBeenCalledTimes(2)
    expect(harness.getState()).toMatchObject({ phase: 'error', error: 'Funding token changed during simulation' })
    expect(walletMocks.sendTransaction).not.toHaveBeenCalled()
  })
})

describe('preparation failure diagnostics', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  const failure: PreparedAction = {
    ...readyAction,
    status: 'PREPARED_ACTION_STATUS_PENDING',
    reason: 'PREPARED_ACTION_REASON_ACTION_SETUP_UNAVAILABLE',
    call: undefined,
    statusContext: undefined,
    startCopy: {},
    failureDetails: {
      code: 'simulation_unavailable',
      stage: 'simulation',
      message: 'Simulation is temporarily unavailable.',
      retryable: true,
    },
    guidance: { message: 'Try a fresh preparation.', retryAfterMs: 600_000 },
  }

  it.each(['PREPARED_ACTION_STATUS_PENDING', 'PREPARED_ACTION_STATUS_UNAVAILABLE'] as const)(
    'shows safe diagnostics for %s without opening the wallet or automatically retrying',
    async status => {
      vi.useFakeTimers()
      const now = Date.now()
      const harness = createStateHarness()
      const action = { ...failure, status }
      const prepare = vi.fn().mockResolvedValue(action)
      await usePreparedAction({ getExpected: () => expected, prepare }).prepareAndConfirm()
      expect(harness.getState()).toMatchObject({
        phase: status === 'PREPARED_ACTION_STATUS_PENDING' ? 'pending' : 'unavailable',
        action,
        error: failure.failureDetails?.message,
        retryAt: now + 600_000,
      })
      await vi.advanceTimersByTimeAsync(600_001)
      expect(prepare).toHaveBeenCalledOnce()
      expect(walletMocks.sendTransaction).not.toHaveBeenCalled()
    },
  )

  it.each([false, undefined])('allows a fresh manual preparation when retryable is %s', async retryable => {
    const action = {
      ...failure,
      status: 'PREPARED_ACTION_STATUS_UNAVAILABLE' as const,
      guidance: undefined,
      failureDetails: { ...failure.failureDetails, retryable },
    }
    const harness = createStateHarness({ phase: 'unavailable', action })
    const prepare = vi.fn().mockResolvedValue(readyAction)
    await usePreparedAction({ getExpected: () => expected, prepare }).retry()
    expect(prepare).toHaveBeenCalledOnce()
    expect(harness.getState()).toMatchObject({ phase: 'review', action: readyAction })
    expect(walletMocks.sendTransaction).not.toHaveBeenCalled()
  })

  it('falls back to guidance when diagnostics are absent', async () => {
    const harness = createStateHarness()
    await usePreparedAction({
      getExpected: () => expected,
      prepare: async () => ({ ...failure, failureDetails: undefined }),
    }).prepare()
    expect(harness.getState().error).toBe('Try a fresh preparation.')
  })

  it.each(['pending', 'unavailable', 'error'] as const)('honors the remaining provider delay for %s', async phase => {
    vi.useFakeTimers()
    const harness = createStateHarness({ phase, action: failure, retryAt: Date.now() + 600_000 })
    await vi.advanceTimersByTimeAsync(60_000)
    const prepare = vi.fn().mockResolvedValue(readyAction)
    const request = usePreparedAction({ getExpected: () => expected, prepare }).retry()
    // Stay on the dismissible recovery screen while waiting for the provider delay.
    expect(harness.getState()).toMatchObject({ phase, isPreparing: true })
    await vi.advanceTimersByTimeAsync(539_999)
    expect(prepare).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    await request
    expect(prepare).toHaveBeenCalledOnce()
    expect(harness.getState().phase).toBe('review')
  })

  it('cancels a delayed retry when the form is reset', async () => {
    vi.useFakeTimers()
    const harness = createStateHarness({ phase: 'pending', action: failure, retryAt: Date.now() + 10_000 })
    const prepare = vi.fn()
    const flow = usePreparedAction({ getExpected: () => expected, prepare })
    const request = flow.retry()
    flow.reset()
    await vi.advanceTimersByTimeAsync(10_000)
    await request
    expect(harness.getState()).toEqual({ phase: 'idle' })
    expect(prepare).not.toHaveBeenCalled()
  })

  it.each([400, 503])('reads typed HTTP %s guidance and does not automatically retry', async status => {
    vi.useFakeTimers()
    const harness = createStateHarness()
    const guidance = {
      '@type': 'type.googleapis.com/kyber.copytrade.aggregate.v1.ActionGuidance',
      message: 'Check the preparation settings.',
      ...(status === 503 ? { retryAfterMs: 600_000 } : {}),
    }
    const prepare = vi.fn().mockRejectedValue({
      status,
      data: {
        message: 'generic error',
        details: [{ '@type': 'another.type', message: 'Ignore this detail' }, guidance],
      },
    })
    await usePreparedAction({ getExpected: () => expected, prepare }).prepare()
    expect(harness.getState()).toMatchObject({ phase: 'error', error: guidance.message, guidance })
    expect(harness.getState().retryAt).toBe(status === 503 ? Date.now() + 600_000 : undefined)
    await vi.advanceTimersByTimeAsync(600_001)
    expect(prepare).toHaveBeenCalledOnce()
    expect(walletMocks.sendTransaction).not.toHaveBeenCalled()
  })
})
