import { useMemo } from 'react'
import { parseUnits } from 'viem'

import { CrossChainPair } from 'components/SwapForm/CrossChain/hooks/useCrossChainPair'
import { useSwapWallets } from 'components/SwapWallets/SwapWalletContext'
import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { NonEvmChain } from 'types/crossChain'

export type CrossChainQuoteInput = {
  enabled?: boolean
  pair: CrossChainPair
  amount: string
  sender: string
  receiver: string
  isReadOnly: boolean
}

/**
 * Captures quote inputs in a stable identity shared by all mode-specific pools.
 * Raw input, slippage and wallet/recipient changes invalidate that identity; the caller
 * adds source exclusions. Gas Drop mode stays outside it so toggles can reuse pools.
 * Null params disable requests. Debouncing and transport belong to the session/pools.
 */
export const useCrossChainQuoteRequest = ({
  enabled = true,
  pair,
  amount,
  sender,
  receiver,
  isReadOnly,
}: CrossChainQuoteInput) => {
  const { pairKey, fromChainId, toChainId, currencyIn, currencyOut } = pair

  const wallets = useSwapWallets()
  const { walletInfo } = useBitcoinWallet()
  const [slippage] = useUserSlippageTolerance()

  const amountInWei = enabled && currencyIn ? parseUnits(amount || '0', currencyIn.decimals).toString() : undefined

  // An empty selected slot must not borrow credentials from a global wallet.
  const btcPublicKey = wallets
    ? wallets.inputConnection?.family === NonEvmChain.Bitcoin
      ? wallets.inputConnection.getPublicKey()
      : ''
    : walletInfo?.publicKey || ''

  // Stable request identity includes raw input so editing immediately invalidates an old response/review.
  const request = useMemo(() => {
    const params =
      enabled && fromChainId && toChainId && currencyIn && currencyOut && amountInWei && amountInWei !== '0'
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
    enabled,
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
