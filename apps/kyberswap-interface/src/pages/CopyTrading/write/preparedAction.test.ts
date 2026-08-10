import type { PreparedAction } from 'services/copyTrading/types'
import { describe, expect, it } from 'vitest'

import { type PreparedActionExpectation, validatePreparedAction } from './preparedAction'

const account = '0x1111111111111111111111111111111111111111'
const copyAccount = '0x2222222222222222222222222222222222222222'
const callTarget = '0x3333333333333333333333333333333333333333'
const startRequestId = '123e4567-e89b-42d3-a456-426614174000'
const targetCapitalRaw = '1000000'

const expected: PreparedActionExpectation = {
  account,
  callKinds: ['PREPARED_CALL_KIND_START_COPY_CREATE', 'PREPARED_CALL_KIND_START_COPY_FUND'],
  chainId: 8453,
  preview: 'startCopy',
  startCopyPredictedAccount: copyAccount,
  startCopyRequestId: startRequestId,
  startCopyTargetRaw: targetCapitalRaw,
}

const confirmingAction = (overrides: Partial<PreparedAction> = {}): PreparedAction => ({
  status: 'PREPARED_ACTION_STATUS_PENDING',
  chainId: '8453',
  expectedAccount: account,
  copyAccount,
  reason: 'PREPARED_ACTION_REASON_SOURCE_COVERAGE_PENDING',
  startCopy: {
    stage: 'START_COPY_STAGE_CREATE_CONFIRMING',
    startRequestId,
    predictedCopyAccount: copyAccount,
    requestedTargetRaw: targetCapitalRaw,
  },
  ...overrides,
})

const unsafeConfirmingCases: Array<{ name: string; overrides: Partial<PreparedAction> }> = [
  {
    name: 'an executable call',
    overrides: {
      call: {
        kind: 'PREPARED_CALL_KIND_START_COPY_CREATE',
        to: callTarget,
        data: '0x',
        valueRaw: '0',
      },
    },
  },
  {
    name: 'a changed target',
    overrides: {
      startCopy: {
        stage: 'START_COPY_STAGE_CREATE_CONFIRMING',
        startRequestId,
        predictedCopyAccount: copyAccount,
        requestedTargetRaw: '2000000',
      },
    },
  },
  { name: 'a missing Smart Wallet identity', overrides: { copyAccount: undefined } },
]

describe('validatePreparedAction', () => {
  it('accepts a call-free Start Copy confirming response', () => {
    expect(validatePreparedAction(confirmingAction(), expected, { requireCall: false })).toBeUndefined()
  })

  it.each(unsafeConfirmingCases)('rejects a confirming response with $name', ({ overrides }) => {
    expect(validatePreparedAction(confirmingAction(overrides), expected, { requireCall: false })).toBeTruthy()
  })

  it('rejects a non-zero prepared call value', () => {
    const action: PreparedAction = {
      status: 'PREPARED_ACTION_STATUS_READY',
      chainId: '8453',
      expectedAccount: account,
      startCopy: {
        stage: 'START_COPY_STAGE_CREATE_REQUIRED',
        startRequestId,
        predictedCopyAccount: copyAccount,
        requestedTargetRaw: targetCapitalRaw,
      },
      call: {
        kind: 'PREPARED_CALL_KIND_START_COPY_CREATE',
        to: callTarget,
        data: '0x',
        valueRaw: '1',
      },
    }

    expect(validatePreparedAction(action, expected)).toBeTruthy()
  })
})
