import { Currency, CurrencyAmount, Fraction, TokenAmount } from '@kyberswap/ks-sdk-core'
import JSBI from 'jsbi'

import { basisPointsToPercent } from 'utils'

export const toCurrencyAmount = function (currency: Currency, value: string | number): CurrencyAmount<Currency> {
  try {
    return TokenAmount.fromRawAmount(currency, JSBI.BigInt(value))
  } catch (e) {
    return TokenAmount.fromRawAmount(currency, 0)
  }
}

export const calculateMinimumAmountOut = (
  currency: Currency,
  value: string | number,
  slippage: number,
): CurrencyAmount<Currency> => {
  const pct = basisPointsToPercent(slippage)
  const regularAmountOut = toCurrencyAmount(currency, value)

  const slippageAdjustedAmountOut = new Fraction(JSBI.BigInt(1))
    .add(pct)
    .invert()
    .multiply(regularAmountOut.quotient).quotient

  return TokenAmount.fromRawAmount(regularAmountOut.currency, slippageAdjustedAmountOut)
}
