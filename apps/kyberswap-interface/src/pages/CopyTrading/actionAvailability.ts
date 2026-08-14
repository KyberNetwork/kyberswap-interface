import type { AdvisoryActionAvailability, PreparedActionReason } from 'services/copyTrading/types'

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
  PREPARED_ACTION_REASON_SIGNER_POLICY_CHANGED: 'The execution signer policy changed. Please prepare again.',
  PREPARED_ACTION_REASON_REQUEST_ID_CONFLICT: 'This Start Copy request conflicts with an earlier attempt.',
  PREPARED_ACTION_REASON_UNSUPPORTED_ACCOUNT_GENERATION: 'This Smart Wallet generation is not supported.',
  PREPARED_ACTION_REASON_NO_QUOTE_BALANCE: 'There is no quote-token balance available to withdraw.',
  PREPARED_ACTION_REASON_INSUFFICIENT_QUOTE_BALANCE: 'Your wallet does not have enough quote-token balance.',
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

export const isActionAvailable = (availability?: AdvisoryActionAvailability) =>
  availability?.status === 'ADVISORY_ACTION_STATUS_AVAILABLE'

export const getPreparedReasonMessage = (reason?: PreparedActionReason) => {
  if (!reason || reason === 'PREPARED_ACTION_REASON_UNSPECIFIED') return 'This action is not available right now.'
  return reasonMessages[reason] || reason.replace('PREPARED_ACTION_REASON_', '').replaceAll('_', ' ').toLowerCase()
}
