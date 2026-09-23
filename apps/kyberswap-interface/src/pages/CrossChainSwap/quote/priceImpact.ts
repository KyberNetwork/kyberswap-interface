import { t } from '@lingui/macro'

import type { PairCategory } from 'pages/CrossChainSwap/quote/utils'

export const getPriceImpactInfo = (priceImpact: number, category: PairCategory, isEvmPair: boolean) => {
  const highThreshold = isEvmPair ? (category === 'stablePair' ? 1 : 2) : 3
  const veryHighThreshold = isEvmPair ? (category === 'stablePair' ? 3 : 5) : 10
  const unableToCalculate = isEvmPair && !priceImpact
  const isHigh = priceImpact > highThreshold
  const isVeryHigh = unableToCalculate || priceImpact >= veryHighThreshold

  return {
    isHigh,
    isVeryHigh,
    message: unableToCalculate
      ? 'Unable to calculate price impact'
      : isVeryHigh
      ? t`The price impact is high — double check the output before proceeding.`
      : isHigh
      ? t`The price impact might be high — double check the output before proceeding.`
      : '',
  }
}
