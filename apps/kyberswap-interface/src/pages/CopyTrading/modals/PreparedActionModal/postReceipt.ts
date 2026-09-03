import type { ResponseMeta } from 'services/copyTrading/types/primitives'

import { wait } from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'

const POST_RECEIPT_POLL_INTERVAL_MS = 2_000
const POST_RECEIPT_POLL_TIMEOUT_MS = 20_000
const POST_RECEIPT_POLL_ATTEMPTS = POST_RECEIPT_POLL_TIMEOUT_MS / POST_RECEIPT_POLL_INTERVAL_MS + 1

type PollCopyTradingProjectionParams<T> = {
  errorMessage: string
  fetch: () => Promise<T>
  isConverged: (value: T) => boolean
  maxAttempts?: number
  pollIntervalMs?: number
  waitForNextAttempt?: (milliseconds: number) => Promise<void>
}

export const pollCopyTradingProjection = async <T>({
  errorMessage,
  fetch,
  isConverged,
  maxAttempts = POST_RECEIPT_POLL_ATTEMPTS,
  pollIntervalMs = POST_RECEIPT_POLL_INTERVAL_MS,
  waitForNextAttempt = wait,
}: PollCopyTradingProjectionParams<T>): Promise<T> => {
  const attempts = Math.max(1, maxAttempts)

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const value = await fetch()
      if (isConverged(value)) return value
    } catch {}

    if (attempt < attempts - 1) await waitForNextAttempt(pollIntervalMs)
  }

  throw new Error(errorMessage)
}

export const hasCopyTradingChainCoveredBlock = (
  meta: ResponseMeta | undefined,
  chainId: number,
  receiptBlockNumber?: bigint,
) => {
  if (receiptBlockNumber === undefined) return false
  const chain = meta?.asOfChains?.find(item => Number(item.chainId) === chainId)
  if (!chain?.asOfBlockNumber || !/^\d+$/.test(chain.asOfBlockNumber)) return false

  return BigInt(chain.asOfBlockNumber) >= receiptBlockNumber
}

export const hasCapitalIncreased = (current?: string, previous?: string) => {
  if (current === undefined || previous === undefined) return false

  const currentValue = Number(current)
  const previousValue = Number(previous)
  return Number.isFinite(currentValue) && Number.isFinite(previousValue) && currentValue > previousValue
}

export const isSameTransactionHash = (left?: string, right?: string) =>
  Boolean(left && right && left.toLowerCase() === right.toLowerCase())
