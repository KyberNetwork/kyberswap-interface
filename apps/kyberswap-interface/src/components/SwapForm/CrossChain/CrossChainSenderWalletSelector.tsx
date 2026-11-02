import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { useWallet } from '@solana/wallet-adapter-react'
import { useState } from 'react'

import { CrossChainWalletSelector } from 'components/SwapForm/CrossChain/CrossChainWalletSelector'
import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { NonEvmChain } from 'pages/Swap/crossChain/adapters/types'
import { BitcoinConnectModal } from 'pages/Swap/crossChain/components/BitcoinConnectModal'
import useAcceptTermAndPolicy from 'pages/Swap/crossChain/hooks/useAcceptTermAndPolicy'
import { useSolanaConnectModal } from 'pages/Swap/crossChain/provider/SolanaConnectModalProvider'

export const CrossChainSenderWalletSelector = ({ chain }: { chain: NonEvmChain }) => {
  const { publicKey, wallet: solanaWallet, disconnect: disconnectSolana } = useWallet()
  const { signedAccountId, wallet: nearWallet, signOut } = useWalletSelector()
  const { walletInfo, availableWallets } = useBitcoinWallet()
  const { setIsOpen } = useSolanaConnectModal()
  const { termAndPolicyModal, onOpenWallet } = useAcceptTermAndPolicy()
  const { trackingHandler } = useTracking()
  const [showBitcoin, setShowBitcoin] = useState(false)
  const bitcoinWallet = availableWallets.find(wallet => wallet.type === walletInfo.walletType)
  const address =
    chain === NonEvmChain.Solana
      ? publicKey?.toString()
      : chain === NonEvmChain.Near
      ? signedAccountId
      : walletInfo.address
  const icon =
    chain === NonEvmChain.Solana
      ? solanaWallet?.adapter.icon
      : chain === NonEvmChain.Near
      ? nearWallet?.metadata.iconUrl
      : bitcoinWallet?.logo
  const name =
    chain === NonEvmChain.Solana
      ? solanaWallet?.adapter.name
      : chain === NonEvmChain.Near
      ? nearWallet?.metadata.name
      : bitcoinWallet?.name

  const connect = () => {
    trackingHandler(TRACKING_EVENT_TYPE.CC_WALLET_SELECTED, {
      wallet_type: chain === NonEvmChain.Solana ? 'Solana' : chain === NonEvmChain.Near ? 'NEAR' : 'Bitcoin',
      chain,
    })
    if (chain === NonEvmChain.Solana) setIsOpen(true)
    else if (chain === NonEvmChain.Near) onOpenWallet('near')
    else setShowBitcoin(true)
  }
  const disconnect = async () => {
    if (chain === NonEvmChain.Solana) await disconnectSolana()
    else if (chain === NonEvmChain.Near) await signOut()
    else await bitcoinWallet?.disconnect?.()
  }

  return (
    <>
      <CrossChainWalletSelector
        role="sender"
        chain={chain}
        wallet={address ? { id: name || '', name: name || '', icon: icon || '', address } : undefined}
        onConnect={connect}
        onDisconnect={disconnect}
      />
      {termAndPolicyModal}
      {showBitcoin && <BitcoinConnectModal isOpen allowWalletSwitch onDismiss={() => setShowBitcoin(false)} />}
    </>
  )
}
