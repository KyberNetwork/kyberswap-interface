import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { getConnection } from 'connection'
import { useCallback } from 'react'

import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import { ETHER_ADDRESS } from 'constants/index'
import { useActiveWeb3React, useWeb3React } from 'hooks/index'
import useENS from 'hooks/useENS'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE, TransactionExtraInfo2Token } from 'state/transactions/type'
import { usePaymentToken, useUserSlippageTolerance } from 'state/user/hooks'
import { ChargeFeeBy } from 'types/route'
import { isAddress, shortenAddress } from 'utils'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import { sendEVMTransaction } from 'utils/sendTransaction'
import { ErrorName } from 'utils/sentry'

// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
const useSwapCallbackV3 = (isPermitSwap?: boolean) => {
  const { account, chainId } = useActiveWeb3React()
  const { library, connector } = useWeb3React()
  const { name: walletKey } = getConnection(connector).getProviderInfo()

  const { recipient: recipientAddressOrName, routeSummary } = useSwapFormContext()
  const { parsedAmountIn: inputAmount, parsedAmountOut: outputAmount, priceImpact } = routeSummary || {}

  const [allowedSlippage] = useUserSlippageTolerance()

  const addTransactionWithType = useTransactionAdder()

  const { address: recipientAddress } = useENS(recipientAddressOrName)

  const recipient = recipientAddressOrName === null || recipientAddressOrName === '' ? account : recipientAddress

  const getSwapData = useCallback(() => {
    if (!inputAmount || !outputAmount) {
      throw new Error('"inputAmount" is undefined.')
    }

    const inputSymbol = inputAmount.currency.symbol
    const outputSymbol = outputAmount.currency.symbol
    const inputAddress = inputAmount.currency.isNative ? ETHER_ADDRESS : inputAmount.currency.address
    const outputAddress = outputAmount.currency.isNative ? ETHER_ADDRESS : outputAmount.currency.address
    const inputAmountStr = formatCurrencyAmount(inputAmount, 6)
    const outputAmountStr = formatCurrencyAmount(outputAmount, 6)

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
      extraInfo: {
        tokenAmountIn: inputAmountStr,
        tokenAmountOut: outputAmountStr,
        tokenSymbolIn: inputSymbol,
        tokenSymbolOut: outputSymbol,
        tokenAddressIn: inputAddress,
        tokenAddressOut: outputAddress,
        arbitrary: {
          inputSymbol,
          outputSymbol,
          inputAddress,
          outputAddress,
          inputDecimals: inputAmount.currency.decimals,
          outputDecimals: outputAmount.currency.decimals,
          withRecipient,
          inputAmount: inputAmount.toExact(),
          slippageSetting: allowedSlippage ? allowedSlippage / 100 : 0,
          priceImpact: priceImpact && priceImpact > 0.01 ? priceImpact.toFixed(2) : '<0.01',
          isPermitSwap,
          feeInfo: routeSummary?.fee
            ? {
                chargeTokenIn: routeSummary.extraFee.chargeFeeBy === ChargeFeeBy.CURRENCY_IN,
                tokenSymbol: routeSummary.fee.currency.symbol || '',
                feeUsd: routeSummary.extraFee.feeAmountUsd,
                feeAmount: routeSummary.fee.currencyAmount.toExact(),
              }
            : undefined,
        },
      } as TransactionExtraInfo2Token,
    }
  }, [
    account,
    allowedSlippage,
    chainId,
    inputAmount,
    isPermitSwap,
    outputAmount,
    priceImpact,
    recipient,
    recipientAddressOrName,
    routeSummary,
  ])

  const handleSwapResponse = useCallback(
    (tx: TransactionResponse) => {
      const swapData = getSwapData()

      addTransactionWithType({
        ...swapData,
        hash: tx.hash,
      })
    },
    [addTransactionWithType, getSwapData],
  )

  const [paymentToken] = usePaymentToken()

  const swapCallbackForEVM = useCallback(
    async (routerAddress: string | undefined, encodedSwapData: string | undefined) => {
      if (!account || !inputAmount || !routerAddress || !encodedSwapData) {
        throw new Error('Missing dependencies')
      }
      const value = BigNumber.from(inputAmount.currency.isNative ? inputAmount.quotient.toString() : 0)

      const response = await sendEVMTransaction({
        account,
        library,
        contractAddress: routerAddress,
        encodedData: encodedSwapData,
        value,
        sentryInfo: {
          name: ErrorName.SwapError,
          wallet: walletKey,
        },
        paymentToken: paymentToken?.address,
      })
      if (response?.hash === undefined) throw new Error('sendTransaction returned undefined.')
      handleSwapResponse(response)
      return response?.hash
    },
    [account, handleSwapResponse, inputAmount, library, walletKey, paymentToken?.address],
  )

  return swapCallbackForEVM
}

export default useSwapCallbackV3
