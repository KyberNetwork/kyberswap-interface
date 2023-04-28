import { createApi } from '@reduxjs/toolkit/query/react'
import baseQueryOauth from 'services/baseQueryOauth'

import { KS_SETTING_API } from 'constants/env'

import { GetTokenScoreParams, GetTokenScoreResponse } from './types'

const tokenApi = createApi({
  reducerPath: 'tokenApi',
  baseQuery: baseQueryOauth({ baseUrl: KS_SETTING_API }),
  endpoints: builder => ({
    getTokenScore: builder.query<
      GetTokenScoreResponse,
      {
        params: GetTokenScoreParams
        authentication: boolean
      }
    >({
      query: ({ params, authentication }) => ({
        url: '/v1/tokens/score',
        params,
        authentication,
      }),
      keepUnusedDataFor: 86400,
    }),
  }),
})

export default tokenApi
