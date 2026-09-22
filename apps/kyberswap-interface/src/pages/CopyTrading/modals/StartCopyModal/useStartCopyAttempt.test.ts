import type { AgentCard } from 'services/copyTrading/types/agents'
import type { PrepareStartCopyRequest, PreparedAction } from 'services/copyTrading/types/preparedActions'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useStartCopyAttempt } from 'pages/CopyTrading/modals/StartCopyModal/useStartCopyAttempt'

const hooks = vi.hoisted(() => ({ refs: [] as { current: unknown }[], index: 0 }))
vi.mock('react', () => ({
  useRef: (value: unknown) => {
    const index = hooks.index++
    return hooks.refs[index] || (hooks.refs[index] = { current: value })
  },
}))
const agent = { agentId: 'agent', chainId: 8453 } as AgentCard
const account = '0x1111111111111111111111111111111111111111'
const prepare = vi.fn((_request: PrepareStartCopyRequest) => ({ unwrap: vi.fn().mockResolvedValue({}) }))
const StartCopyAttemptHarness = () => {
  hooks.index = 0
  return useStartCopyAttempt({ account, agent, prepareStartCopy: prepare, targetCapitalRaw: '100' })
}
beforeEach(() => {
  hooks.refs = []
  prepare.mockClear()
})

describe('Start generation attempt identity', () => {
  it('returns independent validation snapshots when authorization changes the attempt', () => {
    const flow = StartCopyAttemptHarness()
    flow.getScopedStartAttempt(account, '100', 'original')
    const before = flow.getExpected()
    const authorized = flow.createAuthorizedAttempt({ ownerAddress: account, targetRaw: '100' })

    expect(flow.getExpected().startCopyRequestId).toBe(authorized.requestId)
    expect(before.startCopyRequestId).not.toBe(authorized.requestId)
    expect(flow.getExpected().generationId).toBe(before.generationId)
  })

  it('keeps request ID, generation and permit through retries and funding requests', async () => {
    const flow = StartCopyAttemptHarness()
    flow.getScopedStartAttempt(account, '100', 'original')
    const attempt = flow.createAuthorizedAttempt({
      ownerAddress: account,
      targetRaw: '100',
      createPermitData: 'permit',
    })
    await flow.requestStartCopy(attempt)
    const retry = StartCopyAttemptHarness()
    await retry.requestStartCopy(retry.getScopedStartAttempt(account, '100', 'original'))
    expect(prepare.mock.calls[0]).toEqual(prepare.mock.calls[1])
    expect(prepare.mock.calls[0][0]).toMatchObject({
      generationId: 'original',
      startRequestId: attempt.requestId,
      createPermitData: 'permit',
    })
  })
  it('invalidates request ID and permit assumptions after a generation change', () => {
    const flow = StartCopyAttemptHarness()
    flow.getScopedStartAttempt(account, '100', 'original')
    const first = flow.createAuthorizedAttempt({
      ownerAddress: account,
      targetRaw: '100',
      createPermitData: 'permit',
    })
    const second = StartCopyAttemptHarness().getScopedStartAttempt(account, '100', 'replacement')
    expect(second.requestId).not.toBe(first.requestId)
    expect(second.generationId).toBe('replacement')
    expect(second.createPermitData).toBeUndefined()
    expect(second.authorizationApplied).toBe(false)
  })
})

describe('Start preparation identity', () => {
  const predictedCopyAccount = '0x2222222222222222222222222222222222222222'
  const authorizedPreparation = () => {
    const flow = StartCopyAttemptHarness()
    flow.getScopedStartAttempt(account, '100', 'original')
    const attempt = flow.createAuthorizedAttempt({ ownerAddress: account, targetRaw: '100' })
    const action: PreparedAction = {
      generationId: 'original',
      displayEnrichment: { status: 'ACTION_DISPLAY_ENRICHMENT_STATUS_NOT_APPLICABLE' },
      status: 'PREPARED_ACTION_STATUS_UNAVAILABLE',
      reason: 'PREPARED_ACTION_REASON_CONTROLLER_PAUSED',
      chainId: '8453',
      expectedAccount: account,
      startCopy: {
        stage: 'START_COPY_STAGE_CREATE_REQUIRED',
        startRequestId: attempt.requestId,
        requestedTargetRaw: '100',
        createAmountRaw: '100',
        predictedCopyAccount,
      },
    }
    return { flow, action }
  }

  it('accepts a matching unavailable response without pinning its account', () => {
    const { flow, action } = authorizedPreparation()
    expect(() => flow.acceptPreparation(action)).not.toThrow()
    expect(flow.getExpected().startCopyPredictedAccount).toBeUndefined()
  })

  it.each([
    { chainId: '1' },
    { expectedAccount: predictedCopyAccount },
    { startCopy: { startRequestId: 'another-attempt' } },
    { startCopy: { requestedTargetRaw: '200' } },
  ])('rejects mismatched unavailable responses after authorization: %j', override => {
    const { flow, action } = authorizedPreparation()
    expect(() =>
      flow.acceptPreparation({
        ...action,
        ...override,
        startCopy: { ...action.startCopy, ...override.startCopy },
      }),
    ).toThrow(/does not match/)
    expect(flow.getExpected().startCopyPredictedAccount).toBeUndefined()
  })

  it('does not pin an account from the initial allowance diagnostic', () => {
    const { flow, action } = authorizedPreparation()
    flow.resetStartAttempt()
    flow.acceptPreparation({
      ...action,
      reason: 'PREPARED_ACTION_REASON_INSUFFICIENT_QUOTE_ALLOWANCE',
      startCopy: { ...action.startCopy, startRequestId: flow.getExpected().startCopyRequestId },
    })
    expect(flow.getExpected().startCopyPredictedAccount).toBeUndefined()
  })

  it('pins the validated ready account and rejects a later account change', () => {
    const { flow, action } = authorizedPreparation()
    const ready: PreparedAction = {
      ...action,
      status: 'PREPARED_ACTION_STATUS_READY',
      reason: undefined,
      call: { kind: 'PREPARED_CALL_KIND_START_COPY_CREATE', to: predictedCopyAccount, data: '0x', valueRaw: '0' },
    }
    flow.acceptPreparation(ready)
    expect(flow.getExpected().startCopyPredictedAccount).toBe(predictedCopyAccount)
    expect(StartCopyAttemptHarness().getExpected().startCopyPredictedAccount).toBe(predictedCopyAccount)
    expect(() =>
      flow.acceptPreparation({ ...ready, startCopy: { ...ready.startCopy, predictedCopyAccount: account } }),
    ).toThrow('Smart Wallet changed')

    flow.resetAttemptState()
    const reset = StartCopyAttemptHarness()
    expect(reset.getExpected().startCopyPredictedAccount).toBeUndefined()
    expect(reset.getExpected().generationId).toBeUndefined()
    expect(reset.hasAuthorization()).toBe(false)
  })
})
