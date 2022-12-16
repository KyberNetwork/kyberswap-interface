import { Currency, CurrencyAmount, Price, TokenAmount } from '@kyberswap/ks-sdk-core'
import JSBI from 'jsbi'

import { RouteSummary } from 'types/metaAggregator'

import { RawRouteSummary, Response } from './types'

const toCurrencyAmount = function (currency: Currency, value: string | number): CurrencyAmount<Currency> {
  try {
    return TokenAmount.fromRawAmount(currency, JSBI.BigInt(value))
  } catch (e) {
    return TokenAmount.fromRawAmount(currency, 0)
  }
}

const calculatePriceImpact = (amountInUsd: number, amountOutUsd: number) => {
  const priceImpact = !amountOutUsd ? -1 : ((amountInUsd - amountOutUsd) * 100) / amountInUsd
  return priceImpact
}

export const convertRawResponse = (
  rawData: Response,
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
  }

  return {
    routeSummary,
    routerAddress: rawData.routerAddress,
    fromMeta: rawData.fromMeta,
  }
}

export const getRawRouteSummary = (data: RouteSummary): RawRouteSummary => {
  // remove fields that are added in the function above
  const { parsedAmountIn, parsedAmountOut, priceImpact, executionPrice, ...rawData } = data
  return rawData as RawRouteSummary
}
