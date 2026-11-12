import { t } from '@lingui/macro'
import type { PairCategory } from 'services/crossChain/quote/utils'

import { checkPriceImpact } from 'utils/prices'

export const getPriceImpactInfo = (priceImpact: number | null, category: PairCategory, isEvmPair: boolean) => {
  const highThreshold = isEvmPair ? (category === 'stablePair' ? 1 : 2) : 3
  const highWarningThreshold = isEvmPair ? (category === 'stablePair' ? 3 : 5) : 10
  const unableToCalculate = isEvmPair && (priceImpact === null || !Number.isFinite(priceImpact))
  const isHigh = priceImpact !== null && priceImpact > highThreshold
  const isVeryHigh = unableToCalculate || checkPriceImpact(priceImpact).isVeryHigh

  return {
    unableToCalculate,
    isHigh,
    isVeryHigh,
    message: unableToCalculate
      ? 'Unable to calculate price impact'
      : priceImpact !== null && priceImpact >= highWarningThreshold
      ? t`The price impact is high — double check the output before proceeding.`
      : isHigh
      ? t`The price impact might be high — double check the output before proceeding.`
      : '',
  }
}
