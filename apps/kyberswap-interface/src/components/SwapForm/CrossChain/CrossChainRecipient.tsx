import type { useCrossChainRecipient } from 'components/SwapForm/CrossChain/hooks/useCrossChainRecipient'
import { useCrossChainSwap } from 'components/SwapForm/CrossChain/hooks/useCrossChainSwap'
import { RecipientInput } from 'components/SwapForm/RecipientInput'
import { Chain, NonEvmChain } from 'pages/Swap/crossChain/adapters/types'

export const CrossChainRecipient = () => <CrossChainRecipientInput {...useCrossChainSwap()} />

type Props = Pick<
  ReturnType<typeof useCrossChainRecipient>,
  | 'recipient'
  | 'recipientMode'
  | 'setRecipient'
  | 'selectWalletRecipient'
  | 'showRecipientInput'
  | 'canUseMyWallet'
  | 'toggleRecipient'
> & { toChainId?: Chain }

export const CrossChainRecipientInput = ({
  toChainId,
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
    value={recipient}
    expanded={showRecipientInput}
    onChange={setRecipient}
    onToggle={toggleRecipient}
    onUseMyWallet={canUseMyWallet ? selectWalletRecipient : undefined}
  />
)
