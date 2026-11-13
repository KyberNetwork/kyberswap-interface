import { ChainId, CurrencyAmount, Token, WETH } from '@kyberswap/ks-sdk-core'
import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryOauthDynamic } from 'services/baseQueryOauth'
import { BuildRouteData, BuildRoutePayload, BuildRouteResponse } from 'services/route/types/buildRoute'
import { GetRouteParams, GetRouteResponse } from 'services/route/types/getRoute'
import { SwapRouteParams, SwapRouteResponse } from 'services/route/types/swapRoute'
import { fetchTokenPrices, getMidPrice } from 'services/tokenCatalog'

import { ETHER_ADDRESS } from 'constants/index'
import type { AppDispatch } from 'state'

export const AGGREGATOR_API_PATHS = {
  BUILD_ROUTE: '/api/v1/route/build',
  GET_ROUTE: '/api/v1/routes',
  SWAP: '/api/v1/swap',
} as const

const getWrappedToken = (token: string, chainId: ChainId) =>
  token.toLowerCase() === ETHER_ADDRESS.toLowerCase() ? WETH[chainId].address : token

type BuiltTrade = {
  chainId?: ChainId
  tokenIn: string
  tokenOut: string
  tokenInDecimals?: number
  tokenOutDecimals?: number
  amountIn: string
  amountOut: string
}

/** Values a built trade at token-catalog mid prices; keeps the aggregator's USD values when it cannot. */
const withMarketUsd = async <T extends BuildRouteData>(data: T, trade: BuiltTrade): Promise<T> => {
  const { chainId, tokenIn, tokenOut, tokenInDecimals, tokenOutDecimals, amountIn, amountOut } = trade
  if (!chainId || !tokenInDecimals || !tokenOutDecimals) return data

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
      ...data,
      amountInUsd: tokenInMidPrice ? (+tokenInBalance * tokenInMidPrice).toString() : '',
      amountOutUsd: tokenOutMidPrice ? (+tokenOutBalance * tokenOutMidPrice).toString() : '',
    }
  } catch (error) {
    console.error('Failed to fetch on-chain price:', error)
    return data
  }
}

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

        if (!data || !routeSummary) return baseResponse

        const { tokenIn, tokenOut, amountIn, amountOut } = routeSummary
        return {
          ...baseResponse,
          data: await withMarketUsd(data, {
            chainId,
            tokenIn,
            tokenOut,
            tokenInDecimals,
            tokenOutDecimals,
            amountIn,
            amountOut,
          }),
        }
      },
    }),
    swapRoute: builder.mutation<
      SwapRouteResponse,
      { url: string; params: SwapRouteParams; signal?: AbortSignal; authentication: boolean }
    >({
      query: ({ url, params, signal, authentication }) => {
        const { chainId, tokenInDecimals, tokenOutDecimals, ...rest } = params
        return {
          url,
          cache: 'no-store',
          params: rest,
          signal,
          authentication,
          headers: {
            'x-client-id': params.source || 'kyberswap',
          },
        }
      },
      async transformResponse(baseResponse: SwapRouteResponse, _meta, { params }): Promise<SwapRouteResponse> {
        const { data } = baseResponse || {}
        if (!data) return baseResponse

        const { chainId, tokenIn, tokenOut, tokenInDecimals, tokenOutDecimals } = params
        return {
          ...baseResponse,
          data: await withMarketUsd(data, {
            chainId,
            tokenIn,
            tokenOut,
            tokenInDecimals,
            tokenOutDecimals,
            // The amounts this response built, which can differ from the quote on screen.
            amountIn: data.amountIn,
            amountOut: data.amountOut,
          }),
        }
      },
    }),
  }),
})

export default routeApi

/** Imperative API transport; TanStack Query owns quote observation and polling. */
export const fetchRoute = (dispatch: AppDispatch, args: Parameters<typeof routeApi.endpoints.getRoute.initiate>[0]) =>
  dispatch(routeApi.endpoints.getRoute.initiate(args, { subscribe: false, forceRefetch: true })).unwrap()
