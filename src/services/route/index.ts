import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { AGGREGATOR_API } from 'constants/env'

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

export default routeApi
