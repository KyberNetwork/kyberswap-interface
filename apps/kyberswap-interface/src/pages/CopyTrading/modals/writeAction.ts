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
