import type { useCrossChainRecipient } from 'components/SwapForm/CrossChain/hooks/useCrossChainRecipient'
import { useCrossChainSwap } from 'components/SwapForm/CrossChain/hooks/useCrossChainSwap'
import { RecipientInput } from 'components/SwapForm/RecipientInput'

export const CrossChainRecipient = () => {
  const swap = useCrossChainSwap()
  return <CrossChainRecipientInput {...swap} recipient={swap.recipientInputValue} hideLabel />
}

type Props = Pick<
  ReturnType<typeof useCrossChainRecipient>,
  'recipient' | 'recipientError' | 'recipientAddressType' | 'setRecipient' | 'showRecipientInput' | 'toggleRecipient'
> & { hideLabel?: boolean }

export const CrossChainRecipientInput = ({
  hideLabel,
  recipient,
  recipientAddressType,
  recipientError,
  setRecipient,
  showRecipientInput,
  toggleRecipient,
}: Props) => (
  <RecipientInput
    {...recipientAddressType}
    hideLabel={hideLabel}
    value={recipient}
    error={recipientError}
    expanded={showRecipientInput}
    onChange={setRecipient}
    onToggle={toggleRecipient}
  />
)
