import { Currency, Price } from '@kyberswap/ks-sdk-core'

import { RouteSummary } from 'types/metaAggregator'
import { toCurrencyAmount } from 'utils/currencyAmount'

import { RawRouteSummary, RouteData } from './types'

export const calculatePriceImpact = (amountInUsd: number, amountOutUsd: number) => {
  const priceImpact = !amountOutUsd ? -1 : ((amountInUsd - amountOutUsd) * 100) / amountInUsd
  return priceImpact
}

export const convertRawResponse = (
  rawData: RouteData,
  currencyIn: Currency,
  currencyOut: Currency,
): {
  routeSummary: RouteSummary
  routerAddress: string
  fromMeta: boolean
} => {
  const rawRouteSummary = rawData.routeSummary
  const parsedAmountIn = toCurrencyAmount(currencyIn, rawRouteSummary.amountIn)
  const parsedAmountOut = toCurrencyAmount(currencyOut, rawRouteSummary.amountOut)
  const executionPrice = new Price(
    parsedAmountIn.currency,
    parsedAmountOut.currency,
    parsedAmountIn.quotient,
    parsedAmountOut.quotient,
  )

  const routeSummary: RouteSummary = {
    ...rawRouteSummary,
    parsedAmountIn,
    parsedAmountOut,
    priceImpact: calculatePriceImpact(Number(rawRouteSummary.amountInUsd), Number(rawRouteSummary.amountOutUsd)),
    executionPrice,
    routerAddress: rawData.routerAddress,
  }

  return {
    routeSummary,
    routerAddress: rawData.routerAddress,
    fromMeta: rawData.fromMeta,
  }
}

export const getRawRouteSummary = (data: RouteSummary): RawRouteSummary => {
  // remove fields that are added in the function above
  const { parsedAmountIn, parsedAmountOut, priceImpact, executionPrice, routerAddress, ...rawData } = data
  return rawData as RawRouteSummary
}
