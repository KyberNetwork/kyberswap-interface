import type { Dispatch, SetStateAction } from 'react'
import type { PreparedAction } from 'services/copyTrading/types/preparedActions'
import { describe, expect, it, vi } from 'vitest'

import {
  DEFAULT_PREPARED_ACTION_STATE,
  type PreparedActionExpectation,
  type PreparedActionFlowState,
} from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import { requestPreparation } from 'pages/CopyTrading/modals/PreparedActionModal/requestPreparation'

const account = '0x1111111111111111111111111111111111111111'
const copyAccount = '0x2222222222222222222222222222222222222222'

const expected: PreparedActionExpectation = {
  account,
  callKinds: ['PREPARED_CALL_KIND_ADD_CAPITAL'],
  chainId: 8453,
  copyAccount,
  preview: 'addCapital',
}

const readyAction: PreparedAction = {
  status: 'PREPARED_ACTION_STATUS_READY',
  chainId: '8453',
  expectedAccount: account,
  copyAccount,
  addCapital: { addedCapitalRaw: '1000000' },
  call: {
    kind: 'PREPARED_CALL_KIND_ADD_CAPITAL',
    to: '0x3333333333333333333333333333333333333333',
    data: '0x',
    valueRaw: '0',
  },
}

const createStateHarness = () => {
  let state = DEFAULT_PREPARED_ACTION_STATE
  const setState: Dispatch<SetStateAction<PreparedActionFlowState>> = update => {
    state = typeof update === 'function' ? update(state) : update
  }
  return { getState: () => state, setState }
}

describe('requestPreparation', () => {
  it('forwards a validated ready action without entering the review phase', async () => {
    const harness = createStateHarness()
    const onReady = vi.fn((action: PreparedAction) => harness.setState({ phase: 'awaiting_signature', action }))

    await requestPreparation(
      {
        expected,
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
