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
  const controller = useRef(new AbortController())
  const debounceParams = useDebounce(params, INPUT_DEBOUNCE_TIME)

  const getRoute = useCallback(
    async (isRefresh = true) => {
      if (!squidInstance || !debounceParams) {
        setTradeRoute(undefined)
        return
      }
      let signal: AbortSignal | undefined
      let route: RouteData | undefined
      try {
        controller.current?.abort?.()
        controller.current = new AbortController()
        signal = controller.current.signal
        setLoading(true)
        setError(false)
        isRefresh && setTradeRoute(undefined)
        const resp = await squidInstance.getRoute({ ...debounceParams, prefer: ['KYBERSWAP_AGGREGATOR'] })
        route = resp.route
        if (signal?.aborted) return
      } catch (error) {}
      try {
        if (!route) {
          const resp = await squidInstance.getRoute(debounceParams)
          route = resp.route
        }
        if (signal?.aborted) return
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
    getRoute()
  }, [getRoute])

  return { route, getRoute: getRouteDebounce, error, loading }
}
