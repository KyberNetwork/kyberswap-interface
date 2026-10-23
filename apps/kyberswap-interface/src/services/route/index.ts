import { ChainId, CurrencyAmount, Token, WETH } from '@kyberswap/ks-sdk-core'
import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryOauthDynamic } from 'services/baseQueryOauth'
import { BuildRoutePayload, BuildRouteResponse } from 'services/route/types/buildRoute'
import { GetRouteParams, GetRouteResponse } from 'services/route/types/getRoute'
import { fetchTokenPrices, getMidPrice } from 'services/tokenCatalog'

import { ETHER_ADDRESS } from 'constants/index'
import type { AppDispatch } from 'state'

export const AGGREGATOR_API_PATHS = {
  BUILD_ROUTE: '/api/v1/route/build',
  GET_ROUTE: '/api/v1/routes',
} as const

const getWrappedToken = (token: string, chainId: ChainId) =>
  token.toLowerCase() === ETHER_ADDRESS.toLowerCase() ? WETH[chainId].address : token

const routeApi = createApi({
  reducerPath: 'routeApi',
  baseQuery: baseQueryOauthDynamic({
    baseUrl: '',
  }),
  endpoints: builder => ({
    getRoute: builder.query<
      GetRouteResponse,
      {
        url: string
        params: GetRouteParams
        authentication: boolean
        clientId?: string
      }
    >({
      keepUnusedDataFor: 0,
      query: ({ params, url, authentication, clientId }) => {
        const { chainId, tokenInDecimals, tokenOutDecimals, ...rest } = params
        return {
          url,
          cache: 'no-store',
          params: rest,
          authentication,
          headers: {
            'x-client-id': clientId || 'kyberswap',
          },
        }
      },
    }),
    buildRoute: builder.mutation<
      BuildRouteResponse,
      { url: string; payload: BuildRoutePayload; signal?: AbortSignal; authentication: boolean }
    >({
      query: ({ url, payload, signal, authentication }) => {
        const { chainId, tokenInDecimals, tokenOutDecimals, ...rest } = payload
        return {
          url,
          method: 'POST',
          body: rest,
          signal,
          authentication,
          headers: {
            'x-client-id': payload.source || 'kyberswap',
          },
        }
      },
      async transformResponse(baseResponse: BuildRouteResponse, _meta, { payload }): Promise<BuildRouteResponse> {
        const { data } = baseResponse || {}
        const { chainId, tokenInDecimals, tokenOutDecimals, routeSummary } = payload || {}
        const { tokenIn, tokenOut } = routeSummary || {}

        // Ensure all necessary data is available
        if (data && routeSummary && chainId && tokenInDecimals && tokenOutDecimals) {
          const { amountIn, amountOut } = routeSummary

          try {
            const wrappedTokenIn = getWrappedToken(tokenIn, chainId)
            const wrappedTokenOut = getWrappedToken(tokenOut, chainId)

            const priceResponse = await fetchTokenPrices({ [chainId]: [wrappedTokenIn, wrappedTokenOut] })

            const tokenInMidPrice = getMidPrice(priceResponse?.data?.[chainId]?.[wrappedTokenIn])
            const tokenOutMidPrice = getMidPrice(priceResponse?.data?.[chainId]?.[wrappedTokenOut])

            const currencyIn = new Token(chainId, tokenIn, tokenInDecimals)
            const currencyOut = new Token(chainId, tokenOut, tokenOutDecimals)

            const tokenInBalance = CurrencyAmount.fromRawAmount(currencyIn, amountIn).toExact()
            const tokenOutBalance = CurrencyAmount.fromRawAmount(currencyOut, amountOut).toExact()

            return {
              ...baseResponse,
              data: {
                ...data,
                amountInUsd: tokenInMidPrice ? (+tokenInBalance * tokenInMidPrice).toString() : '',
                amountOutUsd: tokenOutMidPrice ? (+tokenOutBalance * tokenOutMidPrice).toString() : '',
              },
            }
          } catch (error) {
            console.error('Failed to fetch on-chain price:', error)
          }
        }

        // Return original response if conditions are not met or request fails
        return baseResponse
      },
    }),
  }),
})

export default routeApi

/** Imperative API transport; TanStack Query owns quote observation and polling. */
export const fetchRoute = (dispatch: AppDispatch, args: Parameters<typeof routeApi.endpoints.getRoute.initiate>[0]) =>
  dispatch(routeApi.endpoints.getRoute.initiate(args, { subscribe: false, forceRefetch: true })).unwrap()
