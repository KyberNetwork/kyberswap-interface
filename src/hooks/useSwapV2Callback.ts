import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { useCallback, useMemo } from 'react'

import { useActiveWeb3React, useWeb3React } from 'hooks/index'
import useENS from 'hooks/useENS'
import { useSwapState } from 'state/swap/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { isAddress, shortenAddress } from 'utils'
import { Aggregator } from 'utils/aggregator'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import { sendEVMTransaction, sendSolanaTransaction } from 'utils/sendTransaction'

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
  recipientAddressOrName: string | null, // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
): { state: SwapCallbackState; callback: null | (() => Promise<string>); error: string | null } {
  const { account, chainId, isEVM, isSolana } = useActiveWeb3React()
  const { library } = useWeb3React()

  const { typedValue, feeConfig, saveGas } = useSwapState()

  const [allowedSlippage] = useUserSlippageTolerance()

  const addTransactionWithType = useTransactionAdder()

  const { address: recipientAddress } = useENS(recipientAddressOrName)

  const recipient = recipientAddressOrName === null || recipientAddressOrName === '' ? account : recipientAddress

  const onHandleResponse = useCallback(
    (response: TransactionResponse) => {
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

      addTransactionWithType(response, {
        type: 'Swap',
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

    const onSwapWithBackendEncode = async (): Promise<string> => {
      const value = BigNumber.from(trade.inputAmount.currency.isNative ? trade.inputAmount.quotient.toString() : 0)
      if (isEVM) {
        const hash = await sendEVMTransaction(
          account,
          library,
          trade.routerAddress,
          trade.encodedSwapData,
          value,
          onHandleResponse,
        )
        if (hash === undefined) throw new Error('sendTransaction returned undefined.')
        return hash
      } else if (isSolana) {
        const hash = await sendSolanaTransaction(account, trade.routerAddress, trade, value, onHandleResponse)
        if (hash === undefined) throw new Error('sendTransaction returned undefined.')
        return hash
      }
      throw new Error('either evm or solana')
    }

    return {
      state: SwapCallbackState.VALID,
      callback: onSwapWithBackendEncode,
      error: null,
    }
  }, [trade, account, recipient, recipientAddressOrName, isEVM, isSolana, library, onHandleResponse])
}
