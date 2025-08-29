import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryOauthDynamic } from 'services/baseQueryOauth'
import { BuildRoutePayload, BuildRouteResponse } from 'services/route/types/buildRoute'

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
      query: ({ params, url, authentication, clientId: _ }) => {
        const { chainId, tokenInDecimals, tokenOutDecimals, ...rest } = params
        return {
          url,
          params: rest,
          authentication,
          headers: {
            'x-client-id': '',
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
            'x-client-id': '',
          },
        }
      },
    }),
  }),
})

export default routeApi

export const { useLazyGetRouteQuery, useBuildRouteMutation } = routeApi
