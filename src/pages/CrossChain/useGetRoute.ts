import { GetRoute } from '@0xsquid/sdk'
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
    async (isRefresh = true) => {
      if (!squidInstance || !debounceParams) return
      try {
        currentRequest.current = debounceParams
        setLoading(true)
        isRefresh && setTradeRoute(undefined)
        const { route } = await squidInstance.getRoute(debounceParams)
        if (currentRequest.current !== debounceParams) return
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
    [squidInstance, debounceParams, setTradeRoute],
  )

  const getRouteDebounce = useMemo(() => debounce(() => getRoute(false), INPUT_DEBOUNCE_TIME), [getRoute])

  useEffect(() => {
    getRoute()
  }, [getRoute])

  return { route, getRoute: getRouteDebounce, error, loading }
}
