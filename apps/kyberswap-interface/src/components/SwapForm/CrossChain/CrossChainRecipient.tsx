import type { useCrossChainRecipient } from 'components/SwapForm/CrossChain/hooks/useCrossChainRecipient'
import { useCrossChainSwap } from 'components/SwapForm/CrossChain/hooks/useCrossChainSwap'
import { RecipientInput } from 'components/SwapForm/RecipientInput'
import { Chain, NonEvmChain } from 'types/crossChain'

export const CrossChainRecipient = () => {
  const swap = useCrossChainSwap()
  return <CrossChainRecipientInput {...swap} recipient={swap.recipientInputValue} hideLabel />
}

type Props = Pick<
  ReturnType<typeof useCrossChainRecipient>,
  | 'recipient'
  | 'recipientMode'
  | 'setRecipient'
  | 'selectWalletRecipient'
  | 'showRecipientInput'
  | 'canUseMyWallet'
  | 'toggleRecipient'
> & { toChainId?: Chain; hideLabel?: boolean }

export const CrossChainRecipientInput = ({
  toChainId,
  hideLabel,
  recipient,
  recipientMode,
  setRecipient,
  selectWalletRecipient,
  showRecipientInput,
  canUseMyWallet,
  toggleRecipient,
}: Props) => (
  <RecipientInput
    {...(recipientMode === 'evm'
      ? { mode: 'evm' as const }
      : {
          mode: 'nonEvm' as const,
          networkName:
            toChainId === NonEvmChain.Near ? 'NEAR' : toChainId === NonEvmChain.Bitcoin ? 'Bitcoin' : 'Solana',
        })}
    hideLabel={hideLabel}
    value={recipient}
    expanded={showRecipientInput}
    onChange={setRecipient}
    onToggle={toggleRecipient}
    onUseMyWallet={canUseMyWallet ? selectWalletRecipient : undefined}
  />
)
