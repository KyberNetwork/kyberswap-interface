import { JSBI } from '@kyberswap/ks-sdk-classic'
import { Currency, CurrencyAmount, Fraction, Price } from '@kyberswap/ks-sdk-core'
import { parseUnits } from 'ethers/lib/utils'

import { getRouteTokenAddressParam } from 'components/SwapForm/hooks/useGetRoute'
import { BIPS_BASE, RESERVE_USD_DECIMALS } from 'constants/index'
import { ChargeFeeBy, DetailedRouteSummary } from 'types/route'
import { formattedNum } from 'utils'
import { toCurrencyAmount } from 'utils/currencyAmount'

import { GetRouteData, RouteSummary } from './types/getRoute'

const calculateFee = (
  parsedAmountIn: CurrencyAmount<Currency>,
  parsedAmountOut: CurrencyAmount<Currency>,
  routeSummary: RouteSummary,
): DetailedRouteSummary['fee'] => {
  if (!routeSummary.extraFee?.chargeFeeBy || !routeSummary.extraFee?.feeAmount) {
    return undefined
  }

  const currencyAmountToTakeFee =
    routeSummary.extraFee.chargeFeeBy === ChargeFeeBy.CURRENCY_IN ? parsedAmountIn : parsedAmountOut
  const feeAmountFraction = new Fraction(
    parseUnits(routeSummary.extraFee.feeAmount, RESERVE_USD_DECIMALS).toString(),
    JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(RESERVE_USD_DECIMALS)),
  ).divide(BIPS_BASE)
  const feeCurrencyAmount = currencyAmountToTakeFee.multiply(feeAmountFraction)

  const feeAmountUsd = routeSummary.extraFee.feeAmountUsd
  return {
    currency: currencyAmountToTakeFee.currency,
    currencyAmount: feeCurrencyAmount,
    formattedAmount: formattedNum(feeCurrencyAmount.toSignificant(RESERVE_USD_DECIMALS), false),
    formattedAmountUsd: feeAmountUsd && feeAmountUsd !== '0' ? formattedNum(feeAmountUsd, true, 4) : '',
  }
}

export const calculatePriceImpact = (amountInUsd: number, amountOutUsd: number) => {
  const priceImpact = !amountOutUsd ? NaN : ((amountInUsd - amountOutUsd) * 100) / amountInUsd
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
  const defaultValue = {
    routeSummary: undefined,
    routerAddress: rawData.routerAddress,
    fromMeta: rawData.fromMeta,
  }

  const rawRouteSummary = rawData.routeSummary
  if (!rawRouteSummary) {
    return defaultValue
  }

  const isValidPair =
    rawRouteSummary.tokenIn.toLowerCase() === getRouteTokenAddressParam(currencyIn).toLowerCase() &&
    rawRouteSummary.tokenOut.toLowerCase() === getRouteTokenAddressParam(currencyOut).toLowerCase()

  if (!isValidPair) return defaultValue

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
    fee: calculateFee(parsedAmountIn, parsedAmountOut, rawRouteSummary),
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
