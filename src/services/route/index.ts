import { ChainId } from '@kyberswap/ks-sdk-core'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import axios from 'axios'
import { BuildRoutePayload, BuildRouteResponse } from 'services/route/types/buildRoute'

import { AGGREGATOR_API } from 'constants/env'
import { NETWORKS_INFO } from 'constants/networks'

import { GetRouteParams, GetRouteResponse } from './types/getRoute'

const routeApi = createApi({
  reducerPath: 'routeApi',
  baseQuery: fetchBaseQuery({ baseUrl: AGGREGATOR_API }),
  endpoints: builder => ({
    getRoute: builder.query<
      GetRouteResponse,
      {
        params: GetRouteParams
        chainSlug: string
      }
    >({
      query: ({ params, chainSlug }) => ({
        url: `/${chainSlug}/api/v1/routes`,
        params,
      }),
    }),
  }),
})

export const buildRoute = async (chainId: ChainId, payload: BuildRoutePayload, signal?: AbortSignal) => {
  const chainSlug = NETWORKS_INFO[chainId].ksSettingRoute

  const resp = await axios.post<BuildRouteResponse>(`${AGGREGATOR_API}/${chainSlug}/api/v1/route/build`, payload, {
    signal,
  })

  if (resp.status === 200) {
    if (resp.data?.data) {
      return resp.data.data
    }

    const err = new Error('Invalid response when building route')
    console.error(err)
    throw err
  }

  const err = new Error('Building route failed')
  console.error(err)
  throw err
}

export default routeApi
