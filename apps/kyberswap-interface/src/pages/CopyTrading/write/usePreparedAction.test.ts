import type { Dispatch, SetStateAction } from 'react'
import type { PreparedAction } from 'services/copyTrading/types'
import { describe, expect, it, vi } from 'vitest'

import type { PreparedActionExpectation } from './preparedAction'
import { DEFAULT_PREPARED_ACTION_STATE, type PreparedActionFlowState, usePreparedAction } from './usePreparedAction'

const account = '0x1111111111111111111111111111111111111111'
const predictedCopyAccount = '0x2222222222222222222222222222222222222222'
const startRequestId = '123e4567-e89b-42d3-a456-426614174000'
const targetCapitalRaw = '50000000'

const expected: PreparedActionExpectation = {
  account,
  callKinds: ['PREPARED_CALL_KIND_START_COPY_CREATE'],
  chainId: 8453,
  preview: 'startCopy',
  startCopyCreateAmountRaw: targetCapitalRaw,
  startCopyRequestId: startRequestId,
  startCopyTargetRaw: targetCapitalRaw,
}

const allowanceDiagnostic: PreparedAction = {
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

const createStateHarness = () => {
  let state: PreparedActionFlowState = DEFAULT_PREPARED_ACTION_STATE
  const setState: Dispatch<SetStateAction<PreparedActionFlowState>> = update => {
    state = typeof update === 'function' ? update(state) : update
  }
  return { getState: () => state, setState }
}

describe('usePreparedAction unavailable review', () => {
  it('shows a selected call-free diagnostic in review without processing it', async () => {
    const harness = createStateHarness()
    const prepare = vi.fn().mockResolvedValue(allowanceDiagnostic)
    const flow = usePreparedAction({
      state: harness.getState(),
      setState: harness.setState,
      expected,
      prepare,
      reviewUnavailable: action => action.reason === 'PREPARED_ACTION_REASON_INSUFFICIENT_QUOTE_ALLOWANCE',
    })

    await flow.prepare()

    expect(prepare).toHaveBeenCalledTimes(1)
    expect(harness.getState()).toEqual({ phase: 'review', action: allowanceDiagnostic })
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
})
