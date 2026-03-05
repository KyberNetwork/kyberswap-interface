import { Currency, CurrencyAmount, Price } from '@kyberswap/ks-sdk-core'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import SwapButtonWithPriceImpact from 'components/SwapForm/SwapActionButton/SwapButtonWithPriceImpact'
import SwapModal from 'components/SwapForm/SwapModal'
import { BuildRouteResult } from 'components/SwapForm/hooks/useBuildRoute'
import { useActiveWeb3React } from 'hooks'
import useSwapCallbackV3 from 'hooks/useSwapCallbackV3'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { Field } from 'state/swap/actions'
import { usePaymentToken, useUserSlippageTolerance, useUserTransactionTTL } from 'state/user/hooks'
import { ChargeFeeBy, DetailedRouteSummary } from 'types/route'
import { minimumAmountAfterSlippage, toCurrencyAmount } from 'utils/currencyAmount'

const getFeeInfoForMixPanel = (routeSummary: DetailedRouteSummary | undefined) => {
  if (!routeSummary?.fee) {
    return undefined
  }

  return {
    chargeTokenIn: routeSummary.extraFee.chargeFeeBy === ChargeFeeBy.CURRENCY_IN,
    tokenSymbol: routeSummary.fee.currency.symbol || '',
    feeUsd: routeSummary.extraFee.feeAmountUsd,
    feeAmount: routeSummary.fee.currencyAmount.toExact(),
  }
}

export type Props = {
  minimal?: boolean
  isDegenMode: boolean
  routeSummary: DetailedRouteSummary | undefined
  isGettingRoute: boolean
  isProcessingSwap: boolean
  isApproved?: boolean

  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  balanceIn: CurrencyAmount<Currency> | undefined
  balanceOut: CurrencyAmount<Currency> | undefined
  parsedAmount: CurrencyAmount<Currency> | undefined
  isPermitSwap?: boolean

  setProcessingSwap: React.Dispatch<React.SetStateAction<boolean>>
  setErrorWhileSwap: (e: string) => void
  buildRoute: () => Promise<BuildRouteResult>
}

const SwapOnlyButton: React.FC<Props> = ({
  minimal,
  routeSummary,
  isGettingRoute,
  isProcessingSwap,
  isApproved,

  currencyIn,
  currencyOut,
  balanceIn,
  balanceOut,
  parsedAmount,
  isPermitSwap,

  setProcessingSwap,
  setErrorWhileSwap,
  buildRoute,
}) => {
  const { trackingHandler } = useTracking({
    [Field.INPUT]: currencyIn,
    [Field.OUTPUT]: currencyOut,
  })
  const { networkInfo } = useActiveWeb3React()
  const [transactionTimeout] = useUserTransactionTTL()
  const [paymentToken] = usePaymentToken()
  const [buildResult, setBuildResult] = useState<BuildRouteResult>()
  const [isBuildingRoute, setBuildingRoute] = useState(false)
  const { priceImpact } = routeSummary || {}

  // the callback to execute the swap
  const swapCallback = useSwapCallbackV3(isPermitSwap)
  const userHasSpecifiedInputOutput = Boolean(currencyIn && currencyOut && parsedAmount)
  const showLoading = isGettingRoute || isBuildingRoute || ((!balanceIn || !balanceOut) && userHasSpecifiedInputOutput)

  const handleClickSwapForNormalMode = async () => {
    if (!swapCallback || isBuildingRoute) {
      return
    }

    setProcessingSwap(true)
    // dismiss the modal will setProcessingSwap to false

    setBuildingRoute(true)
    setBuildResult(undefined)
    const result = await buildRoute()
    setBuildingRoute(false)
    setBuildResult(result)
  }

  const getTokenAddress = (currency: Currency | undefined) =>
    currency?.isNative ? 'NATIVE' : currency?.wrapped?.address

  const getRouteDexes = () => [...new Set(routeSummary?.route?.flat().map(r => r.exchange) || [])]

  const trackingSwapInit = () => {
    const minReceived = routeSummary?.parsedAmountOut
      ? minimumAmountAfterSlippage(routeSummary.parsedAmountOut, slippage)?.toSignificant(6)
      : undefined

    trackingHandler(TRACKING_EVENT_TYPE.SWAP_INITIATED, {
      gasUsd: routeSummary?.gasUsd,
      inputAmount: routeSummary?.parsedAmountIn,
      priceImpact: routeSummary?.priceImpact,
      feeInfo: getFeeInfoForMixPanel(routeSummary),
      from_token_address: getTokenAddress(currencyIn),
      to_token_address: getTokenAddress(currencyOut),
      pair: `${currencyIn?.symbol}/${currencyOut?.symbol}`,
      amount_in_usd: routeSummary?.amountInUsd,
      amount_out_estimated: routeSummary?.parsedAmountOut?.toSignificant(6),
      amount_out_usd: routeSummary?.amountOutUsd,
      minimum_received: minReceived,
      rate: routeSummary?.executionPrice?.toSignificant(6),
      transaction_time_limit: transactionTimeout / 60,
      gas_token: paymentToken?.symbol || networkInfo.nativeToken.symbol,
      trade_route_dexes: getRouteDexes(),
      trade_route_steps: routeSummary?.route?.length,
      route_split: (routeSummary?.route?.length || 0) > 1,
      chain: networkInfo.name,
      volume: routeSummary?.amountInUsd ? Number(routeSummary.amountInUsd) : undefined,
    })
  }

  const [slippage] = useUserSlippageTolerance()

  useEffect(() => {
    if (Boolean(buildResult) && isProcessingSwap) handleClickSwapForNormalMode()
    // eslint-disable-next-line
  }, [slippage])

  const handleClickSwapButton = () => {
    trackingHandler(TRACKING_EVENT_TYPE.SWAP_REVIEW_OPENED, {
      from_token: currencyIn?.symbol,
      from_token_address: getTokenAddress(currencyIn),
      to_token: currencyOut?.symbol,
      to_token_address: getTokenAddress(currencyOut),
      amount_in: routeSummary?.parsedAmountIn?.toSignificant(6),
      amount_in_usd: routeSummary?.amountInUsd ? Number(routeSummary.amountInUsd) : undefined,
      amount_out: routeSummary?.parsedAmountOut?.toSignificant(6),
      amount_out_usd: routeSummary?.amountOutUsd ? Number(routeSummary.amountOutUsd) : undefined,
      rate: routeSummary?.executionPrice
        ? `1 ${currencyIn?.symbol} = ${routeSummary.executionPrice.toSignificant(6)} ${currencyOut?.symbol}`
        : undefined,
      minimum_received: routeSummary?.parsedAmountOut
        ? minimumAmountAfterSlippage(routeSummary.parsedAmountOut, slippage)?.toSignificant(6)
        : undefined,
      price_impact: routeSummary?.priceImpact
        ? routeSummary.priceImpact > 0.01
          ? `${routeSummary.priceImpact.toFixed(2)}%`
          : '<0.01%'
        : undefined,
      max_slippage: slippage ? slippage / 100 : 0,
      trade_route_dexes: getRouteDexes(),
      chain: networkInfo.name,
    })

    trackingSwapInit()

    setErrorWhileSwap('')

    handleClickSwapForNormalMode()
  }

  const swapCallbackForModal = useMemo(() => {
    if (buildResult?.data?.data && buildResult?.data?.routerAddress && swapCallback) {
      return () => {
        let outputAmountDescription = ''
        if (buildResult.data?.amountOut !== undefined && buildResult.data?.outputChange?.percent !== undefined) {
          const amountOut = buildResult.data?.amountOut
          const percent = buildResult.data?.outputChange?.percent
          if (percent === 0) {
            outputAmountDescription = 'Unchanged'
          } else if (percent > 0) {
            outputAmountDescription = 'New output amt is better than initial output amt'
          } else if (percent > -1) {
            outputAmountDescription = `New output amt is ${amountOut} to < 1% worse than initial output amt`
          } else if (percent >= -5) {
            outputAmountDescription = `New output amt is ${amountOut} to >= 1% to <= 5% worse than initial output amt`
          } else {
            outputAmountDescription = `New output amt is ${amountOut} to > 5% worse than initial output amt`
          }
        }

        let currentPrice = ''
        if (routeSummary !== undefined) {
          const { amountIn, amountOut } = buildResult.data
          const parsedAmountIn = toCurrencyAmount(routeSummary.parsedAmountIn.currency, amountIn)
          const parsedAmountOut = toCurrencyAmount(routeSummary.parsedAmountOut.currency, amountOut)
          const executionPrice = new Price(
            parsedAmountIn.currency,
            parsedAmountOut.currency,
            parsedAmountIn.quotient,
            parsedAmountOut.quotient,
          )
          const inputSymbol = executionPrice.baseCurrency?.symbol
          const outputSymbol = executionPrice.quoteCurrency?.symbol
          const formattedPrice = executionPrice?.toSignificant(6)
          currentPrice = `1 ${inputSymbol} = ${formattedPrice} ${outputSymbol}`
        }

        trackingHandler(TRACKING_EVENT_TYPE.SWAP_CONFIRMED, {
          gasUsd: routeSummary?.gasUsd,
          inputAmount: routeSummary?.parsedAmountIn,
          priceImpact: routeSummary?.priceImpact,
          outputAmountDescription,
          currentPrice,
          feeInfo: getFeeInfoForMixPanel(routeSummary),
        })

        return swapCallback(buildResult.data.routerAddress, buildResult.data.data)
      }
    }

    return undefined
  }, [buildResult?.data, trackingHandler, routeSummary, swapCallback])

  const onDismissModal = useCallback(() => {
    setProcessingSwap(false)
  }, [setProcessingSwap])

  return (
    <>
      <SwapButtonWithPriceImpact
        isProcessingSwap={isProcessingSwap}
        route={routeSummary}
        onClick={handleClickSwapButton}
        isApproved={!!isApproved}
        minimal={!!minimal}
        showLoading={showLoading}
        priceImpact={priceImpact}
        showNoteGetRoute={!routeSummary}
      />
      <SwapModal
        isOpen={isProcessingSwap}
        tokenAddToMetaMask={currencyOut}
        buildResult={buildResult}
        isBuildingRoute={isBuildingRoute}
        onDismiss={onDismissModal}
        swapCallback={swapCallbackForModal}
      />
    </>
  )
}

export default SwapOnlyButton
