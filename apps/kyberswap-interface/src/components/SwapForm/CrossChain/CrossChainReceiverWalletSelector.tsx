import { useState } from 'react'

import { CrossChainReceiverWalletModal } from 'components/SwapForm/CrossChain/CrossChainReceiverWalletModal'
import { CrossChainWalletSelector } from 'components/SwapForm/CrossChain/CrossChainWalletSelector'
import { useCrossChainSwap } from 'components/SwapForm/CrossChain/hooks/useCrossChainSwap'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { NonEvmChain } from 'types/crossChain'

export const CrossChainReceiverWalletSelector = ({ chain }: { chain: NonEvmChain }) => {
  const {
    receiverWallet,
    recipient,
    pastedRecipient,
    showNonEvmRecipient,
    applyRecipient,
    selectWalletRecipient,
    connectReceiverWallet,
    disconnectReceiverWallet,
  } = useCrossChainSwap()
  const [showConnect, setShowConnect] = useState(false)
  const { trackingHandler } = useTracking()
  const connect = () => {
    trackingHandler(TRACKING_EVENT_TYPE.CC_WALLET_SELECTED, {
      wallet_type: chain === NonEvmChain.Solana ? 'Solana' : chain === NonEvmChain.Near ? 'NEAR' : 'Bitcoin',
      chain,
    })
    setShowConnect(true)
  }

  return (
    <>
      <CrossChainWalletSelector
        role="receiver"
        chain={chain}
        wallet={receiverWallet}
        recipient={recipient}
        pastedRecipient={pastedRecipient}
        isPastedRecipient={showNonEvmRecipient}
        onConnect={connect}
        onDisconnect={disconnectReceiverWallet}
        onSelectWallet={selectWalletRecipient}
        onApply={applyRecipient}
      />
      {showConnect && (
        <CrossChainReceiverWalletModal
          chain={chain}
          onSelect={connectReceiverWallet}
          onDismiss={() => setShowConnect(false)}
        />
      )}
    </>
  )
}
