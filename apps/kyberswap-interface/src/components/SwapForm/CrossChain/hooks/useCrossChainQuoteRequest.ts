import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useMemo } from 'react'
import { adaptRelaySolanaWallet } from 'services/crossChain/adapters/RelayAdapter/relaySolanaWallet'
import { CROSS_CHAIN_FEE_RECEIVER_SOLANA } from 'services/crossChain/utils'
import { parseUnits } from 'viem'

import { CrossChainPair } from 'components/SwapForm/CrossChain/hooks/useCrossChainPair'
import { useSwapWallets } from 'components/SwapWallets/SwapWalletContext'
import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import useDebounce from 'hooks/useDebounce'
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
  const { pairKey, fromChainId, toChainId, currencyIn, currencyOut, nearTokens } = pair

  const debouncedAmount = useDebounce(amount, 500)
  const { publicKey } = useWallet()
  const wallets = useSwapWallets()
  const { connection } = useConnection()
  const { walletInfo } = useBitcoinWallet()
  const [slippage] = useUserSlippageTolerance()

  const amountInWei = currencyIn ? parseUnits(debouncedAmount || '0', currencyIn.decimals).toString() : undefined
  const isAmountPending = amount !== debouncedAmount

  // An empty selected slot must not borrow credentials from a global wallet.
  const solanaAddress = (wallets ? wallets.inputAddress : publicKey?.toString()) || CROSS_CHAIN_FEE_RECEIVER_SOLANA
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
            nearTokens,
            publicKey: btcPublicKey,
            // EVM quotes use sender/recipient; execution resolves the live wallet client separately.
            // Keeping that client here would invalidate quotes whenever the wallet switches chains.
            walletClient:
              fromChainId === NonEvmChain.Solana
                ? adaptRelaySolanaWallet(solanaAddress, 792703809, connection, async (transaction, options) => ({
                    signature: await (connection.sendTransaction as any)(transaction, options),
                  }))
                : undefined,
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
    isReadOnly,
  ])

  return request
}
