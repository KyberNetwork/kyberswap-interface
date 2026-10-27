import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useMemo } from 'react'
import { parseUnits } from 'viem'

import { CrossChainPair } from 'components/SwapForm/CrossChain/hooks/useCrossChainPair'
import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import useDebounce from 'hooks/useDebounce'
import { useGatedWalletClient } from 'hooks/useGatedWalletClient'
import { adaptRelaySolanaWallet } from 'pages/Swap/crossChain/adapters/RelayAdapter/relaySolanaWallet'
import { NonEvmChain } from 'pages/Swap/crossChain/adapters/types'
import { CROSS_CHAIN_FEE_RECEIVER_SOLANA } from 'pages/Swap/crossChain/utils'
import { useUserSlippageTolerance } from 'state/user/hooks'

export type CrossChainQuoteInput = {
  pair: CrossChainPair
  amount: string
  sender: string
  receiver: string
  isReadOnly: boolean
}

/** Wallet/request snapshot shared by all cross-chain quote consumers. */
export const useCrossChainQuoteRequest = ({ pair, amount, sender, receiver, isReadOnly }: CrossChainQuoteInput) => {
  const { pairKey, fromChainId, toChainId, currencyIn, currencyOut, nearTokens } = pair

  const debouncedAmount = useDebounce(amount, 500)
  const amountInWei = currencyIn ? parseUnits(debouncedAmount || '0', currencyIn.decimals).toString() : undefined
  const isAmountPending = amount !== debouncedAmount

  const walletClient = useGatedWalletClient()

  const { publicKey } = useWallet()
  const solanaAddress = publicKey?.toString() || CROSS_CHAIN_FEE_RECEIVER_SOLANA
  const { connection } = useConnection()

  const { walletInfo } = useBitcoinWallet()
  const btcPublicKey = walletInfo?.publicKey || ''

  const [slippage] = useUserSlippageTolerance()

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
            nearTokens,
            publicKey: btcPublicKey,
            walletClient:
              fromChainId === NonEvmChain.Solana
                ? adaptRelaySolanaWallet(solanaAddress, 792703809, connection, async (transaction, options) => ({
                    signature: await (connection.sendTransaction as any)(transaction, options),
                  }))
                : walletClient?.data,
          }
        : null

    return { pairKey, amount, isAmountPending, params, isReadOnly }
  }, [
    pairKey,
    amount,
    isAmountPending,
    fromChainId,
    toChainId,
    currencyIn,
    currencyOut,
    amountInWei,
    slippage,
    sender,
    receiver,
    nearTokens,
    btcPublicKey,
    solanaAddress,
    connection,
    walletClient?.data,
    isReadOnly,
  ])

  return request
}
