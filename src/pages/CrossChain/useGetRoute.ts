import { RouteRequest, RouteResponse } from '@0xsquid/sdk/dist/types'
import debounce from 'lodash/debounce'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { INPUT_DEBOUNCE_TIME } from 'constants/index'
import useDebounce from 'hooks/useDebounce'
import { useCrossChainHandlers, useCrossChainState } from 'state/crossChain/hooks'

export default function useGetRouteCrossChain(params: RouteRequest | undefined) {
  const [{ squidInstance, route, requestId }] = useCrossChainState()
  const { setTradeRoute, setPriceUsd } = useCrossChainHandlers()
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const controller = useRef(new AbortController())
  const controllerPrice = useRef(new AbortController())
  const debounceParams = useDebounce(params, INPUT_DEBOUNCE_TIME)

  const getTokenPrice = useCallback(async () => {
    if (!squidInstance || !debounceParams) {
      setPriceUsd({ tokenIn: undefined, tokenOut: undefined })
      return
    }
    let signal: AbortSignal | undefined
    try {
      controllerPrice.current?.abort?.()
      controllerPrice.current = new AbortController()
      signal = controllerPrice.current.signal
      const { fromChain, toChain, fromToken, toToken } = debounceParams
      const [tokenPriceIn, tokenPriceOut] = await Promise.all([
        squidInstance.getTokenPrice({ tokenAddress: fromToken, chainId: fromChain }),
        squidInstance.getTokenPrice({ tokenAddress: toToken, chainId: toChain }),
      ])
      if (signal?.aborted) return
      setPriceUsd({ tokenIn: tokenPriceIn, tokenOut: tokenPriceOut })
    } catch (error) {
      if (signal?.aborted) return
      setPriceUsd({ tokenIn: undefined, tokenOut: undefined })
    }
  }, [squidInstance, debounceParams, setPriceUsd])

  const getRoute = useCallback(
    async (isRefresh = true) => {
      if (!squidInstance || !debounceParams) {
        setTradeRoute(undefined)
        return
      }

      try {
        controller.current?.abort?.()
        controller.current = new AbortController()
        const signal: AbortSignal | undefined = controller.current.signal
        setLoading(true)
        setError(false)
        isRefresh && setTradeRoute(undefined)

        const route: RouteResponse | undefined = await squidInstance.getRoute(debounceParams)

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

  useEffect(() => {
    getTokenPrice()
  }, [getTokenPrice])

  return {
    route,
    requestId,
    getRoute: getRouteDebounce,
    error,
    loading,
  }
}
