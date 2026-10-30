import { t } from '@lingui/macro'

import { getPriceImpactInfo } from 'pages/Swap/crossChain/quote/priceImpact'
import { PairCategory } from 'pages/Swap/crossChain/quote/utils'
import { Quote } from 'pages/Swap/crossChain/registry'

type Params = {
  selectedQuote: Quote | null
  category: PairCategory
  isEvmPair: boolean
  slippage: number
}

export const getQuoteWarning = ({ selectedQuote, category, isEvmPair, slippage }: Params) => {
  const highSlippageMsg = t`Your slippage is set higher than usual, which may cause unexpected losses`
  const lowSlippageMsg = t`Your slippage is set lower than usual, which may cause transaction failure.`
  if (isEvmPair) {
    const slippageHighThreshold = category === 'stablePair' ? 100 : 200
    const slippageLowThreshold = category === 'stablePair' ? 5 : 30
    const slippageInfo = {
      default: category === 'stablePair' ? 10 : 50,
      presets: category === 'stablePair' ? [5, 10, 30, 100] : [10, 50, 100, 200],
      isHigh: slippage >= slippageHighThreshold,
      isLow: slippage < slippageLowThreshold,
      message:
        slippage >= slippageHighThreshold ? highSlippageMsg : slippage < slippageLowThreshold ? lowSlippageMsg : '',
    }

    const priceImpactInfo = selectedQuote ? getPriceImpactInfo(selectedQuote.quote.priceImpact, category, true) : null
    return { slippageInfo, priceImpactInfo }
  }

  return {
    slippageInfo: {
      default: 50,
      presets: [50, 100, 200, 300],
      isHigh: slippage >= 300,
      isLow: slippage < 30,
      message: slippage >= 300 ? highSlippageMsg : slippage < 30 ? lowSlippageMsg : '',
    },
    priceImpactInfo: selectedQuote ? getPriceImpactInfo(selectedQuote.quote.priceImpact, category, false) : null,
  }
}
