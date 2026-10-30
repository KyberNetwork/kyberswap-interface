import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { useWallet } from '@solana/wallet-adapter-react'
import { useEffect, useState } from 'react'

import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import { ZERO_ADDRESS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { Chain, NonEvmChain, isEvmChain } from 'pages/Swap/crossChain/adapters/types'
import {
  BTC_DEFAULT_RECEIVER,
  CROSS_CHAIN_FEE_RECEIVER,
  CROSS_CHAIN_FEE_RECEIVER_SOLANA,
} from 'pages/Swap/crossChain/utils'

/** Keeps recipients per wallet family, independently of the selected tokens and quote session. */
export const useCrossChainRecipient = (fromChainId: Chain, toChainId?: Chain) => {
  const { account } = useActiveWeb3React()
  const { signedAccountId } = useWalletSelector()
  const { walletInfo } = useBitcoinWallet()
  const { publicKey } = useWallet()

  const btcAddress = walletInfo?.address
  const solanaAddress = publicKey?.toString()

  const [evmRecipient, setEvmRecipient] = useState('')
  const [nearRecipient, setNearRecipient] = useState('')
  const [btcRecipient, setBtcRecipient] = useState('')
  const [solanaRecipient, setSolanaRecipient] = useState('')
  const [showEvmRecipient, setShowEvmRecipient] = useState(false)

  const isEvmRecipientToggle = isEvmChain(fromChainId) && !!toChainId && isEvmChain(toChainId)
  const showRecipientInput = !isEvmRecipientToggle || showEvmRecipient

  const recipientByChain = (chain?: Chain) => {
    switch (chain) {
      case NonEvmChain.Near:
        return nearRecipient
      case NonEvmChain.Bitcoin:
        return btcRecipient
      case NonEvmChain.Solana:
        return solanaRecipient
      default:
        return chain && isEvmChain(chain) ? evmRecipient : ''
    }
  }

  const walletAddress = (chain?: Chain) => {
    switch (chain) {
      case NonEvmChain.Near:
        return signedAccountId || ''
      case NonEvmChain.Bitcoin:
        return btcAddress || ''
      case NonEvmChain.Solana:
        return solanaAddress || ''
      default:
        return account || ''
    }
  }

  const recipient = showRecipientInput ? recipientByChain(toChainId) : account || ''
  const resolveAddress = (chain: Chain | undefined, role: 'sender' | 'receiver') => {
    const address = role === 'receiver' ? recipient : walletAddress(chain)

    if (chain === NonEvmChain.Bitcoin) return address || BTC_DEFAULT_RECEIVER
    if (chain === NonEvmChain.Near) return address || signedAccountId || ZERO_ADDRESS
    if (chain === NonEvmChain.Solana) return address || solanaAddress || CROSS_CHAIN_FEE_RECEIVER_SOLANA
    return address || account || CROSS_CHAIN_FEE_RECEIVER
  }

  const setRecipient = (value: string) => {
    if (toChainId === NonEvmChain.Near) setNearRecipient(value)
    else if (toChainId === NonEvmChain.Bitcoin) setBtcRecipient(value)
    else if (toChainId === NonEvmChain.Solana) setSolanaRecipient(value)
    else if (toChainId && isEvmChain(toChainId)) setEvmRecipient(value)
  }

  const toggleRecipient = () => {
    setEvmRecipient(showEvmRecipient ? account || '' : '')
    setShowEvmRecipient(!showEvmRecipient)
  }

  // Preserve the legacy behavior: connecting/changing a wallet updates that family's recipient.
  useEffect(() => {
    if (account) setEvmRecipient(account)
  }, [account])

  useEffect(() => {
    if (signedAccountId) setNearRecipient(signedAccountId)
  }, [signedAccountId])

  useEffect(() => {
    if (btcAddress) setBtcRecipient(btcAddress)
  }, [btcAddress])

  useEffect(() => {
    if (solanaAddress) setSolanaRecipient(solanaAddress)
  }, [solanaAddress])

  useEffect(() => {
    if (isEvmRecipientToggle && !showEvmRecipient) setEvmRecipient(account || '')
  }, [account, isEvmRecipientToggle, showEvmRecipient])

  return {
    recipient,
    setRecipient,
    showRecipientInput,
    isEvmRecipientToggle,
    toggleRecipient,
    recipientWalletAddress: walletAddress(toChainId),
    sender: resolveAddress(fromChainId, 'sender'),
    receiver: resolveAddress(toChainId, 'receiver'),
    isReadOnly:
      (isEvmChain(fromChainId) && !account) || (!!toChainId && isEvmChain(toChainId) && !recipient && !account),
  }
}
