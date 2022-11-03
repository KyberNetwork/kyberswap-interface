import { Currency, CurrencyAmount } from '@namgold/ks-sdk-core'
import JSBI from 'jsbi'

import { NETWORKS_INFO } from 'constants/networks'

/**
 * Given some token amount, return the max that can be spent of it
 * @param currencyAmount to return max of
 */
export function maxAmountSpend(currencyAmount?: CurrencyAmount<Currency>): CurrencyAmount<Currency> | undefined {
  if (!currencyAmount) return undefined
  if (currencyAmount.currency.isNative) {
    const minETHforGas = JSBI.BigInt(NETWORKS_INFO[currencyAmount.currency.chainId].nativeToken.minForGas)
    if (JSBI.greaterThan(currencyAmount.quotient, minETHforGas)) {
      return CurrencyAmount.fromRawAmount(currencyAmount.currency, JSBI.subtract(currencyAmount.quotient, minETHforGas))
    } else {
      return CurrencyAmount.fromRawAmount(currencyAmount.currency, JSBI.BigInt(0))
    }
  }

  return currencyAmount
}
