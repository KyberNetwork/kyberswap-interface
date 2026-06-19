import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import { getTipLinkAttribution } from 'components/TipLinkGeneratorModal/shared'
import { ETHER_ADDRESS } from 'constants/index'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useENS from 'hooks/useENS'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE, TransactionExtraInfo2Token } from 'state/transactions/type'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { ChargeFeeBy } from 'types/route'
import { isAddress, shortenAddress } from 'utils'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import { sendEVMTransaction } from 'utils/sendTransaction'
import { ErrorName } from 'utils/transactionError'

// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
const useSwapCallbackV3 = (isPermitSwap?: boolean) => {
  const { account, chainId, networkInfo } = useActiveWeb3React()
  const { connector, isSmartConnector } = useWeb3React()
  const walletKey = connector?.name

  const { recipient: recipientAddressOrName, routeSummary } = useSwapFormContext()
  const { parsedAmountIn: inputAmount, parsedAmountOut: outputAmount, priceImpact } = routeSummary || {}

  const [allowedSlippage] = useUserSlippageTolerance()
  const [searchParams] = useSearchParams()

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
          amountInUsd: routeSummary?.amountInUsd,
          amountOutUsd: routeSummary?.amountOutUsd,
          tradeRouteDexes: [...new Set(routeSummary?.route?.flat().map(r => r.exchange) || [])],
          chain: networkInfo.name,
          volume: routeSummary?.amountInUsd ? Number(routeSummary.amountInUsd) : undefined,
          // Persisted so the deferred `Swap Completed` updater can attribute the trade
          // back to a community tip link (null for non-tip-link swaps).
          tipLink: getTipLinkAttribution(searchParams) || undefined,
        },
      } as TransactionExtraInfo2Token,
    }
  }, [
    account,
    allowedSlippage,
    chainId,
    inputAmount,
    isPermitSwap,
    networkInfo.name,
    outputAmount,
    priceImpact,
    recipient,
    recipientAddressOrName,
    routeSummary,
    searchParams,
  ])

  const handleSwapResponse = useCallback(
    (tx: { hash: string }) => {
      const swapData = getSwapData()

      addTransactionWithType({
        ...swapData,
        hash: tx.hash,
      })
    },
    [addTransactionWithType, getSwapData],
  )

  const swapCallbackForEVM = useCallback(
    async (routerAddress: string | undefined, encodedSwapData: string | undefined, onRequestSignature?: () => void) => {
      if (!account || !inputAmount || !routerAddress || !encodedSwapData) {
        throw new Error('Missing dependencies')
      }
      const value = inputAmount.currency.isNative ? BigInt(inputAmount.quotient.toString()) : 0n

      const response = await sendEVMTransaction({
        account,
        contractAddress: routerAddress,
        encodedData: encodedSwapData,
        value,
        isSmartConnector,
        errorInfo: {
          name: ErrorName.SwapError,
          wallet: walletKey,
        },
        chainId,
        onRequestSignature,
      })
      if (response?.hash === undefined) throw new Error('sendTransaction returned undefined.')
      handleSwapResponse(response)
      return response?.hash
    },
    [account, chainId, handleSwapResponse, inputAmount, walletKey, isSmartConnector],
  )

  return swapCallbackForEVM
}

export default useSwapCallbackV3
