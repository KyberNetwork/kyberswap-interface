import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import { getTipLinkAttribution } from 'components/TipLinkGeneratorModal/shared'
import { ETHER_ADDRESS } from 'constants/index'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useENS from 'hooks/useENS'
import { useERC8056DisplayBalance } from 'hooks/useERC8056Token'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE, TransactionExtraInfo, TransactionExtraInfo2Token } from 'state/transactions/type'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { ChargeFeeBy } from 'types/route'
import { isAddress, shortenAddress } from 'utils/address'
import { swapTxValue } from 'utils/nativeErc20'
import { formatDisplayNumber } from 'utils/numbers'
import { sendEVMTransaction } from 'utils/sendTransaction'
import { ErrorName } from 'utils/transactionError'

// Sends the reviewed router payload and records its hash with the captured swap metadata.
const useSingleChainSwapExecution = (isPermitSwap?: boolean) => {
  const { account, chainId, networkInfo } = useActiveWeb3React()
  const { connector, isSmartConnector } = useWeb3React()
  const walletKey = connector?.name

  const { recipient: recipientAddressOrName, routeSummary, displayTypedValue, outputERC8056Info } = useSwapFormContext()
  const { parsedAmountIn: inputAmount, parsedAmountOut: outputAmount, priceImpact } = routeSummary || {}
  const isSmartSettlement = routeSummary?.isSmartSettlement
  const displayOutputAmount = useERC8056DisplayBalance(outputERC8056Info, outputAmount)?.toSignificant(6)

  const [allowedSlippage] = useUserSlippageTolerance()
  const [searchParams] = useSearchParams()
  const { trackingHandler } = useTracking()

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
    const inputAmountStr = formatDisplayNumber(inputAmount, { significantDigits: 6, fallback: '-' })
    const outputAmountStr = formatDisplayNumber(outputAmount, { significantDigits: 6, fallback: '-' })

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
        swap: {
          inputAmount: inputAmount.quotient.toString(),
          outputAmount: outputAmount.quotient.toString(),
          inputDecimals: inputAmount.currency.decimals,
          outputDecimals: outputAmount.currency.decimals,
          recipient: recipient || account || '',
        },
        tokenAmountIn: inputAmountStr,
        tokenAmountOut: outputAmountStr,
        tokenAmountInDisplay: displayTypedValue || inputAmountStr,
        tokenAmountOutDisplay: displayOutputAmount,
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
          isSmartSettlement: Boolean(isSmartSettlement),
        },
      } as TransactionExtraInfo2Token,
    }
  }, [
    account,
    allowedSlippage,
    chainId,
    inputAmount,
    isPermitSwap,
    isSmartSettlement,
    networkInfo.name,
    outputAmount,
    priceImpact,
    recipient,
    recipientAddressOrName,
    routeSummary,
    searchParams,
    displayTypedValue,
    displayOutputAmount,
  ])

  const executeSwap = useCallback(
    async (routerAddress: string | undefined, encodedSwapData: string | undefined, onRequestSignature?: () => void) => {
      if (!account || !inputAmount || !routerAddress || !encodedSwapData) {
        throw new Error('Missing dependencies')
      }

      const swapData = getSwapData()
      const value = swapTxValue(inputAmount)

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
        gasLimitMarginBps: isSmartSettlement ? 5_000 : undefined,
        swap: { isSmartSettlement: Boolean(isSmartSettlement) },
        onRequestSignature,
      })
      if (response?.hash === undefined) throw new Error('sendTransaction returned undefined.')

      // The transaction is on-chain by now; it is recorded before anything that can still throw.
      const extraInfo: TransactionExtraInfo = swapData.extraInfo
      addTransactionWithType({
        ...swapData,
        hash: response.hash,
        // Read back by the `Swap Completed` updater, which checks the mined tx for the list.
        extraInfo: { ...extraInfo, arbitrary: { ...extraInfo.arbitrary, accessList: response.accessList } },
      })
      if (response.accessList?.rejectedByWallet) {
        trackingHandler(TRACKING_EVENT_TYPE.ACCESS_LIST_REJECTED, { wallet: walletKey, chain: networkInfo.name })
      }
      return response.hash
    },
    [
      account,
      chainId,
      getSwapData,
      addTransactionWithType,
      inputAmount,
      walletKey,
      isSmartConnector,
      isSmartSettlement,
      trackingHandler,
      networkInfo.name,
    ],
  )

  return executeSwap
}

export default useSingleChainSwapExecution
