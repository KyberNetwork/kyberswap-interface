import { Fraction } from '@kyberswap/ks-sdk-core'
import type { Dispatch, SetStateAction } from 'react'
import type {
  PositionSellContext,
  PreparedAction,
  PreparedCallKind,
  PreparedToken,
  RawAmountMetric,
} from 'services/copyTrading/types/preparedActions'

import { formatDisplayNumber } from 'utils/numbers'
import { type Hash, formatUnits, isAddress, parseUnits } from 'utils/viem'

export type PreparedActionPhase =
  | 'idle'
  | 'review'
  | 'awaiting_signature'
  | 'confirming'
  | 'syncing'
  | 'pending'
  | 'unavailable'
  | 'expired'
  | 'success'
  | 'error'
  | 'sync_error'

export type PreparedActionFlowState = {
  phase: PreparedActionPhase
  isPreparing?: boolean
  action?: PreparedAction
  error?: string
  hash?: Hash
  receiptBlockNumber?: bigint
  retryStage?: 'receipt' | 'sync'
}

export const DEFAULT_PREPARED_ACTION_STATE: PreparedActionFlowState = { phase: 'idle' }

export type PreparedActionStateSetter = Dispatch<SetStateAction<PreparedActionFlowState>>

const preparationRequestVersions = new WeakMap<PreparedActionStateSetter, number>()

export const invalidatePreparationRequests = (setState: PreparedActionStateSetter) => {
  const nextVersion = (preparationRequestVersions.get(setState) || 0) + 1
  preparationRequestVersions.set(setState, nextVersion)
  return nextVersion
}

export const isCurrentPreparationRequest = (setState: PreparedActionStateSetter, version: number) =>
  preparationRequestVersions.get(setState) === version

export type PreparedActionExpectation = {
  account: string
  callKinds: readonly PreparedCallKind[]
  chainId: number
  copyAccount?: string
  positionSellContext?: PositionSellContext
  preview: 'startCopy' | 'addCapital' | 'stopCopy' | 'withdrawQuote' | 'manualSell' | 'closePosition'
  startCopyPredictedAccount?: string
  startCopyCreateAmountRaw?: string
  startCopyRequestId?: string
  startCopyTargetRaw?: string
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
  const formatted = formatPreparedAmountValue(value, token, maximumFractionDigits)
  return formatted === '—' ? formatted : `${formatted} ${token?.symbol || ''}`.trim()
}

export const formatPreparedExactAmountValue = (value: string | RawAmountMetric | undefined, token?: PreparedToken) => {
  const valueRaw = typeof value === 'string' ? value : value?.valueRaw
  if ((typeof value !== 'string' && isUnavailableMetric(value)) || !valueRaw || token?.decimals === undefined)
    return '—'

  return formatUnits(BigInt(valueRaw), token.decimals)
}

export const formatPreparedAmountValue = (
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
  return formatted
}

export const formatPreparedRate = (
  input?: RawAmountMetric,
  inputToken?: PreparedToken,
  output?: RawAmountMetric,
  outputToken?: PreparedToken,
) => {
  const inputRaw = input?.valueRaw
  const outputRaw = output?.valueRaw
  if (
    isUnavailableMetric(input) ||
    isUnavailableMetric(output) ||
    !inputRaw ||
    !outputRaw ||
    !/^\d+$/.test(inputRaw) ||
    !/^\d+$/.test(outputRaw) ||
    inputToken?.decimals === undefined ||
    outputToken?.decimals === undefined ||
    !inputToken.symbol ||
    !outputToken.symbol ||
    inputRaw === '0'
  ) {
    return '—'
  }

  const numerator = BigInt(outputRaw) * 10n ** BigInt(inputToken.decimals)
  const denominator = BigInt(inputRaw) * 10n ** BigInt(outputToken.decimals)
  const rate = new Fraction(numerator.toString(), denominator.toString())

  return `1 ${inputToken.symbol} = ${formatDisplayNumber(rate, { significantDigits: 8 })} ${outputToken.symbol}`
}

/**
 * Converts the prepared-action em dash placeholder to the metric fallback used in review rows.
 */
export const withMetricFallback = (value: string) => (value === '—' ? 'N/A' : value)

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

export const PREPARATION_EXPIRED_ERROR = 'This preparation has expired. Please try again.'
export const LIQUIDATION_QUOTE_EXPIRED_ERROR = 'The liquidation quote has expired. Please try again.'

export const isPreparationExpiredError = (error?: string) =>
  error === PREPARATION_EXPIRED_ERROR || error === LIQUIDATION_QUOTE_EXPIRED_ERROR

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

  if (expected.positionSellContext) {
    const positionSellPreview =
      expected.preview === 'manualSell'
        ? action.manualSell
        : expected.preview === 'closePosition'
        ? action.closePosition
        : undefined
    if (
      (positionSellPreview?.context && positionSellPreview.context !== expected.positionSellContext) ||
      (requireCall && positionSellPreview?.context !== expected.positionSellContext)
    ) {
      return 'The prepared position sell context does not match the selected recovery flow.'
    }
  }

  const call = action.call
  if (
    (action.status === 'PREPARED_ACTION_STATUS_COMPLETED' || action.status === 'PREPARED_ACTION_STATUS_PENDING') &&
    call
  ) {
    return 'The non-executable preparation unexpectedly returned a call.'
  }

  if (expected.preview === 'startCopy') {
    const startCopy = action.startCopy
    if (expected.startCopyRequestId && startCopy?.startRequestId !== expected.startCopyRequestId) {
      return 'The prepared Start Copy request does not match this attempt.'
    }
    if (expected.startCopyTargetRaw && startCopy?.requestedTargetRaw !== expected.startCopyTargetRaw) {
      return 'The prepared Start Copy target does not match this attempt.'
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

    if (startCopy.stage === 'START_COPY_STAGE_CREATE_REQUIRED' && action.copyAccount) {
      return 'The Start Copy create preparation unexpectedly returned a Smart Wallet identity.'
    }
    if (
      startCopy.stage === 'START_COPY_STAGE_CREATE_REQUIRED' &&
      expected.startCopyCreateAmountRaw !== undefined &&
      startCopy.createAmountRaw !== expected.startCopyCreateAmountRaw
    ) {
      return 'The prepared Start Copy create amount does not match the selected funding mode.'
    }

    if (action.status === 'PREPARED_ACTION_STATUS_PENDING') {
      if (startCopy.stage !== 'START_COPY_STAGE_CREATE_CONFIRMING') {
        return 'The pending Start Copy action returned an unexpected stage.'
      }
      if (!action.copyAccount || !sameAddress(startCopy.predictedCopyAccount, action.copyAccount)) {
        return 'The confirming Start Copy action is missing its Smart Wallet identity.'
      }
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

  if (requireCall || action.status === 'PREPARED_ACTION_STATUS_PENDING') {
    const now = Date.now()
    if (action.reprepareAfter) {
      const reprepareAfter = Date.parse(action.reprepareAfter)
      if (!Number.isFinite(reprepareAfter)) return 'The preparation returned an invalid expiry.'
      if (action.status !== 'PREPARED_ACTION_STATUS_PENDING' && reprepareAfter <= now) {
        return PREPARATION_EXPIRED_ERROR
      }
    }
    if (action.liquidationConfigDeadline) {
      const liquidationConfigDeadline = Date.parse(action.liquidationConfigDeadline)
      if (!Number.isFinite(liquidationConfigDeadline)) {
        return 'The preparation returned an invalid liquidation deadline.'
      }
      if (liquidationConfigDeadline <= now) return LIQUIDATION_QUOTE_EXPIRED_ERROR
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
  if (call.valueRaw !== '0') return 'The preparation returned a non-zero call value.'

  return undefined
}

export const getReprepareDelay = (action: PreparedAction) => {
  const requestedAt = action.reprepareAfter ? Date.parse(action.reprepareAfter) : Number.NaN
  if (!Number.isFinite(requestedAt)) return 2_000
  return Math.max(500, requestedAt - Date.now())
}

export const validatePreparedActionContinuation = (action: PreparedAction) =>
  action.status === 'PREPARED_ACTION_STATUS_READY' || action.status === 'PREPARED_ACTION_STATUS_PARTIALLY_COMPLETED'
    ? 'The confirmed Start Copy transaction returned another executable preparation. Do not submit another transaction.'
    : undefined

export const wait = (milliseconds: number) => new Promise<void>(resolve => setTimeout(resolve, milliseconds))
