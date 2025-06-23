import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import JSBI from 'jsbi'

/**
 * Given some token amount, return the max that can be spent of it
 * @param currencyAmount to return max of
 */
export function maxAmountSpend(currencyAmount?: CurrencyAmount<Currency>): CurrencyAmount<Currency> | undefined {
  if (!currencyAmount) return undefined
  if (currencyAmount.currency.isNative) {
    return currencyAmount
  }

  return currencyAmount
}

export function halfAmountSpend(currencyAmount?: CurrencyAmount<Currency>): CurrencyAmount<Currency> | undefined {
  if (!currencyAmount) return undefined
  const halfSpend = JSBI.divide(currencyAmount.quotient, JSBI.BigInt(2))

  return CurrencyAmount.fromRawAmount(currencyAmount.currency, halfSpend)
}
