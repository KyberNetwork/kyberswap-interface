import { CurrencyAmount, Fraction, ONE } from '@dynamic-amm/sdk'
import { FeeConfig } from 'hooks/useSwapV2Callback'
import { BIPS_BASE } from 'constants/index'

export function getAmountMinusFeeInQuotient(amount: CurrencyAmount, feeConfig: FeeConfig | undefined): string {
  let amountInMinusFeeIn = new Fraction(amount.raw, ONE)
  if (feeConfig && feeConfig.chargeFeeBy === 'currency_in') {
    if (feeConfig.isInBps) {
      const feeAmountFraction = new Fraction(feeConfig.feeAmount, BIPS_BASE)
      amountInMinusFeeIn = amountInMinusFeeIn.multiply(new Fraction(ONE).subtract(feeAmountFraction))
    } else {
      amountInMinusFeeIn = amountInMinusFeeIn.subtract(feeConfig.feeAmount)
    }
  }

  return amountInMinusFeeIn.quotient.toString()
}

export function getAmountInPlusFeeInQuotient(amount: CurrencyAmount, feeConfig: FeeConfig | undefined) {
  let amountInPlusFeeIn = new Fraction(amount.raw.toString(), ONE)
  if (feeConfig && feeConfig.chargeFeeBy === 'currency_in') {
    if (feeConfig.isInBps) {
      const feeAmountFraction = new Fraction(feeConfig.feeAmount, BIPS_BASE)
      amountInPlusFeeIn = amountInPlusFeeIn.divide(new Fraction(ONE).subtract(feeAmountFraction))
    } else {
      amountInPlusFeeIn = amountInPlusFeeIn.add(feeConfig.feeAmount)
    }
  }

  return amountInPlusFeeIn.quotient.toString()
}
