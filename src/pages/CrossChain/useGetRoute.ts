import { GetRoute } from '@0xsquid/sdk'
import { debounce } from 'lodash'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { INPUT_DEBOUNCE_TIME } from 'constants/index'
import { useCrossChainHandlers, useCrossChainState } from 'state/crossChain/hooks'

export default function useGetRouteCrossChain(params: GetRoute | undefined) {
  const [{ squidInstance, route }] = useCrossChainState()
  const { setTradeRoute } = useCrossChainHandlers()
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const currentRequest = useRef<GetRoute>()

  const getRoute = useCallback(
    async (isRefresh = true) => {
      if (!squidInstance || !params) return
      try {
        currentRequest.current = params
        setLoading(true)
        isRefresh && setTradeRoute(undefined)
        const { route } = await squidInstance.getRoute(params)
        if (currentRequest.current !== params) return
        setTradeRoute(route)
        setError(false)
      } catch (error) {
        console.log(error)
        setError(true)
        setTradeRoute(undefined)
      } finally {
        setLoading(false)
      }
    },
    [squidInstance, params, setTradeRoute],
  )

  const getRouteDebounce = useMemo(() => debounce(() => getRoute(false), INPUT_DEBOUNCE_TIME), [getRoute])

  useEffect(() => {
    getRoute()
  }, [getRoute])

  return { route, getRoute: getRouteDebounce, error, loading }
}
