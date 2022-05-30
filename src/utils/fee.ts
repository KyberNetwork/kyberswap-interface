import { CurrencyAmount, Fraction, JSBI, ONE } from '@dynamic-amm/sdk'
import { FeeConfig } from 'hooks/useSwapV2Callback'
import { BIPS_BASE, RESERVE_USD_DECIMALS } from 'constants/index'
import { Aggregator } from 'utils/aggregator'
import { formattedNum } from 'utils/index'
import { parseUnits } from 'ethers/lib/utils'

export function getAmountMinusFeeQuotient(amount: CurrencyAmount | string, feeConfig: FeeConfig | undefined): string {
  let amountMinusFee = new Fraction(typeof amount === 'string' ? amount : amount.raw, ONE)

  if (feeConfig) {
    if (feeConfig.isInBps) {
      // feeAmount might < 1.
      const feeAmountFraction = new Fraction(
        parseUnits(feeConfig.feeAmount, RESERVE_USD_DECIMALS).toString(),
        JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(RESERVE_USD_DECIMALS)),
      )
      const feeAmountDecimal = feeAmountFraction.divide(BIPS_BASE)
      amountMinusFee = amountMinusFee.multiply(new Fraction(ONE).subtract(feeAmountDecimal))
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
      // feeAmount might < 1.
      const feeAmountFraction = new Fraction(
        parseUnits(feeConfig.feeAmount, RESERVE_USD_DECIMALS).toString(),
        JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(RESERVE_USD_DECIMALS)),
      )
      const feeAmountDecimal = feeAmountFraction.divide(BIPS_BASE)
      amountPlusFee = amountPlusFee.divide(new Fraction(ONE).subtract(feeAmountDecimal))
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
    const amountInUsd = new Fraction(
      parseUnits(trade.amountInUsd.toString(), RESERVE_USD_DECIMALS).toString(),
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(RESERVE_USD_DECIMALS)),
    )
    // feeAmount might < 1.
    const feeAmountFraction = new Fraction(
      parseUnits(feeConfig.feeAmount, RESERVE_USD_DECIMALS).toString(),
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(RESERVE_USD_DECIMALS)),
    )
    const feeAmountDecimal = feeAmountFraction.divide(BIPS_BASE)
    if (amountInUsd) {
      const feeAmountUsd = amountInUsd.multiply(feeAmountDecimal).toSignificant(RESERVE_USD_DECIMALS)
      return formattedNum(feeAmountUsd, true)
    }
  }

  return '--'
}
