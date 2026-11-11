import { useSearchParams } from 'react-router-dom'

import { useDegenModeManager } from 'state/user/hooks'
import { checkShouldDisableByPriceImpact } from 'utils/priceImpact'
import { checkPriceImpact } from 'utils/prices'

export const usePriceImpactDegenMode = (priceImpact: number | null | undefined) => {
  const [isDegenMode] = useDegenModeManager()
  const [, setSearchParams] = useSearchParams()

  return {
    isDegenMode,
    hasVeryHighPriceImpact: (() => {
      const result = checkPriceImpact(priceImpact)
      return result.isVeryHigh || result.isInvalid
    })(),
    shouldRequireDegenMode: checkShouldDisableByPriceImpact(isDegenMode, priceImpact ?? undefined),
    requestDegenMode: () => {
      setSearchParams(previous => {
        const next = new URLSearchParams(previous)
        next.set('enableDegenMode', 'true')
        return next
      })
    },
  }
}
