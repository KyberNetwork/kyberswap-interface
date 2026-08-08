import type {
  AdvisoryActionAvailability,
  PreparedAction,
  PreparedActionReason,
  PreparedCallKind,
  PreparedToken,
  RawAmountMetric,
} from 'services/copyTrading/types'

import { formatDisplayNumber } from 'utils/numbers'
import { formatUnits, isAddress, parseUnits } from 'utils/viem'

export type PreparedActionExpectation = {
  account: string
  callKinds: readonly PreparedCallKind[]
  chainId: number
  copyAccount?: string
  preview: 'startCopy' | 'addCapital' | 'stopCopy' | 'withdrawQuote' | 'manualSell' | 'closePosition'
  startCopyPredictedAccount?: string
  startCopyRequestId?: string
}

// The write contract currently supports Base USDC. The preparation response is
// still authoritative for the token identity, balance, minimum and previews.
// This metadata converts the first decimal input and applies the published
// minimum before the preparation request.
type InputQuoteToken = Required<Pick<PreparedToken, 'address' | 'decimals' | 'symbol'>> & {
  minimumStartCopyCapitalRaw: string
}

const inputQuoteTokens: Record<number, InputQuoteToken> = {
  8453: {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    decimals: 6,
    minimumStartCopyCapitalRaw: '1000000',
    symbol: 'USDC',
  },
}

const reasonMessages: Partial<Record<PreparedActionReason, string>> = {
  PREPARED_ACTION_REASON_ALREADY_ACTIVE: 'You are already copying this agent.',
  PREPARED_ACTION_REASON_NOT_CURRENT_OWNER: 'The connected wallet is not the current owner.',
  PREPARED_ACTION_REASON_ACCOUNT_NOT_ACTIVE: 'This Smart Wallet is not active.',
  PREPARED_ACTION_REASON_ACCOUNT_NOT_STOPPED: 'Stop copying before withdrawing from this Smart Wallet.',
  PREPARED_ACTION_REASON_ACCOUNT_PERMANENTLY_PAUSED: 'This Smart Wallet is permanently paused.',
  PREPARED_ACTION_REASON_EXIT_IN_PROGRESS: 'A position exit is already in progress.',
  PREPARED_ACTION_REASON_EXIT_NOT_TERMINAL: 'The previous exit has not reached a terminal state yet.',
  PREPARED_ACTION_REASON_SOURCE_STALE: 'The latest on-chain state is still syncing. Please try again shortly.',
  PREPARED_ACTION_REASON_SOURCE_COVERAGE_PENDING: 'The latest on-chain state is still being indexed.',
  PREPARED_ACTION_REASON_FACTORY_PAUSED: 'New Copy Trading accounts are temporarily paused.',
  PREPARED_ACTION_REASON_FEE_POLICY_CHANGED: 'The fee policy changed. Review the latest preparation.',
  PREPARED_ACTION_REASON_SIGNER_POLICY_CHANGED: 'The authorization policy changed. Please authorize again.',
  PREPARED_ACTION_REASON_REQUEST_ID_CONFLICT: 'This Start Copy request conflicts with an earlier attempt.',
  PREPARED_ACTION_REASON_UNSUPPORTED_ACCOUNT_GENERATION: 'This Smart Wallet generation is not supported.',
  PREPARED_ACTION_REASON_NO_QUOTE_BALANCE: 'There is no quote-token balance available to withdraw.',
  PREPARED_ACTION_REASON_INSUFFICIENT_QUOTE_BALANCE: 'Your wallet does not have enough quote-token balance.',
  PREPARED_ACTION_REASON_CONTROLLER_PAUSED: 'Copy Trading actions are temporarily paused.',
  PREPARED_ACTION_REASON_COPY_RUN_STOPPED: 'This Copy Run has already stopped.',
  PREPARED_ACTION_REASON_UNSUPPORTED_QUOTE_TOKEN: 'The configured quote token is not supported.',
  PREPARED_ACTION_REASON_AMOUNT_BELOW_MINIMUM: 'Enter an amount that meets the current minimum.',
  PREPARED_ACTION_REASON_INVALID_STOP_INTENT: 'The selected positions changed. Review the latest position set.',
  PREPARED_ACTION_REASON_NO_EXECUTABLE_ROUTE: 'No executable route is currently available.',
  PREPARED_ACTION_REASON_INNER_CALL_REVERTED: 'The prepared call cannot currently be executed.',
  PREPARED_ACTION_REASON_NO_SELLABLE_BASE: 'This position has no sellable balance.',
  PREPARED_ACTION_REASON_NO_PENDING_SELL_OBLIGATION: 'There is no pending sell obligation to recover.',
  PREPARED_ACTION_REASON_SELL_OBLIGATION_CHANGED: 'The pending sell obligation changed. Refresh and review again.',
  PREPARED_ACTION_REASON_POSITION_NOT_OPEN: 'This position is no longer open.',
  PREPARED_ACTION_REASON_CLOSE_NOT_ELIGIBLE: 'This position is not eligible for full recovery.',
}

export const getInputQuoteToken = (chainId: number) => inputQuoteTokens[chainId]

export const isActionAvailable = (availability?: AdvisoryActionAvailability) =>
  availability?.status === 'ADVISORY_ACTION_STATUS_AVAILABLE'

export const getPreparedReasonMessage = (reason?: PreparedActionReason) => {
  if (!reason || reason === 'PREPARED_ACTION_REASON_UNSPECIFIED') return 'This action is not available right now.'
  return reasonMessages[reason] || reason.replace('PREPARED_ACTION_REASON_', '').replaceAll('_', ' ').toLowerCase()
}

export const getApiErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message
  if (!error || typeof error !== 'object') return 'The request could not be completed.'

  const value = error as {
    data?: { error?: string; message?: string; publicErrorMessage?: string } | string
    error?: string
    message?: string
  }
  if (typeof value.data === 'string') return value.data
  return (
    value.data?.publicErrorMessage ||
    value.data?.message ||
    value.data?.error ||
    value.message ||
    value.error ||
    'The request could not be completed.'
  )
}

export const isUnauthorizedError = (error: unknown) =>
  Boolean(error && typeof error === 'object' && 'status' in error && (error as { status?: unknown }).status === 401)

export const isRetryableApiError = (error: unknown) => {
  if (!error || typeof error !== 'object' || !('status' in error)) return false
  const status = (error as { status?: unknown }).status
  return status === 429 || (typeof status === 'number' && status >= 500)
}

export const parsePreparedAmount = (amount: string, decimals: number) => {
  const normalized = amount.trim()
  if (!normalized || Number(normalized) <= 0) throw new Error('Enter an amount greater than zero.')
  return parseUnits(normalized, decimals).toString()
}

const isUnavailableMetric = (metric?: RawAmountMetric) =>
  !metric?.valueRaw ||
  metric.status === 'METRIC_STATUS_UNAVAILABLE' ||
  metric.status === 'METRIC_STATUS_NOT_APPLICABLE' ||
  metric.status === 'METRIC_STATUS_UNSPECIFIED'

export const formatPreparedAmount = (
  value: string | RawAmountMetric | undefined,
  token?: PreparedToken,
  maximumFractionDigits = 6,
) => {
  const valueRaw = typeof value === 'string' ? value : value?.valueRaw
  if ((typeof value !== 'string' && isUnavailableMetric(value)) || !valueRaw || token?.decimals === undefined)
    return '—'

  const decimal = formatUnits(BigInt(valueRaw), token.decimals)
  const formatted = formatDisplayNumber(decimal, {
    allowDisplayNegative: true,
    fractionDigits: maximumFractionDigits,
    significantDigits: 15,
  })
  return `${formatted} ${token.symbol || ''}`.trim()
}

export const formatWadPercent = (valueRaw?: string) => {
  if (!valueRaw || !/^\d+$/.test(valueRaw)) return '—'
  const percentage = Number(formatUnits(BigInt(valueRaw), 16))
  return Number.isFinite(percentage)
    ? `${formatDisplayNumber(percentage, { fractionDigits: 4, significantDigits: 15 })}%`
    : '—'
}

export const formatSlippage = (slippageBps?: number) =>
  slippageBps === undefined
    ? '—'
    : `${formatDisplayNumber(slippageBps / 100, { fractionDigits: 2, significantDigits: 15 })}%`

const sameAddress = (a?: string, b?: string) => Boolean(a && b && a.toLowerCase() === b.toLowerCase())

export const validatePreparedAction = (
  action: PreparedAction,
  expected: PreparedActionExpectation,
  { requireCall = true }: { requireCall?: boolean } = {},
) => {
  if (Number(action.chainId) !== expected.chainId) return 'The prepared chain does not match the selected chain.'
  if (!sameAddress(action.expectedAccount, expected.account)) return 'The prepared sender does not match your wallet.'

  if (expected.copyAccount && !sameAddress(action.copyAccount, expected.copyAccount)) {
    return 'The prepared Smart Wallet does not match the selected Copy Run.'
  }

  const previewKeys = (
    ['startCopy', 'addCapital', 'stopCopy', 'withdrawQuote', 'manualSell', 'closePosition'] as const
  ).filter(key => action[key] !== undefined)
  if (previewKeys.length !== 1 || previewKeys[0] !== expected.preview) {
    return 'The preparation returned an unexpected action preview.'
  }

  const call = action.call
  if (action.status === 'PREPARED_ACTION_STATUS_COMPLETED' && call) {
    return 'The completed preparation unexpectedly returned a call.'
  }

  if (expected.preview === 'startCopy') {
    const startCopy = action.startCopy
    if (expected.startCopyRequestId && startCopy?.startRequestId !== expected.startCopyRequestId) {
      return 'The prepared Start Copy request does not match this attempt.'
    }
    if (
      expected.startCopyPredictedAccount &&
      !sameAddress(startCopy?.predictedCopyAccount, expected.startCopyPredictedAccount)
    ) {
      return 'The prepared Start Copy Smart Wallet changed during this attempt.'
    }
    if (!startCopy?.predictedCopyAccount) {
      return 'The prepared Start Copy action is missing its predicted Smart Wallet.'
    }
    if (action.copyAccount && !sameAddress(startCopy.predictedCopyAccount, action.copyAccount)) {
      return 'The prepared Start Copy account identity is inconsistent.'
    }

    if (action.status === 'PREPARED_ACTION_STATUS_COMPLETED') {
      if (startCopy.stage !== 'START_COPY_STAGE_COMPLETE') {
        return 'The completed Start Copy action returned an unexpected stage.'
      }
      if (!action.copyAccount || !sameAddress(startCopy.predictedCopyAccount, action.copyAccount)) {
        return 'The completed Start Copy action is missing its Smart Wallet identity.'
      }
    }
  }

  if (!requireCall) return undefined

  if (!call?.kind || !expected.callKinds.includes(call.kind)) return 'The preparation returned an unexpected call kind.'

  if (expected.preview === 'startCopy') {
    const startCopy = action.startCopy
    if (call.kind === 'PREPARED_CALL_KIND_START_COPY_CREATE') {
      if (startCopy?.stage !== 'START_COPY_STAGE_CREATE_REQUIRED') {
        return 'The prepared Start Copy create call returned an unexpected stage.'
      }
      if (action.status === 'PREPARED_ACTION_STATUS_PARTIALLY_COMPLETED') {
        return 'The partially completed Start Copy action returned another create call.'
      }
    }
    if (call.kind === 'PREPARED_CALL_KIND_START_COPY_FUND') {
      if (startCopy?.stage !== 'START_COPY_STAGE_FUNDING_REQUIRED') {
        return 'The prepared Start Copy funding call returned an unexpected stage.'
      }
      if (!action.copyAccount || !sameAddress(action.copyAccount, startCopy.predictedCopyAccount)) {
        return 'The prepared funding account does not match the predicted Smart Wallet.'
      }
    }
  } else if (action.status === 'PREPARED_ACTION_STATUS_PARTIALLY_COMPLETED') {
    return 'Only Start Copy can return a partially completed preparation.'
  }

  if (!call.to || !isAddress(call.to)) return 'The preparation returned an invalid call target.'
  if (!call.data || !/^0x[0-9a-fA-F]*$/.test(call.data)) return 'The preparation returned invalid calldata.'
  if (call.valueRaw !== undefined && !/^\d+$/.test(call.valueRaw))
    return 'The preparation returned an invalid call value.'

  const now = Date.now()
  if (action.reprepareAfter) {
    const reprepareAfter = Date.parse(action.reprepareAfter)
    if (!Number.isFinite(reprepareAfter)) return 'The preparation returned an invalid expiry.'
    if (reprepareAfter <= now) return 'This preparation has expired. Please try again.'
  }
  if (action.liquidationConfigDeadline) {
    const liquidationConfigDeadline = Date.parse(action.liquidationConfigDeadline)
    if (!Number.isFinite(liquidationConfigDeadline)) return 'The preparation returned an invalid liquidation deadline.'
    if (liquidationConfigDeadline <= now) return 'The liquidation quote has expired. Please try again.'
  }

  return undefined
}

export const getReprepareDelay = (action: PreparedAction) => {
  const requestedAt = action.reprepareAfter ? Date.parse(action.reprepareAfter) : Number.NaN
  if (!Number.isFinite(requestedAt)) return 2_000
  return Math.max(500, requestedAt - Date.now())
}

export const wait = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds))
