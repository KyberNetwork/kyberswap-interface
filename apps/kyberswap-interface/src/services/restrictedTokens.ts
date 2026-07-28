import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { TOKEN_API_URL } from 'constants/env'

export interface RestrictedToken {
  id: number
  countryCode: string
  // API returns chainId as a string (e.g. "1")
  chainId: string
  address: string
  createdAt: number
  updatedAt: number
}

interface RestrictedTokensResponse {
  code: number
  message: string
  data: {
    tokens: RestrictedToken[]
  }
}

const restrictedTokensApi = createApi({
  reducerPath: 'restrictedTokensApi',
  baseQuery: fetchBaseQuery({
    baseUrl: TOKEN_API_URL,
  }),
  // The restricted list changes rarely; keep it cached for the session.
  keepUnusedDataFor: 3600,
  endpoints: builder => ({
    getRestrictedTokens: builder.query<RestrictedToken[], { countryCode: string }>({
      query: ({ countryCode }) => ({
        url: '/v1/public/restricted-tokens',
        params: { countryCode },
      }),
      transformResponse: (response: RestrictedTokensResponse) => response?.data?.tokens ?? [],
    }),
  }),
})

export const { useGetRestrictedTokensQuery } = restrictedTokensApi

export default restrictedTokensApi
