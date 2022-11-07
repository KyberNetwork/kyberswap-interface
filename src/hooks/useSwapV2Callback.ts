import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { useWallet } from '@solana/wallet-adapter-react'
import { useCallback, useMemo } from 'react'

import { useActiveWeb3React, useWeb3React } from 'hooks/index'
import useENS from 'hooks/useENS'
import { useSwapState } from 'state/swap/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { isAddress, shortenAddress } from 'utils'
import { Aggregator } from 'utils/aggregator'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import { sendEVMTransaction, sendSolanaTransactionWithBEEncode } from 'utils/sendTransaction'

import useProvider from './solana/useProvider'

enum SwapCallbackState {
  INVALID,
  LOADING,
  VALID,
}

export interface FeeConfig {
  chargeFeeBy: 'currency_in' | 'currency_out'
  feeReceiver: string
  isInBps: boolean
  feeAmount: string
}

// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
export function useSwapV2Callback(
  trade: Aggregator | undefined, // trade to execute, required
): { state: SwapCallbackState; callback: null | (() => Promise<string>); error: string | null } {
  const { account, chainId, isEVM, isSolana } = useActiveWeb3React()
  const { library } = useWeb3React()
  const { wallet: solanaWallet } = useWallet()
  const provider = useProvider()

  const { typedValue, feeConfig, saveGas, recipient: recipientAddressOrName } = useSwapState()

  const [allowedSlippage] = useUserSlippageTolerance()

  const addTransactionWithType = useTransactionAdder()

  const { address: recipientAddress } = useENS(recipientAddressOrName)

  const recipient = recipientAddressOrName === null || recipientAddressOrName === '' ? account : recipientAddress

  const onHandleSwapResponse = useCallback(
    (hash: string, firstTxHash?: string) => {
      if (!trade) {
        throw new Error('"trade" is undefined.')
      }

      const inputSymbol = trade.inputAmount.currency.symbol
      const outputSymbol = trade.outputAmount.currency.symbol
      const inputAmount = formatCurrencyAmount(trade.inputAmount, 6)
      const outputAmount = formatCurrencyAmount(trade.outputAmount, 6)

      const base = `${
        feeConfig && feeConfig.chargeFeeBy === 'currency_in' && feeConfig.isInBps ? typedValue : inputAmount
      } ${inputSymbol} for ${outputAmount} ${outputSymbol}`
      const withRecipient =
        recipient === account
          ? undefined
          : `to ${
              recipientAddressOrName && isAddress(chainId, recipientAddressOrName)
                ? shortenAddress(chainId, recipientAddressOrName)
                : recipientAddressOrName
            }`

      addTransactionWithType({
        hash,
        type: TRANSACTION_TYPE.SWAP,
        summary: `${base} ${withRecipient ?? ''}`,
        arbitrary: {
          inputSymbol,
          outputSymbol,
          inputDecimals: trade.inputAmount.currency.decimals,
          outputDecimals: trade.outputAmount.currency.decimals,
          withRecipient,
          saveGas,
          inputAmount: trade.inputAmount.toExact(),
          slippageSetting: allowedSlippage ? allowedSlippage / 100 : 0,
          priceImpact: trade && trade?.priceImpact > 0.01 ? trade?.priceImpact.toFixed(2) : '<0.01',
        },
        firstTxHash,
      })
    },
    [
      chainId,
      allowedSlippage,
      account,
      addTransactionWithType,
      feeConfig,
      recipient,
      recipientAddressOrName,
      saveGas,
      trade,
      typedValue,
    ],
  )

  const onHandleCustomTypeResponse = useCallback(
    (type: TRANSACTION_TYPE, hash: string, firstTxHash?: string) => {
      addTransactionWithType({
        hash,
        type,
        firstTxHash,
      })
    },
    [addTransactionWithType],
  )

  return useMemo(() => {
    if (!trade || !account) {
      return { state: SwapCallbackState.INVALID, callback: null, error: 'Missing dependencies' }
    }
    if (!recipient) {
      if (recipientAddressOrName !== null) {
        return { state: SwapCallbackState.INVALID, callback: null, error: 'Invalid recipient' }
      } else {
        return { state: SwapCallbackState.LOADING, callback: null, error: null }
      }
    }

    const value = BigNumber.from(trade.inputAmount.currency.isNative ? trade.inputAmount.quotient.toString() : 0)
    const onSwapWithBackendEncode = async (): Promise<string> => {
      const hash = await sendEVMTransaction(
        account,
        library,
        trade.routerAddress,
        trade.encodedSwapData,
        value,
        (tx: TransactionResponse) => onHandleSwapResponse(tx.hash),
      )
      if (hash === undefined) throw new Error('sendTransaction returned undefined.')
      return hash
    }

    const onSwapSolana = async (): Promise<string> => {
      if (!provider) throw new Error('Please connect wallet first')
      if (!solanaWallet?.adapter) throw new Error('Please connect wallet first')
      if (!trade.swapTx) throw new Error('Encode not found')
      const hash = await sendSolanaTransactionWithBEEncode(
        account,
        trade,
        solanaWallet.adapter as any,
        onHandleSwapResponse,
        onHandleCustomTypeResponse,
      )
      if (hash === undefined) throw new Error('sendTransaction returned undefined.')
      return hash[0]
    }

    return {
      state: SwapCallbackState.VALID,
      callback: isEVM ? onSwapWithBackendEncode : isSolana ? onSwapSolana : null,
      error: null,
    }
  }, [
    trade,
    account,
    recipient,
    isEVM,
    isSolana,
    recipientAddressOrName,
    library,
    onHandleSwapResponse,
    provider,
    solanaWallet,
    onHandleCustomTypeResponse,
  ])
}
