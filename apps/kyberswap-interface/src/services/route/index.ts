import { ChainId, CurrencyAmount, Token, WETH } from '@kyberswap/ks-sdk-core'
import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryOauthDynamic } from 'services/baseQueryOauth'
import { BuildRoutePayload, BuildRouteResponse } from 'services/route/types/buildRoute'
import { GetRouteParams, GetRouteResponse } from 'services/route/types/getRoute'
import { fetchTokenPrices, getMidPrice } from 'services/tokenCatalog'

import { ETHER_ADDRESS } from 'constants/index'

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
      query: ({ params, url, authentication, clientId }) => {
        const { chainId, tokenInDecimals, tokenOutDecimals, ...rest } = params
        return {
          url,
          params: rest,
          authentication,
          headers: {
            'x-client-id': clientId || 'kyberswap',
          },
        }
      },
      async transformResponse(baseResponse: GetRouteResponse, _meta, { params }): Promise<GetRouteResponse> {
        const { routeSummary } = baseResponse?.data || {}
        const { chainId, tokenInDecimals, tokenOutDecimals, tokenIn, tokenOut } = params || {}

        // Ensure all necessary data is available
        if (
          baseResponse?.data?.routeSummary &&
          routeSummary &&
          chainId &&
          // decimals can be 0
          tokenInDecimals !== null &&
          tokenInDecimals !== undefined &&
          tokenOutDecimals !== null &&
          tokenOutDecimals !== undefined
        ) {
          const { amountIn, amountOut } = routeSummary

          if (!routeSummary.amountInUsd || !routeSummary.amountOutUsd) {
            console.warn('[getRoute] aggregator returned empty amountInUsd/amountOutUsd', {
              amountInUsd: routeSummary.amountInUsd,
              amountOutUsd: routeSummary.amountOutUsd,
              tokenIn,
              tokenOut,
              chainId,
            })
          }

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
            console.error('[getRoute] on-chain price fetch failed; rawAmount*Usd will not be set', {
              error,
              tokenIn,
              tokenOut,
              chainId,
              apiAmountInUsd: routeSummary.amountInUsd,
              apiAmountOutUsd: routeSummary.amountOutUsd,
            })
          }
        } else {
          console.warn('[getRoute] transform skipped; rawAmount*Usd will not be set', {
            hasRouteSummary: !!routeSummary,
            chainId,
            tokenInDecimals,
            tokenOutDecimals,
            tokenIn,
            tokenOut,
            apiAmountInUsd: routeSummary?.amountInUsd,
            apiAmountOutUsd: routeSummary?.amountOutUsd,
          })
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
