import type { AgentCard } from 'services/copyTrading/types/agents'
import type { PrepareStartCopyRequest } from 'services/copyTrading/types/preparedActions'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useStartCopyAttempt } from 'pages/CopyTrading/modals/StartCopyModal/useStartCopyAttempt'

const hooks = vi.hoisted(() => ({ refs: [] as { current: unknown }[], index: 0 }))
vi.mock('react', () => ({
  useRef: (value: unknown) => {
    const index = hooks.index++
    return hooks.refs[index] || (hooks.refs[index] = { current: value })
  },
  useState: () => [undefined, vi.fn()],
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
  it('keeps request ID, generation and permit through retries and funding requests', async () => {
    const flow = StartCopyAttemptHarness()
    flow.getScopedStartAttempt(account, '100', 'original')
    const attempt = flow.createAuthorizedAttempt({
      ownerAddress: account,
      targetRaw: '100',
      createPermitData: 'permit',
    })
    await flow.requestStartCopy(attempt, account, '100')
    const retry = StartCopyAttemptHarness()
    await retry.requestStartCopy(retry.getScopedStartAttempt(account, '100', 'original'), account, '100')
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
