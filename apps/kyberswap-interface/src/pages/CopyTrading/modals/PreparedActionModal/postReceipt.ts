import type { WithdrawTokensPreview } from 'services/copyTrading/types/preparedActions'
import type { ResponseMeta } from 'services/copyTrading/types/primitives'
import type { CopyAccountWalletInventoryResponse } from 'services/copyTrading/types/responses'

import { wait } from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import { parseUnits } from 'utils/viem'

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

export const hasWithdrawalBalanceConverged = (
  inventory: CopyAccountWalletInventoryResponse,
  receiptBlock: bigint | undefined,
  quoteTokenAddress: string | undefined,
  preparedTokens: WithdrawTokensPreview['tokens'],
) => {
  const stable = inventory.pinnedStableBalance?.balance
  if (
    receiptBlock === undefined ||
    !inventory.complete ||
    inventory.pinnedStableBalance?.status !== 'PINNED_STABLE_BALANCE_STATUS_PRESENT' ||
    !stable ||
    !quoteTokenAddress ||
    stable.tokenAddress.toLowerCase() !== quoteTokenAddress.toLowerCase()
  )
    return false
  if (!preparedTokens?.length) return false
  const balances = new Map(inventory.data.map(balance => [balance.tokenAddress.toLowerCase(), balance]))
  balances.set(stable.tokenAddress.toLowerCase(), stable)
  // Match the submitted preparation, not new tokens discovered after withdrawal.
  // An omitted balance is unknown until the API explicitly proves it at a covered block.
  return preparedTokens.every(({ token, balance: previous }) => {
    const balance = token?.address ? balances.get(token.address.toLowerCase()) : undefined
    if (
      !balance?.balanceAsOfBlock ||
      !/^\d+$/.test(balance.balanceAsOfBlock) ||
      BigInt(balance.balanceAsOfBlock) < receiptBlock ||
      (previous?.status !== 'METRIC_STATUS_CURRENT' && previous?.status !== 'METRIC_STATUS_STALE') ||
      !previous.valueRaw ||
      !/^\d+$/.test(previous.valueRaw)
    )
      return false
    // Zero balances are valid in All Tokens; there is nothing to withdraw from them.
    if (BigInt(previous.valueRaw) === 0n) return true
    const decimals =
      token?.decimals ??
      (balance.token?.address.toLowerCase() === token?.address?.toLowerCase() ? balance.token?.decimals : undefined)
    if (decimals === undefined || !/^\d+(\.\d+)?$/.test(balance.amountDecimal)) return false
    try {
      return parseUnits(balance.amountDecimal, decimals) !== BigInt(previous.valueRaw)
    } catch {
      return false
    }
  })
}
