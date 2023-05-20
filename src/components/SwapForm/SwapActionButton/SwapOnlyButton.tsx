import { Currency, CurrencyAmount, Price } from '@kyberswap/ks-sdk-core'
import React, { useCallback, useMemo, useState } from 'react'

import SwapButtonWithPriceImpact from 'components/SwapForm/SwapActionButton/SwapButtonWithPriceImpact'
import SwapModal from 'components/SwapForm/SwapModal'
import { BuildRouteResult } from 'components/SwapForm/hooks/useBuildRoute'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useSwapCallbackV3 from 'hooks/useSwapCallbackV3'
import { Field } from 'state/swap/actions'
import { DetailedRouteSummary } from 'types/route'
import { toCurrencyAmount } from 'utils/currencyAmount'

const getFeeInfoForMixPanel = (routeSummary: DetailedRouteSummary | undefined) => {
  if (!routeSummary?.fee) {
    return undefined
  }

  return {
    chargeTokenIn: routeSummary.extraFee.chargeFeeBy === 'currency_in',
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
  const { mixpanelHandler } = useMixpanel({
    [Field.INPUT]: currencyIn,
    [Field.OUTPUT]: currencyOut,
  })
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

  const mixpanelSwapInit = () => {
    mixpanelHandler(MIXPANEL_TYPE.SWAP_INITIATED, {
      gasUsd: routeSummary?.gasUsd,
      inputAmount: routeSummary?.parsedAmountIn,
      priceImpact: routeSummary?.priceImpact,
      feeInfo: getFeeInfoForMixPanel(routeSummary),
    })
  }

  const handleClickSwapButton = () => {
    mixpanelSwapInit()

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

        mixpanelHandler(MIXPANEL_TYPE.SWAP_CONFIRMED, {
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
  }, [buildResult?.data, mixpanelHandler, routeSummary, swapCallback])

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
