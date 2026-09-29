import { JSBI } from '@kyberswap/ks-sdk-classic'
import { Currency, CurrencyAmount, Fraction, Price } from '@kyberswap/ks-sdk-core'
import { GetRouteData, RouteSummary } from 'services/route/types/getRoute'

import { getRouteTokenAddressParam } from 'components/SwapForm/hooks/useGetRoute'
import { BIPS_BASE, RESERVE_USD_DECIMALS } from 'constants/trade'
import { ChargeFeeBy, DetailedRouteSummary } from 'types/route'
import { toCurrencyAmount } from 'utils/currencyAmount'
import { RouteSide, amountFromRoute } from 'utils/nativeErc20'
import { formatDisplayNumber } from 'utils/numbers'
import { parseUnits } from 'utils/viem'

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
  const feeSide: RouteSide = routeSummary.extraFee.chargeFeeBy === ChargeFeeBy.CURRENCY_IN ? 'in' : 'out'
  const feeCurrencyAmount = routeSummary.extraFee.isInBps
    ? currencyAmountToTakeFee.multiply(feeAmountFraction)
    : // A flat fee comes back in the units that side was quoted in, so it needs the same read-back
      // as the amounts do.
      CurrencyAmount.fromRawAmount(
        currencyAmountToTakeFee.currency,
        amountFromRoute(routeSummary.extraFee.feeAmount, currencyAmountToTakeFee.currency, feeSide),
      )

  const feeAmountUsd = routeSummary.extraFee.feeAmountUsd
  return {
    currency: currencyAmountToTakeFee.currency,
    currencyAmount: feeCurrencyAmount,
    formattedAmount: formatDisplayNumber(feeCurrencyAmount, { significantDigits: 6 }),
    formattedAmountUsd:
      feeAmountUsd && feeAmountUsd !== '0'
        ? formatDisplayNumber(feeAmountUsd, { style: 'currency', significantDigits: 4 })
        : '',
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
    rawRouteSummary.tokenIn.toLowerCase() === getRouteTokenAddressParam(currencyIn, 'in').toLowerCase() &&
    rawRouteSummary.tokenOut.toLowerCase() === getRouteTokenAddressParam(currencyOut, 'out').toLowerCase()

  if (!isValidPair) return defaultValue

  // The aggregator echoes each amount in the interface it was asked about, so a side sent as the
  // native interface comes back in native units and has to be read back into the currency's own.
  const parsedAmountIn = toCurrencyAmount(currencyIn, amountFromRoute(rawRouteSummary.amountIn, currencyIn, 'in'))
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
    isSmartSettlement: rawRouteSummary.route?.some(route => route.some(swap => Boolean(swap.extra?._ce))) ?? false,
    routerAddress: rawData.routerAddress,
  }

  return {
    routeSummary,
    routerAddress: rawData.routerAddress,
    fromMeta: rawData.fromMeta,
  }
}
