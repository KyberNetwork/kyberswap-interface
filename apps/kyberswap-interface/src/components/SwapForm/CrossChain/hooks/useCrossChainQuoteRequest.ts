import { useMemo } from 'react'
import { parseUnits } from 'viem'

import { CrossChainPair } from 'components/SwapForm/CrossChain/hooks/useCrossChainPair'
import { useSwapWallets } from 'components/SwapWallets/SwapWalletContext'
import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { NonEvmChain } from 'types/crossChain'

export type CrossChainQuoteInput = {
  pair: CrossChainPair
  amount: string
  sender: string
  receiver: string
  isReadOnly: boolean
}

/** Wallet/request snapshot shared by all cross-chain quote consumers. */
export const useCrossChainQuoteRequest = ({ pair, amount, sender, receiver, isReadOnly }: CrossChainQuoteInput) => {
  const { pairKey, fromChainId, toChainId, currencyIn, currencyOut } = pair

  const wallets = useSwapWallets()
  const { walletInfo } = useBitcoinWallet()
  const [slippage] = useUserSlippageTolerance()

  const amountInWei = currencyIn ? parseUnits(amount || '0', currencyIn.decimals).toString() : undefined

  // An empty selected slot must not borrow credentials from a global wallet.
  const btcPublicKey = wallets
    ? wallets.inputConnection?.family === NonEvmChain.Bitcoin
      ? wallets.inputConnection.getPublicKey()
      : ''
    : walletInfo?.publicKey || ''

  // Stable request identity includes raw input so editing immediately invalidates an old response/review.
  const request = useMemo(() => {
    const params =
      fromChainId && toChainId && currencyIn && currencyOut && amountInWei && amountInWei !== '0'
        ? {
            fromChain: fromChainId,
            toChain: toChainId,
            fromToken: currencyIn,
            toToken: currencyOut,
            amount: amountInWei,
            slippage,
            sender,
            recipient: receiver,
            publicKey: btcPublicKey,
          }
        : null

    return { pairKey, amount, params, isReadOnly }
  }, [
    pairKey,
    amount,
    fromChainId,
    toChainId,
    currencyIn,
    currencyOut,
    amountInWei,
    slippage,
    sender,
    receiver,
    btcPublicKey,
    isReadOnly,
  ])

  return request
}
