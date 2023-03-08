import { t } from '@lingui/macro'

import { MAX_SLIPPAGE_IN_BIPS } from 'constants/index'

// isValid = true means it's OK to process with the number with an extra parse
// isValid = true with message means warning
// isValid = false with/without message means error
export const checkRangeSlippage = (slippage: number, isStablePairSwap: boolean) => {
  if (slippage < 0) {
    return {
      isValid: false,
      message: t`Enter a valid slippage percentage`,
    }
  }

  if (slippage > MAX_SLIPPAGE_IN_BIPS) {
    return {
      isValid: false,
      message: t`Slippage is restricted to at most 20%. Please enter a smaller number`,
    }
  }

  if (isStablePairSwap) {
    if (slippage < 5) {
      return {
        isValid: true,
        message: t`Slippage is low. Your transaction may fail`,
      }
    }

    if (10 < slippage && slippage <= MAX_SLIPPAGE_IN_BIPS) {
      return {
        isValid: true,
        message: t`Slippage for stable tokens swap should be <= 0.1%. Your transaction may be front-run`,
      }
    }

    return {
      isValid: true,
    }
  }

  if (slippage < 50) {
    return {
      isValid: true,
      message: t`Slippage is low. Your transaction may fail`,
    }
  }

  if (500 < slippage && slippage <= MAX_SLIPPAGE_IN_BIPS) {
    return {
      isValid: true,
      message: t`Slippage is high. Your transaction may be front-run`,
    }
  }

  return {
    isValid: true,
  }
}

export const formatSlippage = (slp: number, withPercent = false) => {
  let text = ''
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
