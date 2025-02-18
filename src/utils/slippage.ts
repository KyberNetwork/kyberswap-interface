import {
  DEFAULT_SLIPPAGE,
  DEFAULT_SLIPPAGE_CORRELATED_PAIR,
  DEFAULT_SLIPPAGE_STABLE_PAIR_SWAP,
  PAIR_CATEGORY,
} from 'constants/index'

export enum SLIPPAGE_STATUS {
  NORMAL,
  LOW,
  HIGH,
}

export const getDefaultSlippage = (isStablePairSwap: boolean, isCorrelatedPair: boolean): number => {
  return isStablePairSwap
    ? DEFAULT_SLIPPAGE_STABLE_PAIR_SWAP
    : isCorrelatedPair
    ? DEFAULT_SLIPPAGE_CORRELATED_PAIR
    : DEFAULT_SLIPPAGE
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

  if (slippage > 150) {
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
