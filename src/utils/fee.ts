import { Currency, CurrencyAmount, Fraction } from '@kyberswap/ks-sdk-core'
import { parseUnits } from 'ethers/lib/utils'
import JSBI from 'jsbi'

import { BIPS_BASE, RESERVE_USD_DECIMALS } from 'constants/index'
import { DetailedRouteSummary, FeeConfig } from 'types/route'
import { Aggregator } from 'utils/aggregator'
import { formattedNum } from 'utils/index'

import { toFixed } from './numbers'

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

export const calculateFee = (
  currencyIn: Currency,
  currencyOut: Currency,
  amountIn: string,
  amountOut: string,
  amountInUsd: string,
  amountOutUsd: string,
  feeConfig: DetailedRouteSummary['extraFee'],
): {
  feeAmount: string
  feeAmountUsd: string
} => {
  if (!feeConfig.chargeFeeBy || !feeConfig.feeAmount) {
    return {
      feeAmount: '',
      feeAmountUsd: '',
    }
  }

  const feePercent = feeConfig.feeAmount

  const currencyAmountIn = CurrencyAmount.fromRawAmount(currencyIn, amountIn)
  const currencyAmountOut = CurrencyAmount.fromRawAmount(currencyOut, amountOut)

  const currencyAmountToTakeFee = feeConfig.chargeFeeBy === 'currency_in' ? currencyAmountIn : currencyAmountOut
  const amountUsd = feeConfig.chargeFeeBy === 'currency_in' ? amountInUsd : amountOutUsd

  const feeAmountFraction = new Fraction(
    parseUnits(feePercent, RESERVE_USD_DECIMALS).toString(),
    JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(RESERVE_USD_DECIMALS)),
  ).divide(BIPS_BASE)

  let feeAmount = ''
  let feeAmountUsd = feeConfig.feeAmountUsd

  if (amountUsd && !feeAmountUsd) {
    const usd = new Fraction(
      parseUnits(toFixed(Number(amountUsd)), RESERVE_USD_DECIMALS).toString(),
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(RESERVE_USD_DECIMALS)),
    )

    if (usd) {
      const raw = usd.multiply(feeAmountFraction).toSignificant(RESERVE_USD_DECIMALS)
      feeAmountUsd = raw
    }
  }
  if (feeAmountUsd) {
    feeAmountUsd = formattedNum(feeAmountUsd, true, 4)
  }

  const fee = currencyAmountToTakeFee.multiply(feeAmountFraction).toSignificant(RESERVE_USD_DECIMALS)
  feeAmount = `${formattedNum(fee, false)} ${currencyAmountToTakeFee.currency.symbol}`

  return {
    feeAmount,
    feeAmountUsd,
  }
}
