import { Currency, CurrencyAmount, Percent } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import JSBI from 'jsbi'

import { PAIR_CATEGORY } from 'constants/trade'

export enum SLIPPAGE_STATUS {
  NORMAL,
  LOW,
  HIGH,
}

// converts a basis points value to a sdk percent
export function basisPointsToPercent(num: number): Percent {
  return new Percent(JSBI.BigInt(num), JSBI.BigInt(10000))
}

export function calculateSlippageAmount(value: CurrencyAmount<Currency>, slippage: number): [JSBI, JSBI] {
  if (slippage < 0 || slippage > 10000) {
    throw Error(`Unexpected slippage value: ${slippage}`)
  }
  return [
    JSBI.divide(JSBI.multiply(value.quotient, JSBI.BigInt(10000 - slippage)), JSBI.BigInt(10000)),
    JSBI.divide(JSBI.multiply(value.quotient, JSBI.BigInt(10000 + slippage)), JSBI.BigInt(10000)),
  ]
}

export const checkRangeSlippage = (slippage: number, pairCategory: PAIR_CATEGORY | undefined): SLIPPAGE_STATUS => {
  if (pairCategory === PAIR_CATEGORY.STABLE) {
    if (slippage > 20) {
      return SLIPPAGE_STATUS.HIGH
    }

    return SLIPPAGE_STATUS.NORMAL
  }

  if (pairCategory === PAIR_CATEGORY.CORRELATED) {
    if (slippage > 50) {
      return SLIPPAGE_STATUS.HIGH
    }
    return SLIPPAGE_STATUS.NORMAL
  }

  if (pairCategory === PAIR_CATEGORY.HIGH_VOLATILITY) {
    if (slippage < 50) {
      return SLIPPAGE_STATUS.LOW
    }
    if (slippage > 500) {
      return SLIPPAGE_STATUS.HIGH
    }
    return SLIPPAGE_STATUS.NORMAL
  }

  // if (slippage < 5) {
  //   return SLIPPAGE_STATUS.LOW
  // }

  // Exotic pairs
  if (slippage > 200) {
    return SLIPPAGE_STATUS.HIGH
  }
  if (slippage < 10) {
    return SLIPPAGE_STATUS.LOW
  }

  return SLIPPAGE_STATUS.NORMAL
}

export const checkWarningSlippage = (slippage: number, cat: PAIR_CATEGORY | undefined) => {
  return checkRangeSlippage(slippage, cat) !== SLIPPAGE_STATUS.NORMAL
}

export const formatSlippage = (slp: number, withPercent = true) => {
  let text
  if (slp % 100 === 0) {
    text = String(slp / 100)
  } else if (slp % 10 === 0) {
    text = (slp / 100).toFixed(1)
  } else {
    text = (slp / 100).toFixed(2)
  }

  if (withPercent) {
    text += '%'
  }

  return text
}

const COMMON_PAIR = 'commonPair' // temporary solution, should have config for common pair soon

export const SLIPPAGE_WARNING_MESSAGES: { [key: string]: { [key: string]: string } } = (() => ({
  [SLIPPAGE_STATUS.LOW]: {
    [PAIR_CATEGORY.HIGH_VOLATILITY]: t`is quite low and may cause failed transactions in volatile markets.`,
    [PAIR_CATEGORY.EXOTIC]: t`is quite low and may cause failed transactions in highly volatile markets.`,
    [COMMON_PAIR]: t`is quite low and may cause failed transactions in highly volatile markets.`,
  },
  [SLIPPAGE_STATUS.HIGH]: {
    [PAIR_CATEGORY.STABLE]: t`setting might be high compared to typical stable pair trades. Consider adjusting it to reduce front-running risks.`,
    [PAIR_CATEGORY.CORRELATED]: t`setting might be high compared with other similar trades. Consider adjusting it to reduce front-running risks.`,
    [PAIR_CATEGORY.HIGH_VOLATILITY]: t`setting might be high for this market. Consider adjusting it to reduce front-running risks.`,
    [PAIR_CATEGORY.EXOTIC]: t`setting might be high. Consider adjusting it to reduce front-running risks.`,
    [COMMON_PAIR]: t`setting might be high. Consider adjusting it to reduce front-running risks.`,
  },
}))()
