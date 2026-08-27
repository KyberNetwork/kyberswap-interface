import type { AgentCard, AgentProfile } from 'services/copyTrading/types/agents'
import type { CopyRunSummary } from 'services/copyTrading/types/copyRuns'
import type { Address } from 'services/copyTrading/types/primitives'
import type { CopyRunsResponse } from 'services/copyTrading/types/responses'

import { wait } from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'

export type StartCopyTarget = AgentCard | AgentProfile

const START_COPY_POLL_INTERVAL_MS = 2_000
const START_COPY_POLL_TIMEOUT_MS = 20_000
const START_COPY_POLL_ATTEMPTS = START_COPY_POLL_TIMEOUT_MS / START_COPY_POLL_INTERVAL_MS + 1

type PollStartCopyRunParams = {
  agentId: string
  chainId: number
  fetchCopyRuns: () => Promise<CopyRunsResponse>
  maxAttempts?: number
  ownerAddress: Address
  pollIntervalMs?: number
  waitForNextAttempt?: (milliseconds: number) => Promise<void>
}

export const pollStartCopyRun = async ({
  agentId,
  chainId,
  fetchCopyRuns,
  maxAttempts = START_COPY_POLL_ATTEMPTS,
  ownerAddress,
  pollIntervalMs = START_COPY_POLL_INTERVAL_MS,
  waitForNextAttempt = wait,
}: PollStartCopyRunParams): Promise<CopyRunSummary> => {
  const attempts = Math.max(1, maxAttempts)

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetchCopyRuns()
      const copyRun = response.data.find(
        run =>
          !!run.copyRunId &&
          run.status === 'active' &&
          run.agentId === agentId &&
          run.chainId === chainId &&
          run.ownerAddress.toLowerCase() === ownerAddress.toLowerCase(),
      )
      if (copyRun) return copyRun
    } catch {}

    if (attempt < attempts - 1) await waitForNextAttempt(pollIntervalMs)
  }

  throw new Error('Your transaction is confirmed, but the new Copy is not available yet. Refresh status to try again.')
}
