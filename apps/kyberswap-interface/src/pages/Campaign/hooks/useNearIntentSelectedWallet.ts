import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { useWallet } from '@solana/wallet-adapter-react'
import { useEffect, useMemo, useState } from 'react'

import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import { useActiveWeb3React } from 'hooks'
import useDisconnectWallet from 'hooks/web3/useDisconnectWallet'
import { NonEvmChainInfo } from 'pages/CrossChainSwap/adapters'
import useAcceptTermAndPolicy from 'pages/CrossChainSwap/hooks/useAcceptTermAndPolicy'
import { useWalletModalToggle } from 'state/application/hooks'

export const useNearIntentSelectedWallet = () => {
  const { account: evmWallet } = useActiveWeb3React()
  const { walletInfo, availableWallets } = useBitcoinWallet()
  const { address: btcAddress } = walletInfo || {}
  const { publicKey: solanaAddress, disconnect: solanaDisconnect } = useWallet()
  const solanaWallet = solanaAddress?.toBase58() || null
  const { signedAccountId: nearAddress, signOut: nearSignOut } = useWalletSelector()

  const { termAndPolicyModal, onOpenWallet } = useAcceptTermAndPolicy()

  const toggleWalletModal = useWalletModalToggle()
  const [showBtcModal, setShowBtcConnect] = useState(false)
  const disconnectWallet = useDisconnectWallet()

  const [selectedWallet, setSelectedWallet] = useState<'EVM' | 'Bitcoin' | 'Solana' | 'Near' | null>(null)

  const connect = {
    EVM: () => toggleWalletModal(),
    Bitcoin: () => setShowBtcConnect(true),
    Solana: () => onOpenWallet('solana'),
    Near: () => onOpenWallet('near'),
  }

  const disconnect = {
    EVM: () => disconnectWallet(),
    Bitcoin: () => {
      availableWallets.find(wallet => wallet.type === walletInfo.walletType)?.disconnect?.()
    },
    Solana: () => solanaDisconnect(),
    Near: () => nearSignOut(),
  }
  const logo = {
    EVM: 'https://storage.googleapis.com/ks-setting-1d682dca/9412b9e7-161f-472e-94b2-a62d2c386ab7.png',
    Solana: NonEvmChainInfo['solana'].icon,
    Bitcoin: NonEvmChainInfo['bitcoin'].icon,
    Near: NonEvmChainInfo['near'].icon,
  }

  const address = useMemo(() => {
    return {
      EVM: evmWallet,
      Solana: solanaWallet,
      Bitcoin: btcAddress,
      Near: nearAddress,
    }
  }, [evmWallet, solanaWallet, btcAddress, nearAddress])

  useEffect(() => {
    if (selectedWallet && !address[selectedWallet]) setSelectedWallet(null)
  }, [address, selectedWallet])

  const [showSelect, setShowSelect] = useState(false)

  useEffect(() => {
    if (selectedWallet) return
    if (evmWallet) {
      setSelectedWallet('EVM')
    } else if (btcAddress) {
      setSelectedWallet('Bitcoin')
    } else if (solanaWallet) {
      setSelectedWallet('Solana')
    } else if (nearAddress) {
      setSelectedWallet('Near')
    }
  }, [evmWallet, btcAddress, solanaWallet, nearAddress, selectedWallet])

  const [connectingWallet, setConnectingWallet] = useState<'EVM' | 'Bitcoin' | 'Solana' | 'Near' | null>(null)
  useEffect(() => {
    if (!connectingWallet) return
    if (connectingWallet === 'EVM' && evmWallet) {
      setSelectedWallet('EVM')
      setConnectingWallet(null)
    }
    if (connectingWallet === 'Bitcoin' && btcAddress) {
      setSelectedWallet('Bitcoin')
      setConnectingWallet(null)
    }
    if (connectingWallet === 'Solana' && solanaWallet) {
      setSelectedWallet('Solana')
      setConnectingWallet(null)
    }
    if (connectingWallet === 'Near' && nearAddress) {
      setSelectedWallet('Near')
      setConnectingWallet(null)
    }
  }, [connectingWallet, evmWallet, btcAddress, solanaWallet, nearAddress])

  return {
    selectedWallet,
    connect,
    disconnect,
    logo,
    address,
    connectingWallet,
    setConnectingWallet,
    showSelect,
    setShowSelect,
    showBtcModal,
    setShowBtcConnect,
    setSelectedWallet,
    evmWallet,
    btcAddress,
    solanaWallet,
    nearAddress,
    termAndPolicyModal,
  }
}
