import type { AdvisoryActionAvailability } from 'services/copyTrading/types/actionAvailability'

import { canAttemptPreparation, getPreparedReasonMessage } from 'pages/CopyTrading/helpers'

type WritePrimaryActionDisabledParams = {
  accountConnected: boolean
  executionBlocked: boolean
  interactionLocked: boolean
  onExpectedChain: boolean
}

export const isWritePrimaryActionDisabled = ({
  accountConnected,
  executionBlocked,
  interactionLocked,
  onExpectedChain,
}: WritePrimaryActionDisabledParams) => interactionLocked || (accountConnected && onExpectedChain && executionBlocked)

export const getWriteAvailabilityMessage = (availability?: AdvisoryActionAvailability, priorityMessage?: string) =>
  priorityMessage || (!canAttemptPreparation(availability) ? getPreparedReasonMessage(availability?.reason) : undefined)

export const getCopyRunOwnershipMessage = (ownerAddress: string, account?: string) => {
  return account && ownerAddress.toLowerCase() !== account.toLowerCase()
    ? 'The selected Copy Run is not owned by the connected wallet.'
    : undefined
}

type WritePrimaryActionLabelParams = {
  accountConnected: boolean
  loading?: boolean
  loadingLabel?: string
  onExpectedChain: boolean
  readyLabel: string
  unavailable: boolean
  unavailableLabel: string
}

export const getWritePrimaryActionLabel = ({
  accountConnected,
  loading,
  loadingLabel,
  onExpectedChain,
  readyLabel,
  unavailable,
  unavailableLabel,
}: WritePrimaryActionLabelParams) => {
  if (!accountConnected) return 'Connect Wallet'
  if (!onExpectedChain) return 'Switch Network'
  if (loading) return loadingLabel || readyLabel
  return unavailable ? unavailableLabel : readyLabel
}
