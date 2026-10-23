import { Price } from '@kyberswap/ks-sdk-core'
import type { BuildRouteData } from 'services/route/types/buildRoute'

import { ChargeFeeBy, DetailedRouteSummary } from 'types/route'
import { toCurrencyAmount } from 'utils/currencyAmount'

export const getFeeInfoForMixPanel = (routeSummary: DetailedRouteSummary | undefined) => {
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

export const getSwapConfirmedTracking = (build: BuildRouteData, routeSummary: DetailedRouteSummary | undefined) => {
  let outputAmountDescription = ''
  const { amountOut, outputChange } = build
  const percent = outputChange?.percent

  if (percent !== undefined) {
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
    const { amountIn, amountOut } = build
    const parsedAmountIn = toCurrencyAmount(routeSummary.parsedAmountIn.currency, amountIn)
    const parsedAmountOut = toCurrencyAmount(routeSummary.parsedAmountOut.currency, amountOut)
    const executionPrice = new Price(
      parsedAmountIn.currency,
      parsedAmountOut.currency,
      parsedAmountIn.quotient,
      parsedAmountOut.quotient,
    )
    const inputSymbol = executionPrice.baseCurrency.symbol
    const outputSymbol = executionPrice.quoteCurrency.symbol
    const formattedPrice = executionPrice.toSignificant(6)
    currentPrice = `1 ${inputSymbol} = ${formattedPrice} ${outputSymbol}`
  }

  return {
    gasUsd: routeSummary?.gasUsd,
    inputAmount: routeSummary?.parsedAmountIn,
    priceImpact: routeSummary?.priceImpact,
    outputAmountDescription,
    currentPrice,
    feeInfo: getFeeInfoForMixPanel(routeSummary),
  }
}
