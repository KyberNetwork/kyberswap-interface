import { Fraction } from '@kyberswap/ks-sdk-core'
import { parseUnits } from 'ethers/lib/utils'
import JSBI from 'jsbi'

import { BIPS_BASE, RESERVE_USD_DECIMALS } from 'constants/index'
import { formattedNum } from 'utils'
import { toFixed } from 'utils/numbers'

export const isInvalidPriceImpact = (priceImpact?: number) => priceImpact === -1
export const isHighPriceImpact = (priceImpact?: number) => !!priceImpact && priceImpact > 5
export const isVeryHighPriceImpact = (priceImpact?: number) => !!priceImpact && priceImpact > 15

export const getFormattedFeeAmountUsd = (rawAmountInUSD: number, feeAmount?: string) => {
  if (feeAmount) {
    const amountInUsd = new Fraction(
      parseUnits(toFixed(rawAmountInUSD), RESERVE_USD_DECIMALS).toString(),
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(RESERVE_USD_DECIMALS)),
    )
    if (amountInUsd) {
      // feeAmount might < 1.
      const feeAmountFraction = new Fraction(
        parseUnits(feeAmount, RESERVE_USD_DECIMALS).toString(),
        JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(RESERVE_USD_DECIMALS)),
      )
      const feeAmountDecimal = feeAmountFraction.divide(BIPS_BASE)
      const feeAmountUsd = amountInUsd.multiply(feeAmountDecimal).toSignificant(RESERVE_USD_DECIMALS)
      return formattedNum(feeAmountUsd, true)
    }
  }

  return '--'
}
