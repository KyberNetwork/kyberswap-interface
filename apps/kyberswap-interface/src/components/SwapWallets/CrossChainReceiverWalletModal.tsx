import { EvmReceiverWalletModal } from 'components/SwapWallets/EvmReceiverWalletModal'
import { ReceiverWalletModal } from 'components/SwapWallets/ReceiverWalletModal'
import { useReceiverWalletOptions } from 'components/SwapWallets/useReceiverWalletOptions'
import type { SwapWalletConnection } from 'components/SwapWallets/walletConnection'
import type { Chain, NonEvmChain } from 'types/crossChain'

type Props = {
  side?: 'input' | 'output'
  chain: Chain
  onSelect: (wallet: SwapWalletConnection) => void
  onDismiss: () => void
}
const NonEvmReceiverWalletModal = (props: Props & { chain: NonEvmChain }) => {
  const options = useReceiverWalletOptions(props.chain, props.side)
  return <ReceiverWalletModal {...props} {...options} />
}
export const CrossChainReceiverWalletModal = (props: Props) =>
  typeof props.chain === 'number' ? (
    <EvmReceiverWalletModal {...props} />
  ) : (
    <NonEvmReceiverWalletModal {...props} chain={props.chain} />
  )
