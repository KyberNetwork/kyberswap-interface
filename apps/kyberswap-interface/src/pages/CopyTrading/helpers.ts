import type { AdvisoryActionAvailability, PreparedActionReason } from 'services/copyTrading/types/actionAvailability'
import type { AgentCard, AgentProfile, AgentSnapshot, StrategyCategory } from 'services/copyTrading/types/agents'
import type { ActivityRow } from 'services/copyTrading/types/copyRuns'
import type { DecimalString, StrategyKey } from 'services/copyTrading/types/primitives'

import { formatDisplayNumber } from 'utils/numbers'

type NumericValue = DecimalString | number

const METRIC_FALLBACK = 'N/A'

const parseNumericValue = (value?: NumericValue) => {
  if (value === undefined || (typeof value === 'string' && !value.trim())) return undefined

  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : undefined
}

export const compactUsd = (value?: DecimalString) => {
  const amount = parseNumericValue(value)
  return amount === undefined
    ? METRIC_FALLBACK
    : formatDisplayNumber(amount, { allowDisplayNegative: true, significantDigits: 3, style: 'currency' })
}

export const formatUsd = (value?: DecimalString, fractionDigits?: number) => {
  const amount = parseNumericValue(value)
  if (amount === undefined) return METRIC_FALLBACK

  const absoluteAmount = Math.abs(amount)
  const resolvedFractionDigits = fractionDigits ?? (absoluteAmount > 0 && absoluteAmount < 1 ? 6 : 2)
  const formattedValue = formatDisplayNumber(amount, {
    allowDisplayNegative: true,
    fractionDigits: resolvedFractionDigits,
    significantDigits: 15,
    style: 'currency',
  })

  return formattedValue.replace(/^-/, '-\u2060')
}

export const signedUsd = (value?: DecimalString, fractionDigits?: number) => {
  const amount = parseNumericValue(value)
  if (amount === undefined) return METRIC_FALLBACK

  return `${amount > 0 ? '+' : amount < 0 ? '-' : ''}${formatUsd(String(Math.abs(amount)), fractionDigits)}`
}

export const sumUsdValues = (...values: Array<DecimalString | undefined>) => {
  const amounts = values.map(parseNumericValue)
  if (amounts.some(amount => amount === undefined)) return undefined

  return String(amounts.reduce<number>((total, amount) => total + (amount ?? 0), 0))
}

export const formatTokenAmount = (value?: DecimalString) => {
  const amount = parseNumericValue(value)
  if (amount === undefined) return METRIC_FALLBACK

  return formatDisplayNumber(amount, {
    allowDisplayNegative: true,
    fractionDigits: 6,
    significantDigits: 15,
  })
}

export const formatCount = (value?: NumericValue) => {
  const amount = parseNumericValue(value)
  return amount === undefined
    ? METRIC_FALLBACK
    : formatDisplayNumber(Math.round(amount), { fractionDigits: 0, significantDigits: 15 })
}

export const percent = (value?: DecimalString) => {
  const amount = parseNumericValue(value)
  return amount === undefined
    ? METRIC_FALLBACK
    : `${formatDisplayNumber(amount, {
        allowDisplayNegative: true,
        fractionDigits: 1,
        significantDigits: 15,
      })}%`
}

export const signedPercent = (value?: DecimalString) => {
  const amount = parseNumericValue(value)
  if (amount === undefined) return METRIC_FALLBACK

  return `${amount > 0 ? '+' : ''}${percent(value)}`
}

export const getSignedMetricClassName = (value?: NumericValue) => {
  const amount = parseNumericValue(value)

  if (amount === undefined || amount === 0) return 'text-text'
  return amount > 0 ? 'text-primary' : 'text-red'
}

export const getWinRateClassName = (value?: NumericValue, variant: 'text' | 'background' = 'text') => {
  const available = parseNumericValue(value) !== undefined
  if (variant === 'background') return available ? 'bg-primary' : 'bg-buttonGray'
  return available ? 'text-primary' : 'text-text'
}

export const formatApproximateUsd = (value?: DecimalString, fractionDigits?: number) => {
  const formattedValue = formatUsd(value, fractionDigits)
  return formattedValue === METRIC_FALLBACK ? formattedValue : `~${formattedValue}`
}

export const getAgentInitials = (name: string) =>
  name
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

const strategyLabels: Record<StrategyKey, string> = {
  active: 'Active',
  diversified: 'Diversified',
  focused: 'Focused',
  unknown: 'Unknown',
}

const strategyCategoryKeys: Record<StrategyCategory, StrategyKey> = {
  STRATEGY_CATEGORY_ACTIVE: 'active',
  STRATEGY_CATEGORY_DIVERSIFIED: 'diversified',
  STRATEGY_CATEGORY_FOCUSED: 'focused',
  STRATEGY_CATEGORY_UNSPECIFIED: 'unknown',
}

export const strategyLabel = (strategy: StrategyKey) => strategyLabels[strategy]

export const strategyCategoryKey = (category: StrategyCategory): StrategyKey => strategyCategoryKeys[category]

export const getAgentDisplayName = (agent?: AgentCard | AgentProfile | AgentSnapshot) =>
  agent?.displayName || 'Unknown Agent'

export const getActivityLabel = (activity: Pick<ActivityRow, 'activityType' | 'position'>) => {
  if (activity.position?.actionType?.toLowerCase() === 'sell_unaligned') return 'Owner Sell'

  switch (activity.activityType) {
    case 'copy_started':
      return 'Start Copy'
    case 'copy_stopped':
      return 'Stop Copy'
    case 'capital_deposited':
      return 'Deposit'
    case 'capital_topped_up':
      return 'Add Capital'
    case 'capital_withdrawn':
      return 'Withdraw Quote'
    case 'capital_returned':
      return 'Returned Capital'
    default:
      return activity.activityType
        .split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
  }
}

const reasonMessages: Partial<Record<PreparedActionReason, string>> = {
  PREPARED_ACTION_REASON_ALREADY_ACTIVE: 'You are already copying this agent.',
  PREPARED_ACTION_REASON_NOT_CURRENT_OWNER: 'The connected wallet is not the current owner.',
  PREPARED_ACTION_REASON_ACCOUNT_NOT_ACTIVE: 'This Smart Wallet is not active.',
  PREPARED_ACTION_REASON_ACCOUNT_NOT_STOPPED: 'Withdrawal is temporarily unavailable. Please try again shortly.',
  PREPARED_ACTION_REASON_ACCOUNT_PERMANENTLY_PAUSED: 'This Smart Wallet is permanently paused.',
  PREPARED_ACTION_REASON_EXIT_IN_PROGRESS: 'A position exit is already in progress.',
  PREPARED_ACTION_REASON_EXIT_NOT_TERMINAL: 'The previous exit has not reached a terminal state yet.',
  PREPARED_ACTION_REASON_SOURCE_STALE: 'The latest on-chain state is still syncing. Please try again shortly.',
  PREPARED_ACTION_REASON_SOURCE_COVERAGE_PENDING: 'The latest on-chain state is still being indexed.',
  PREPARED_ACTION_REASON_FACTORY_PAUSED: 'New Copy Trading accounts are temporarily paused.',
  PREPARED_ACTION_REASON_FEE_POLICY_CHANGED: 'The fee policy changed. Review the latest preparation.',
  PREPARED_ACTION_REASON_SIGNER_POLICY_CHANGED: 'The execution signer policy changed. Please prepare again.',
  PREPARED_ACTION_REASON_REQUEST_ID_CONFLICT: 'This Start Copy request conflicts with an earlier attempt.',
  PREPARED_ACTION_REASON_UNSUPPORTED_ACCOUNT_GENERATION: 'This Smart Wallet generation is not supported.',
  PREPARED_ACTION_REASON_NO_QUOTE_BALANCE: 'There is no quote-token balance available to withdraw.',
  PREPARED_ACTION_REASON_INSUFFICIENT_QUOTE_BALANCE:
    'The Smart Wallet does not have enough quote-token balance for this amount.',
  PREPARED_ACTION_REASON_INSUFFICIENT_QUOTE_ALLOWANCE:
    'The quote token needs a fresh authorization before Start Copy can continue.',
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

export const canAttemptPreparation = (availability?: AdvisoryActionAvailability) =>
  availability?.status === 'ADVISORY_ACTION_STATUS_AVAILABLE' ||
  availability?.status === 'ADVISORY_ACTION_STATUS_TRY_PREPARE'

export const getPreparedReasonMessage = (reason?: PreparedActionReason) => {
  if (!reason || reason === 'PREPARED_ACTION_REASON_UNSPECIFIED') return 'This action is not available right now.'
  return reasonMessages[reason] || reason.replace('PREPARED_ACTION_REASON_', '').replaceAll('_', ' ').toLowerCase()
}
