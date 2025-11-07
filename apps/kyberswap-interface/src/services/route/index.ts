import { ChainId, CurrencyAmount, Token, WETH } from '@kyberswap/ks-sdk-core'
import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryOauthDynamic } from 'services/baseQueryOauth'
import { BuildRoutePayload, BuildRouteResponse } from 'services/route/types/buildRoute'

import { TOKEN_API_URL } from 'constants/env'
import { ETHER_ADDRESS } from 'constants/index'

import { GetRouteParams, GetRouteResponse } from './types/getRoute'

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
      query: ({ params, url, authentication, clientId: _ }) => {
        const { chainId, tokenInDecimals, tokenOutDecimals, ...rest } = params
        return {
          url,
          params: rest,
          authentication,
          headers: {
            'x-client-id': 'test',
          },
        }
      },
      async transformResponse(baseResponse: GetRouteResponse, _meta, { params }): Promise<GetRouteResponse> {
        const { routeSummary } = baseResponse?.data || {}
        const { chainId, tokenInDecimals, tokenOutDecimals, tokenIn, tokenOut } = params || {}

        // Ensure all necessary data is available
        if (baseResponse?.data?.routeSummary && routeSummary && chainId && tokenInDecimals && tokenOutDecimals) {
          const { amountIn, amountOut } = routeSummary

          try {
            const wrappedTokenIn = getWrappedToken(tokenIn, chainId)
            const wrappedTokenOut = getWrappedToken(tokenOut, chainId)

            const priceResponse = await fetch(`${TOKEN_API_URL}/v1/public/tokens/prices`, {
              method: 'POST',
              body: JSON.stringify({
                [chainId]: [wrappedTokenIn, wrappedTokenOut],
              }),
            }).then(res => res.json())

            const tokenInPrices = priceResponse?.data?.[chainId]?.[wrappedTokenIn]
            const tokenInMidPrice =
              tokenInPrices?.PriceBuy && tokenInPrices?.PriceSell
                ? (tokenInPrices.PriceBuy + tokenInPrices.PriceSell) / 2
                : null
            const tokenOutPrices = priceResponse?.data?.[chainId]?.[wrappedTokenOut]
            const tokenOutMidPrice =
              tokenOutPrices?.PriceBuy && tokenOutPrices?.PriceSell
                ? (tokenOutPrices.PriceBuy + tokenOutPrices.PriceSell) / 2
                : null

            const currencyIn = new Token(chainId, tokenIn, tokenInDecimals)
            const currencyOut = new Token(chainId, tokenOut, tokenOutDecimals)

            const tokenInBalance = CurrencyAmount.fromRawAmount(currencyIn, amountIn).toExact()
            const tokenOutBalance = CurrencyAmount.fromRawAmount(currencyOut, amountOut).toExact()

            return {
              ...baseResponse,
              data: {
                ...baseResponse.data,
                routeSummary: {
                  ...routeSummary,
                  amountInUsd: tokenInMidPrice ? (+tokenInBalance * tokenInMidPrice).toString() : '',
                  amountOutUsd: tokenOutMidPrice ? (+tokenOutBalance * tokenOutMidPrice).toString() : '',
                  rawAmountInUsd: routeSummary.amountInUsd,
                  rawAmountOutUsd: routeSummary.amountOutUsd,
                },
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
    buildRoute: builder.mutation<
      BuildRouteResponse,
      { url: string; payload: BuildRoutePayload; signal?: AbortSignal; authentication: boolean }
    >({
      query: ({ url, payload, signal, authentication }) => {
        const { chainId, tokenInDecimals, tokenOutDecimals, ...rest } = payload
        return {
          url,
          method: 'POST',
          body: { ...rest, source: 'test', enableGasEstimation: false },
          signal,
          authentication,
          headers: {
            'x-client-id': 'test',
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

            const priceResponse = await fetch(`${TOKEN_API_URL}/v1/public/tokens/prices`, {
              method: 'POST',
              body: JSON.stringify({
                [chainId]: [wrappedTokenIn, wrappedTokenOut],
              }),
            }).then(res => res.json())

            const tokenInPrices = priceResponse?.data?.[chainId]?.[wrappedTokenIn]
            const tokenInMidPrice =
              tokenInPrices?.PriceBuy && tokenInPrices?.PriceSell
                ? (tokenInPrices.PriceBuy + tokenInPrices.PriceSell) / 2
                : null
            const tokenOutPrices = priceResponse?.data?.[chainId]?.[wrappedTokenOut]
            const tokenOutMidPrice =
              tokenOutPrices?.PriceBuy && tokenOutPrices?.PriceSell
                ? (tokenOutPrices.PriceBuy + tokenOutPrices.PriceSell) / 2
                : null

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

export const { useLazyGetRouteQuery, useBuildRouteMutation } = routeApi
