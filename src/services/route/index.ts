import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryOauthDynamic } from 'services/baseQueryOauth'
import { BuildRoutePayload, BuildRouteResponse } from 'services/route/types/buildRoute'

import { BFF_API } from 'constants/env'

import { GetRouteParams, GetRouteResponse } from './types/getRoute'

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
      query: ({ params, url, authentication, clientId }) => ({
        url,
        params,
        authentication,
        headers: {
          'x-client-id': clientId || 'kyberswap',
        },
      }),
      async transformResponse(baseResponse: GetRouteResponse, _meta, { params }): Promise<GetRouteResponse> {
        const { routeSummary } = baseResponse?.data || {}
        const { chainId, tokenInDecimals, tokenOutDecimals, tokenIn, tokenOut } = params || {}

        // Ensure all necessary data is available
        if (baseResponse?.data?.routeSummary && routeSummary && chainId && tokenInDecimals && tokenOutDecimals) {
          const { amountIn, amountOut } = routeSummary

          // Build the URL for the price impact API request
          const priceImpactUrl = new URL(`${BFF_API}/v1/price-impact`)
          priceImpactUrl.searchParams.append('tokenIn', tokenIn)
          priceImpactUrl.searchParams.append('tokenInDecimal', tokenInDecimals.toString())
          priceImpactUrl.searchParams.append('tokenOut', tokenOut)
          priceImpactUrl.searchParams.append('tokenOutDecimal', tokenOutDecimals.toString())
          priceImpactUrl.searchParams.append('amountIn', amountIn)
          priceImpactUrl.searchParams.append('amountOut', amountOut)
          priceImpactUrl.searchParams.append('chainId', chainId.toString())

          try {
            // Fetch price impact data
            const priceImpactResponse = await fetch(priceImpactUrl.toString()).then(res => res.json())
            const { amountInUSD, amountOutUSD } = priceImpactResponse?.data || {}

            // Update routeSummary with USD values if available
            if (amountInUSD && amountOutUSD) {
              return {
                ...baseResponse,
                data: {
                  ...baseResponse.data,
                  routeSummary: {
                    ...routeSummary,
                    amountInUsd: amountInUSD,
                    amountOutUsd: amountOutUSD,
                  },
                },
              }
            }
          } catch (error) {
            console.error('Failed to fetch price impact:', error)
          }
        }

        // Return original response if conditions are not met or request fails
        return baseResponse
      },
    }),
    buildRoute: builder.mutation<
      BuildRouteResponse,
      { url: string; payload: BuildRoutePayload; signal?: AbortSignal; authentication: boolean }
    >({
      query: ({ url, payload, signal, authentication }) => ({
        url,
        method: 'POST',
        body: payload,
        signal,
        authentication,
        headers: {
          'x-client-id': payload.source || 'kyberswap',
        },
      }),
    }),
  }),
})

export default routeApi

export const { useLazyGetRouteQuery, useBuildRouteMutation } = routeApi
