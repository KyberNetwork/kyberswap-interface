import { GetRoute } from '@0xsquid/sdk'
import { RouteData } from '@sentry/react/types/types'
import { debounce } from 'lodash'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { INPUT_DEBOUNCE_TIME } from 'constants/index'
import useDebounce from 'hooks/useDebounce'
import { useCrossChainHandlers, useCrossChainState } from 'state/crossChain/hooks'

export default function useGetRouteCrossChain(params: GetRoute | undefined) {
  const [{ squidInstance, route }] = useCrossChainState()
  const { setTradeRoute } = useCrossChainHandlers()
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const currentRequest = useRef<GetRoute>()

  const debounceParams = useDebounce(params, INPUT_DEBOUNCE_TIME)

  const getRoute = useCallback(
    async (signal: AbortSignal, isRefresh = true) => {
      if (!squidInstance || !debounceParams) {
        setTradeRoute(undefined)
        return
      }
      let route: RouteData | undefined
      try {
        currentRequest.current = debounceParams
        setLoading(true)
        setError(false)
        isRefresh && setTradeRoute(undefined)
        const resp = await squidInstance.getRoute({ ...debounceParams, prefer: ['KYBERSWAP_AGGREGATOR'] })
        if (signal.aborted) return
        route = resp.route
      } catch (error) {}
      try {
        if (!route) {
          const resp = await squidInstance.getRoute(debounceParams)
          if (signal.aborted) return
          route = resp.route
        }
        setTradeRoute(route)
        setError(false)
        setLoading(false)
      } catch (error) {
        setError(true)
        setTradeRoute(undefined)
        setLoading(false)
      }
    },
    [squidInstance, debounceParams, setTradeRoute],
  )

  const getRouteDebounce = useMemo(() => debounce(() => getRoute(false), INPUT_DEBOUNCE_TIME), [getRoute])

  useEffect(() => {
    const controller = new AbortController()
    getRoute(controller.signal)
    return () => abortController.abort()
  }, [getRoute])

  return { route, getRoute: getRouteDebounce, error, loading }
}
