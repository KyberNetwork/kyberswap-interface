import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { useWallet } from '@solana/wallet-adapter-react'
import { useState } from 'react'
import {
  BTC_DEFAULT_RECEIVER,
  CROSS_CHAIN_FEE_RECEIVER,
  CROSS_CHAIN_FEE_RECEIVER_SOLANA,
} from 'services/crossChain/utils'

import { useEvmRecipient } from 'components/SwapForm/hooks/useEvmRecipient'
import { useSwapWallets } from 'components/SwapWallets/SwapWalletContext'
import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import { ZERO_ADDRESS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { Chain, NonEvmChain, isNonEvmChain } from 'types/crossChain'

type RecipientInput = { mode: 'wallet' | 'paste'; pastedAddress: string; expanded: boolean }
const EMPTY_INPUT: RecipientInput = { mode: 'wallet', pastedAddress: '', expanded: true }

const getPreviewAddress = (chain: Chain | undefined, account: string | undefined) => {
  if (chain === NonEvmChain.Bitcoin) return BTC_DEFAULT_RECEIVER
  if (chain === NonEvmChain.Near) return ZERO_ADDRESS
  if (chain === NonEvmChain.Solana) return CROSS_CHAIN_FEE_RECEIVER_SOLANA
  return account || CROSS_CHAIN_FEE_RECEIVER
}

/**
 * The provider owns signing sessions. This hook owns recipient presentation state,
 * so reverse can swap wallets without changing paste mode, text, or collapse state.
 */
export const useCrossChainRecipient = (fromChainId: Chain, toChainId?: Chain) => {
  const { account } = useActiveWeb3React()
  const { signedAccountId } = useWalletSelector()
  const { walletInfo } = useBitcoinWallet()
  const { publicKey } = useWallet()
  const wallets = useSwapWallets()

  const [recipientInput, setRecipientInput] = useState<RecipientInput>(EMPTY_INPUT)
  const evm = useEvmRecipient(account)

  // Routes involving a non-EVM chain use an independent receiver.
  // EVM-to-EVM routes keep the existing app-wallet recipient behavior.
  const nonEvmChain = toChainId && isNonEvmChain(toChainId) ? (toChainId as NonEvmChain) : undefined
  const hasIndependentReceiver = !!nonEvmChain || (toChainId !== undefined && isNonEvmChain(fromChainId))
  const receiverWallet =
    hasIndependentReceiver && wallets?.outputConnection && wallets.outputAddress
      ? { ...wallets.outputConnection, address: wallets.outputAddress }
      : undefined
  const isPastedRecipient = hasIndependentReceiver && recipientInput.mode === 'paste'
  const showRecipientInput = hasIndependentReceiver ? recipientInput.expanded : evm.expanded
  const recipient = hasIndependentReceiver
    ? recipientInput.mode === 'paste'
      ? recipientInput.pastedAddress
      : receiverWallet?.address || ''
    : evm.recipient

  // The provider is authoritative inside SwapWalletProvider. Direct wallet hooks
  // remain the fallback for legacy consumers.
  const senderAddress = wallets
    ? wallets.inputAddress
    : fromChainId === NonEvmChain.Near
    ? signedAccountId
    : fromChainId === NonEvmChain.Solana
    ? publicKey?.toString()
    : fromChainId === NonEvmChain.Bitcoin
    ? walletInfo?.address
    : account

  const updateInput = (change: Partial<RecipientInput>) => {
    if (!hasIndependentReceiver) return
    setRecipientInput(previous => ({ ...previous, ...change }))
  }
  const setRecipient = (value: string) => {
    if (hasIndependentReceiver) updateInput({ pastedAddress: value, mode: 'paste' })
    else evm.setRecipient(value)
  }
  const applyRecipient = (value: string) => updateInput({ pastedAddress: value, mode: 'paste', expanded: true })
  const selectWalletRecipient = () => {
    if (hasIndependentReceiver) updateInput({ mode: 'wallet' })
    else evm.useMyWallet()
  }
  const toggleRecipient = () => {
    if (hasIndependentReceiver) updateInput({ expanded: !recipientInput.expanded })
    else evm.toggleExpanded()
  }

  return {
    recipient,
    recipientInputValue: hasIndependentReceiver ? recipientInput.pastedAddress : evm.inputValue,
    receiverWallet,
    pastedRecipient: hasIndependentReceiver ? recipientInput.pastedAddress : '',
    isPastedRecipient,
    showRecipientInput,
    recipientMode: nonEvmChain ? ('nonEvm' as const) : ('evm' as const),
    canUseMyWallet: !hasIndependentReceiver && evm.canUseMyWallet,
    sender: senderAddress || getPreviewAddress(fromChainId, account),
    receiver: recipient || getPreviewAddress(toChainId, account),
    // Placeholder addresses support preview quotes only; they must never be executable.
    isReadOnly: !senderAddress || !recipient,
    setRecipient,
    applyRecipient,
    selectWalletRecipient,
    toggleRecipient,
  }
}
