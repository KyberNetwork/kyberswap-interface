import { Currency, CurrencyAmount, Fraction, Percent, TokenAmount } from '@kyberswap/ks-sdk-core'
import JSBI from 'jsbi'

import { basisPointsToPercent } from 'utils'

export const minimumAmountAfterSlippage = (amount: CurrencyAmount<Currency>, slippage: number | Percent) => {
  const slippagePercent = typeof slippage === 'number' ? basisPointsToPercent(slippage) : slippage

  const slippageAdjustedAmount = new Fraction(amount.quotient).multiply(
    new Fraction(JSBI.BigInt(1)).subtract(slippagePercent),
  ).quotient
  return TokenAmount.fromRawAmount(amount.currency, slippageAdjustedAmount)
}

export const toCurrencyAmount = function (currency: Currency, value: string | number): CurrencyAmount<Currency> {
  try {
    return TokenAmount.fromRawAmount(currency, JSBI.BigInt(value))
  } catch (e) {
    return TokenAmount.fromRawAmount(currency, 0)
  }
}
