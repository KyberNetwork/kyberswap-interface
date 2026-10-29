import { t } from '@lingui/macro'

import { getApproveStepLabel } from 'components/ProcessingSteps/stepLabels'
import type { ProcessingStepStatus } from 'components/ProcessingSteps/useProcessingSteps'

/**
 * `action` is whichever on-chain move ends the flow: a deposit, a sale, or a queued redemption.
 * A deposit can spend several tokens, and each needs its own allowance — the sequence finds a step
 * by value, so those steps carry the token address rather than sharing the bare `approve` id.
 */
export type VaultStep = 'approve' | 'action' | `approve:${string}`

export const VAULT_APPROVE_STEP: VaultStep = 'approve'
export const VAULT_ACTION_STEP: VaultStep = 'action'

export const vaultApproveStep = (tokenAddress: string): VaultStep =>
  `${VAULT_APPROVE_STEP}:${tokenAddress.toLowerCase()}`

/**
 * A native redemption is only *requested* when its transaction confirms — the assets arrive days
 * later — so its wording is kept apart from the two that settle on the spot.
 */
export type VaultActionKind = 'deposit' | 'withdraw' | 'request'

/** `summary` is what the run moved, named once it has: the step is the only place that reports it. */
const actionLabel = (kind: VaultActionKind, status: ProcessingStepStatus, summary?: string) => {
  if (kind === 'deposit') {
    if (status === 'active') return t`Depositing`
    if (status === 'success') return summary ? t`Deposited ${summary}` : t`Deposited`
    return t`Deposit`
  }

  if (kind === 'withdraw') {
    if (status === 'active') return t`Withdrawing`
    if (status === 'success') return summary ? t`Withdrawn ${summary}` : t`Withdrawn`
    return t`Withdraw`
  }

  if (status === 'active') return t`Submitting request`
  if (status === 'success') return summary ? t`Requested ${summary}` : t`Request submitted`
  return t`Request withdrawal`
}

/** Wording for a vault run, handed to the shared processing modal. */
export const getVaultStepLabel =
  ({
    tokenSymbol,
    approveSymbols,
    kind,
    actionSummary,
  }: {
    tokenSymbol?: string
    /** Symbol per approval step, so a run spending several tokens names each one it asks for. */
    approveSymbols?: Record<string, string>
    kind: VaultActionKind
    /** The amounts the run moves, taken before it starts: the form is cleared once it finishes. */
    actionSummary?: string
  }) =>
  (step: VaultStep, status: ProcessingStepStatus) => {
    if (step === VAULT_APPROVE_STEP) return getApproveStepLabel(tokenSymbol, status)
    if (step.startsWith(`${VAULT_APPROVE_STEP}:`)) return getApproveStepLabel(approveSymbols?.[step], status)
    return actionLabel(kind, status, actionSummary)
  }

/** Title above the step list, matched to what the run actually does. */
export const getVaultProcessingTitle = (kind: VaultActionKind) => {
  if (kind === 'deposit') return t`Processing Deposit`
  if (kind === 'withdraw') return t`Processing Withdrawal`
  return t`Processing Request`
}
