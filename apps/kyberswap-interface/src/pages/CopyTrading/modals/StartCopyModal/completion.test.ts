import type { CopyRunSummary, CopyRunsResponse } from 'services/copyTrading/types'
import { describe, expect, it, vi } from 'vitest'

import { pollStartCopyRun } from 'pages/CopyTrading/modals/StartCopyModal/completion'

const ownerAddress = '0x1111111111111111111111111111111111111111'
const agentId = 'agent-1'
const chainId = 8453
const pagination = { hasMore: false, limit: 1 }
const copyRun = {
  copyRunId: 'copy-run-1',
  ownerAddress,
  agentId,
  chainId,
} as CopyRunSummary

const response = (data: CopyRunSummary[]): CopyRunsResponse => ({ data, pagination })

describe('pollStartCopyRun', () => {
  it('polls the agent-filtered Copy list until the new run is available', async () => {
    const fetchCopyRuns = vi
      .fn()
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response([copyRun]))
    const waitForNextAttempt = vi.fn().mockResolvedValue(undefined)

    await expect(
      pollStartCopyRun({
        agentId,
        chainId,
        fetchCopyRuns,
        maxAttempts: 3,
        ownerAddress,
        pollIntervalMs: 25,
        waitForNextAttempt,
      }),
    ).resolves.toBe(copyRun)

    expect(fetchCopyRuns).toHaveBeenCalledTimes(2)
    expect(waitForNextAttempt).toHaveBeenCalledOnce()
    expect(waitForNextAttempt).toHaveBeenCalledWith(25)
  })

  it('fails recoverably when the new run is still missing after the bounded polling window', async () => {
    const fetchCopyRuns = vi.fn().mockResolvedValue(response([]))
    const waitForNextAttempt = vi.fn().mockResolvedValue(undefined)

    await expect(
      pollStartCopyRun({
        agentId,
        chainId,
        fetchCopyRuns,
        maxAttempts: 2,
        ownerAddress,
        waitForNextAttempt,
      }),
    ).rejects.toThrow('new Copy is not available yet')

    expect(fetchCopyRuns).toHaveBeenCalledTimes(2)
    expect(waitForNextAttempt).toHaveBeenCalledOnce()
  })

  it('polls every two seconds for a maximum twenty-second window by default', async () => {
    const fetchCopyRuns = vi.fn().mockResolvedValue(response([]))
    const waitForNextAttempt = vi.fn().mockResolvedValue(undefined)

    await expect(
      pollStartCopyRun({
        agentId,
        chainId,
        fetchCopyRuns,
        ownerAddress,
        waitForNextAttempt,
      }),
    ).rejects.toThrow('new Copy is not available yet')

    expect(fetchCopyRuns).toHaveBeenCalledTimes(11)
    expect(waitForNextAttempt).toHaveBeenCalledTimes(10)
    expect(waitForNextAttempt).toHaveBeenCalledWith(2_000)
  })

  it('retries transient list failures without accepting a different agent run', async () => {
    const anotherRun = { ...copyRun, agentId: 'agent-2' }
    const fetchCopyRuns = vi
      .fn()
      .mockRejectedValueOnce({ status: 503 })
      .mockResolvedValueOnce(response([anotherRun]))
      .mockResolvedValueOnce(response([copyRun]))
    const waitForNextAttempt = vi.fn().mockResolvedValue(undefined)

    await expect(
      pollStartCopyRun({
        agentId,
        chainId,
        fetchCopyRuns,
        maxAttempts: 3,
        ownerAddress,
        waitForNextAttempt,
      }),
    ).resolves.toBe(copyRun)

    expect(fetchCopyRuns).toHaveBeenCalledTimes(3)
    expect(waitForNextAttempt).toHaveBeenCalledTimes(2)
  })
})
