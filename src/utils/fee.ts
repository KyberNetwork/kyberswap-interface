import { CurrencyAmount, Fraction, ONE } from '@dynamic-amm/sdk'
import { FeeConfig } from 'hooks/useSwapV2Callback'
import { BIPS_BASE } from 'constants/index'
import { Aggregator } from 'utils/aggregator'
import { tryParseAmount } from 'state/swap/hooks'
import { formattedNum } from 'utils/index'

export function getAmountMinusFeeQuotient(amount: CurrencyAmount | string, feeConfig: FeeConfig | undefined): string {
  let amountMinusFee = new Fraction(typeof amount === 'string' ? amount : amount.raw, ONE)

  if (feeConfig) {
    if (feeConfig.isInBps) {
      const feeAmountFraction = new Fraction(feeConfig.feeAmount, BIPS_BASE)
      amountMinusFee = amountMinusFee.multiply(new Fraction(ONE).subtract(feeAmountFraction))
    } else {
      amountMinusFee = amountMinusFee.subtract(feeConfig.feeAmount)
    }
  }

  return amountMinusFee.quotient.toString()
}

export function getAmountPlusFeeInQuotient(amount: CurrencyAmount | string, feeConfig: FeeConfig | undefined) {
  let amountPlusFee = new Fraction(typeof amount === 'string' ? amount : amount.raw, ONE)

  if (feeConfig) {
    if (feeConfig.isInBps) {
      const feeAmountFraction = new Fraction(feeConfig.feeAmount, BIPS_BASE)
      amountPlusFee = amountPlusFee.divide(new Fraction(ONE).subtract(feeAmountFraction))
    } else {
      amountPlusFee = amountPlusFee.add(feeConfig.feeAmount)
    }
  }

  return amountPlusFee.quotient.toString()
}

/**
 * Get Fee Amount in a Trade (unit: USD)
 * @param trade
 * @param feeConfig
 */
export function getFormattedFeeAmountUsd(trade: Aggregator, feeConfig: FeeConfig | undefined) {
  if (feeConfig) {
    const amountInUsd = tryParseAmount(trade.amountInUsd.toString(), trade.inputAmount.currency)
    const feeAmountDecimal = new Fraction(feeConfig.feeAmount, BIPS_BASE)
    if (amountInUsd) {
      const feeAmountUsd = amountInUsd.multiply(feeAmountDecimal).toSignificant(18)
      return formattedNum(feeAmountUsd, true)
    }
  }

  return '--'
}
