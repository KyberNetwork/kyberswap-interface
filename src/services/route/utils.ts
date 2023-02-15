import { Currency, Price } from '@kyberswap/ks-sdk-core'

import { DetailedRouteSummary } from 'types/route'
import { toCurrencyAmount } from 'utils/currencyAmount'

import { GetRouteData } from './types/getRoute'

export const calculatePriceImpact = (amountInUsd: number, amountOutUsd: number) => {
  const priceImpact = !amountOutUsd ? -1 : ((amountInUsd - amountOutUsd) * 100) / amountInUsd
  return priceImpact
}

export const parseGetRouteResponse = (
  rawData: GetRouteData,
  currencyIn: Currency,
  currencyOut: Currency,
): {
  routeSummary: DetailedRouteSummary | undefined
  routerAddress: string
  fromMeta: boolean
} => {
  if (!rawData.routeSummary) {
    return {
      routeSummary: undefined,
      routerAddress: rawData.routerAddress,
      fromMeta: rawData.fromMeta,
    }
  }

  const rawRouteSummary = rawData.routeSummary
  const parsedAmountIn = toCurrencyAmount(currencyIn, rawRouteSummary.amountIn)
  const parsedAmountOut = toCurrencyAmount(currencyOut, rawRouteSummary.amountOut)
  const executionPrice = new Price(
    parsedAmountIn.currency,
    parsedAmountOut.currency,
    parsedAmountIn.quotient,
    parsedAmountOut.quotient,
  )

  const routeSummary: DetailedRouteSummary = {
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
