import { Fraction } from '@kyberswap/ks-sdk-core'
import { parseUnits } from 'ethers/lib/utils'
import JSBI from 'jsbi'

import { BIPS_BASE, RESERVE_USD_DECIMALS } from 'constants/index'
import { FeeConfig } from 'hooks/useSwapV2Callback'
import { Aggregator } from 'utils/aggregator'
import { formattedNum } from 'utils/index'

function toFixed(x: number): string {
  if (Math.abs(x) < 1.0) {
    const e = parseInt(x.toString().split('e-')[1])
    if (e) {
      x *= Math.pow(10, e - 1)
      return '0.' + '0'.repeat(e - 1) + x.toString().substring(2)
    }
  } else {
    let e = parseInt(x.toString().split('+')[1])
    if (e > 20) {
      e -= 20
      x /= Math.pow(10, e)
      return x.toString() + '0'.repeat(e)
    }
  }
  return x.toString()
}

/**
 * Get Fee Amount in a Trade (unit: USD)
 * @param trade
 * @param feeConfig
 */
export function getFormattedFeeAmountUsd(trade: Aggregator, feeConfig: FeeConfig | undefined) {
  if (feeConfig) {
    const amountInUsd = new Fraction(
      parseUnits(toFixed(trade.amountInUsd), RESERVE_USD_DECIMALS).toString(),
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(RESERVE_USD_DECIMALS)),
    )
    if (amountInUsd) {
      // feeAmount might < 1.
      const feeAmountFraction = new Fraction(
        parseUnits(feeConfig.feeAmount, RESERVE_USD_DECIMALS).toString(),
        JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(RESERVE_USD_DECIMALS)),
      )
      const feeAmountDecimal = feeAmountFraction.divide(BIPS_BASE)
      const feeAmountUsd = amountInUsd.multiply(feeAmountDecimal).toSignificant(RESERVE_USD_DECIMALS)
      return formattedNum(feeAmountUsd, true)
    }
  }

  return '--'
}
