import { useLayoutEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useDegenModeManager } from 'state/user/hooks'
import { getPriceImpactAction } from 'utils/prices'

export const usePriceImpactDegenMode = (priceImpact: number | null | undefined) => {
  const [isDegenMode] = useDegenModeManager()
  const [, setSearchParams] = useSearchParams()
  const currentDegenMode = useRef(isDegenMode)
  useLayoutEffect(() => {
    currentDegenMode.current = isDegenMode
  }, [isDegenMode])

  return {
    requiresDegenMode: (impact: number | null | undefined) =>
      getPriceImpactAction(currentDegenMode.current, impact) === 'enable-degen',
    priceImpactAction: getPriceImpactAction(isDegenMode, priceImpact),
    requestDegenMode: () => {
      setSearchParams(previous => {
        const next = new URLSearchParams(previous)
        next.set('enableDegenMode', 'true')
        return next
      })
    },
  }
}
