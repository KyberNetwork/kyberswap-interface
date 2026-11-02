import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { useWallet } from '@solana/wallet-adapter-react'
import { useEffect, useState } from 'react'

import { RECEIVER_WALLETS_KEY, ReceiverWallet } from 'components/SwapForm/CrossChain/receiverWallet'
import { useEvmRecipient } from 'components/SwapForm/hooks/useEvmRecipient'
import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import { ZERO_ADDRESS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { Chain, NonEvmChain, isNonEvmChain } from 'pages/Swap/crossChain/adapters/types'
import {
  BTC_DEFAULT_RECEIVER,
  CROSS_CHAIN_FEE_RECEIVER,
  CROSS_CHAIN_FEE_RECEIVER_SOLANA,
} from 'pages/Swap/crossChain/utils'

type RecipientInput = { mode: 'wallet' | 'paste'; pastedAddress: string; expanded: boolean }
const EMPTY_INPUT: RecipientInput = { mode: 'wallet', pastedAddress: '', expanded: true }

/** The sender is a signing session. Connected and pasted receivers are independent form values. */
export const useCrossChainRecipient = (fromChainId: Chain, toChainId?: Chain) => {
  const { account } = useActiveWeb3React()
  const { signedAccountId } = useWalletSelector()
  const { walletInfo } = useBitcoinWallet()
  const { publicKey } = useWallet()
  const [receiverWallets, setReceiverWallets] = useState<Partial<Record<NonEvmChain, ReceiverWallet>>>(() => {
    try {
      return JSON.parse(localStorage.getItem(RECEIVER_WALLETS_KEY) || '{}') || {}
    } catch {
      return {}
    }
  })
  const [recipientInputs, setRecipientInputs] = useState<Partial<Record<NonEvmChain, RecipientInput>>>({})
  const evm = useEvmRecipient(account)

  const nonEvmChain = toChainId && isNonEvmChain(toChainId) ? (toChainId as NonEvmChain) : undefined
  const receiverWallet = nonEvmChain ? receiverWallets?.[nonEvmChain] : undefined
  const input = (nonEvmChain && recipientInputs[nonEvmChain]) || EMPTY_INPUT
  const showNonEvmRecipient = !!nonEvmChain && input.mode === 'paste'
  const showRecipientInput = nonEvmChain ? input.expanded : evm.expanded
  const recipient = nonEvmChain
    ? input.mode === 'paste'
      ? input.pastedAddress
      : receiverWallet?.address || ''
    : evm.recipient

  const senderAddress =
    fromChainId === NonEvmChain.Near
      ? signedAccountId
      : fromChainId === NonEvmChain.Solana
      ? publicKey?.toString()
      : fromChainId === NonEvmChain.Bitcoin
      ? walletInfo?.address
      : account
  const fallbackAddress = (chain?: Chain) => {
    if (chain === NonEvmChain.Bitcoin) return BTC_DEFAULT_RECEIVER
    if (chain === NonEvmChain.Near) return ZERO_ADDRESS
    if (chain === NonEvmChain.Solana) return CROSS_CHAIN_FEE_RECEIVER_SOLANA
    return account || CROSS_CHAIN_FEE_RECEIVER
  }
  const updateInput = (change: Partial<RecipientInput>) => {
    if (!nonEvmChain) return
    setRecipientInputs(previous => ({
      ...previous,
      [nonEvmChain]: { ...(previous[nonEvmChain] || EMPTY_INPUT), ...change },
    }))
  }
  const setRecipient = (value: string) => {
    if (nonEvmChain) updateInput({ pastedAddress: value, mode: 'paste' })
    else evm.setRecipient(value)
  }
  const applyRecipient = (value: string) => updateInput({ pastedAddress: value, mode: 'paste', expanded: true })
  const selectWalletRecipient = () => {
    if (nonEvmChain) updateInput({ mode: 'wallet' })
    else evm.useMyWallet()
  }
  const connectReceiverWallet = (wallet: ReceiverWallet) => {
    if (!nonEvmChain) return
    setReceiverWallets(previous => ({ ...previous, [nonEvmChain]: wallet }))
    updateInput({ mode: 'wallet' })
  }
  const disconnectReceiverWallet = () => {
    if (!nonEvmChain) return
    setReceiverWallets(previous => {
      const next = { ...previous }
      delete next[nonEvmChain]
      return next
    })
  }
  const toggleRecipient = () => {
    if (nonEvmChain) updateInput({ expanded: !input.expanded })
    else evm.toggleExpanded()
  }

  useEffect(() => {
    try {
      localStorage.setItem(RECEIVER_WALLETS_KEY, JSON.stringify(receiverWallets))
    } catch {
      // The form remains usable when browser storage is unavailable.
    }
  }, [receiverWallets])

  return {
    recipient,
    receiverWallet,
    pastedRecipient: nonEvmChain ? input.pastedAddress : '',
    setRecipient,
    applyRecipient,
    selectWalletRecipient,
    connectReceiverWallet,
    disconnectReceiverWallet,
    showNonEvmRecipient,
    showRecipientInput,
    recipientMode: nonEvmChain ? ('nonEvm' as const) : ('evm' as const),
    canUseMyWallet: !nonEvmChain && evm.canUseMyWallet,
    toggleRecipient,
    sender: senderAddress || fallbackAddress(fromChainId),
    receiver: recipient || fallbackAddress(toChainId),
    // Placeholder addresses support preview quotes only; they must never be executable.
    isReadOnly: !senderAddress || !recipient,
  }
}
