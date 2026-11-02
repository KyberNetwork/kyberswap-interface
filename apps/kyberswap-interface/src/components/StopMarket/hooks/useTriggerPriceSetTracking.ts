import { useCallback, useEffect, useRef } from 'react'

import { TriggerInputMethod } from 'components/StopMarket/hooks/useStopMarketTracking'
import useDebounce from 'hooks/useDebounce'

const SETTLE_MS = 500

type Params = {
  triggerPrice: string
  /** The pair the price belongs to; a change drops any input still waiting to be reported. */
  resetKey?: string
  onSet: (method: TriggerInputMethod) => void
}

/**
 * Reports a trigger price once the user has finished setting it, whichever way they did: a typed price
 * settles after a pause, a preset or the Oracle button at once on the price it produces. Every handler
 * that changes the price marks how, and the mark is what tells a user's change from the form seeding
 * the field with the market price, which is never reported. Returns that marker.
 */
export const useTriggerPriceSetTracking = ({ triggerPrice, resetKey, onSet }: Params) => {
  const methodRef = useRef<TriggerInputMethod | undefined>(undefined)
  const onSetRef = useRef(onSet)
  onSetRef.current = onSet
  const settledPrice = useDebounce(triggerPrice, SETTLE_MS)

  useEffect(() => {
    methodRef.current = undefined
  }, [resetKey])

  useEffect(() => {
    const method = methodRef.current
    if (!method) return
    methodRef.current = undefined
    if (Number(settledPrice) > 0) onSetRef.current(method)
  }, [settledPrice])

  return useCallback((method: TriggerInputMethod) => {
    methodRef.current = method
  }, [])
}
