import { createApi } from '@reduxjs/toolkit/query/react'
import baseQueryOauth from 'services/baseQueryOauth'

import { BFF_API } from 'constants/env'
import { TOKEN_SCORE_TTL } from 'constants/index'

import { GetTokenScoreParams, GetTokenScoreResponse } from './types'

const tokenApi = createApi({
  reducerPath: 'tokenApi',
  baseQuery: baseQueryOauth({ baseUrl: BFF_API }),
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
      keepUnusedDataFor: TOKEN_SCORE_TTL,
    }),
  }),
})

export default tokenApi
