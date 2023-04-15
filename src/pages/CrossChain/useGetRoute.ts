import { GetRoute } from '@0xsquid/sdk'
import { debounce } from 'lodash'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { useCrossChainHandlers, useCrossChainState } from 'state/bridge/hooks'

// todo call too much
export default function useGetRouteCrossChain(params: GetRoute | undefined) {
  const [{ squidInstance, route }] = useCrossChainState()
  const { setTradeRoute } = useCrossChainHandlers()
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  const getRoute = useCallback(async () => {
    if (!squidInstance || !params) return
    try {
      setLoading(true)
      // setTradeRoute(undefined) // todo bi loop
      const { route } = await squidInstance.getRoute(params)
      setTradeRoute(route)
      setError(false)
    } catch (error) {
      console.log(error)
      setError(true)
      setTradeRoute(undefined)
    } finally {
      setLoading(false)
    }
  }, [squidInstance, params, setTradeRoute]) // todo

  const getRouteDebounce = useMemo(() => debounce(getRoute, 200), [getRoute])

  useEffect(() => {
    getRoute()
  }, [getRoute])

  return { route, getRoute: getRouteDebounce, error, loading }
}
