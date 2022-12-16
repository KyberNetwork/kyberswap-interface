import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { SignerWalletAdapter } from '@solana/wallet-adapter-base'
import { useCallback, useMemo } from 'react'

import { useActiveWeb3React, useWeb3React } from 'hooks/index'
import useENS from 'hooks/useENS'
import { useEncodeSolana, useSwapState } from 'state/swap/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { isAddress, shortenAddress } from 'utils'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import { sendEVMTransaction, sendSolanaTransactions } from 'utils/sendTransaction'

import { ZERO_ADDRESS_SOLANA } from './../constants/index'
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
const useSwapCallbackV3 = (
  inputAmount?: CurrencyAmount<Currency>,
  outputAmount?: CurrencyAmount<Currency>,
  priceImpact?: number,
  routerAddress?: string,
  encodedSwapData?: string,
): { state: SwapCallbackState; callback: null | (() => Promise<string>); error: string | null } => {
  const { account, chainId, isEVM, isSolana, walletSolana } = useActiveWeb3React()
  const { library } = useWeb3React()
  const provider = useProvider()
  const [encodeSolana] = useEncodeSolana()

  const { typedValue, feeConfig, saveGas, recipient: recipientAddressOrName } = useSwapState()

  const [allowedSlippage] = useUserSlippageTolerance()

  const addTransactionWithType = useTransactionAdder()

  const { address: recipientAddress } = useENS(recipientAddressOrName)

  const recipient = recipientAddressOrName === null || recipientAddressOrName === '' ? account : recipientAddress

  const solanaWalletAdapter = walletSolana?.wallet?.adapter

  const extractSwapData = useCallback(() => {
    if (!inputAmount || !outputAmount) {
      throw new Error('"inputAmount" is undefined.')
    }

    const inputSymbol = inputAmount.currency.symbol
    const outputSymbol = outputAmount.currency.symbol
    const inputAddress = inputAmount.currency.isNative ? ZERO_ADDRESS_SOLANA : inputAmount.currency.address
    const outputAddress = outputAmount.currency.isNative ? ZERO_ADDRESS_SOLANA : outputAmount.currency.address
    const inputAmountStr = formatCurrencyAmount(inputAmount, 6)
    const outputAmountStr = formatCurrencyAmount(outputAmount, 6)

    const base = `${
      feeConfig && feeConfig.chargeFeeBy === 'currency_in' && feeConfig.isInBps ? typedValue : inputAmountStr
    } ${inputSymbol} for ${outputAmountStr} ${outputSymbol}`
    const withRecipient =
      recipient === account
        ? undefined
        : `to ${
            recipientAddressOrName && isAddress(chainId, recipientAddressOrName)
              ? shortenAddress(chainId, recipientAddressOrName)
              : recipientAddressOrName
          }`

    return {
      hash: '',
      type: TRANSACTION_TYPE.SWAP,
      summary: `${base} ${withRecipient ?? ''}`,
      arbitrary: {
        inputSymbol,
        outputSymbol,
        inputAddress,
        outputAddress,
        inputDecimals: inputAmount.currency.decimals,
        outputDecimals: outputAmount.currency.decimals,
        withRecipient,
        saveGas,
        inputAmount: inputAmount.toExact(),
        slippageSetting: allowedSlippage ? allowedSlippage / 100 : 0,
        priceImpact: priceImpact && priceImpact > 0.01 ? priceImpact.toFixed(2) : '<0.01',
      },
    }
  }, [
    account,
    allowedSlippage,
    chainId,
    feeConfig,
    inputAmount,
    outputAmount,
    priceImpact,
    recipient,
    recipientAddressOrName,
    saveGas,
    typedValue,
  ])

  return useMemo(() => {
    if (!account || !inputAmount || !routerAddress || !encodedSwapData) {
      return { state: SwapCallbackState.INVALID, callback: null, error: 'Missing dependencies' }
    }

    const swapData = extractSwapData()
    const onHandleSwapResponse = (tx: TransactionResponse) => {
      addTransactionWithType({
        ...swapData,
        hash: tx.hash,
      })
    }

    if (!recipient) {
      if (recipientAddressOrName !== null) {
        return { state: SwapCallbackState.INVALID, callback: null, error: 'Invalid recipient' }
      } else {
        return { state: SwapCallbackState.LOADING, callback: null, error: null }
      }
    }

    const value = BigNumber.from(inputAmount.currency.isNative ? inputAmount.quotient.toString() : 0)
    const onSwapWithBackendEncode = async (): Promise<string> => {
      const response = await sendEVMTransaction(
        account,
        library,
        routerAddress,
        encodedSwapData,
        value,
        onHandleSwapResponse,
      )
      if (response?.hash === undefined) throw new Error('sendTransaction returned undefined.')
      return response?.hash
    }
    const onSwapSolana = async (): Promise<string> => {
      if (!provider) throw new Error('Please connect wallet first')
      if (!solanaWalletAdapter) throw new Error('Please connect wallet first')
      if (!encodeSolana) throw new Error('Encode not found')

      const hash = await sendSolanaTransactions(
        encodeSolana,
        solanaWalletAdapter as any as SignerWalletAdapter,
        addTransactionWithType,
        swapData,
      )
      if (hash === undefined) throw new Error('sendTransaction returned undefined.')
      return hash[0]
    }

    return {
      state: SwapCallbackState.VALID,
      callback: isEVM ? onSwapWithBackendEncode : isSolana ? (encodeSolana ? onSwapSolana : null) : null,
      error: null,
    }
  }, [
    account,
    addTransactionWithType,
    encodeSolana,
    encodedSwapData,
    extractSwapData,
    inputAmount,
    isEVM,
    isSolana,
    library,
    provider,
    recipient,
    recipientAddressOrName,
    routerAddress,
    solanaWalletAdapter,
  ])
}

export default useSwapCallbackV3
