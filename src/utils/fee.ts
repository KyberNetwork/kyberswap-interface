import { Currency, CurrencyAmount, Fraction } from '@kyberswap/ks-sdk-core'
import { parseUnits } from 'ethers/lib/utils'
import JSBI from 'jsbi'
import { BuildRouteData } from 'services/route/types/buildRoute'

import { BIPS_BASE, RESERVE_USD_DECIMALS } from 'constants/index'
import { DetailedRouteSummary } from 'types/route'
import { formattedNum } from 'utils/index'

export const calculateFeeFromBuildData = (
  routeSummary: DetailedRouteSummary | undefined,
  buildData: BuildRouteData | undefined,
): {
  feeAmount: string
  feeAmountUsd: string
  currency?: Currency
} => {
  if (!routeSummary || !buildData || !routeSummary.extraFee.chargeFeeBy || !routeSummary.extraFee.feeAmount) {
    return {
      feeAmount: '',
      feeAmountUsd: '',
    }
  }

  const feeBips = routeSummary.extraFee.feeAmount

  const currencyAmountIn = CurrencyAmount.fromRawAmount(routeSummary.parsedAmountIn.currency, buildData.amountIn)
  const currencyAmountOut = CurrencyAmount.fromRawAmount(routeSummary.parsedAmountOut.currency, buildData.amountOut)

  const currencyAmountToTakeFee =
    routeSummary.extraFee.chargeFeeBy === 'currency_in' ? currencyAmountIn : currencyAmountOut

  const feeAmountFraction = new Fraction(
    parseUnits(feeBips, RESERVE_USD_DECIMALS).toString(),
    JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(RESERVE_USD_DECIMALS)),
  ).divide(BIPS_BASE)

  const fee = currencyAmountToTakeFee.multiply(feeAmountFraction).toSignificant(RESERVE_USD_DECIMALS)
  const feeUsd = buildData.feeUsd

  return {
    feeAmount: formattedNum(fee, false),
    feeAmountUsd: feeUsd && feeUsd !== '0' ? formattedNum(feeUsd, true, 4) : '',
    currency: currencyAmountToTakeFee.currency,
  }
}
