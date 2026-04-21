import { Currency, CurrencyAmount, Fraction, Price } from '@kyberswap/ks-sdk-core'
import JSBI from 'jsbi'

/** @deprecated use formatDisplayNumber instead */
export function formatCurrencyAmount(amount: CurrencyAmount<Currency> | undefined, sigFigs: number) {
  if (!amount) {
    return '-'
  }

  if (JSBI.equal(amount.quotient, JSBI.BigInt(0))) {
    return '0'
  }

  if (amount.divide(amount.decimalScale).lessThan(new Fraction(1, 100000))) {
    return '<0.00001'
  }

  return amount.toSignificant(sigFigs)
}

/** @deprecated use formatDisplayNumber instead */
export function toSignificantOrMaxIntegerPart(price: Price<Currency, Currency> | undefined, sigFigs: number): string {
  if (!price) return ''

  const n = price.toSignificant(18).split('.')[0].length
  if (n > sigFigs) return price.toSignificant(n)

  return price.toSignificant(sigFigs)
}
