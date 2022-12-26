import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

type SearchResponse = {
  data: {
    id: string
    attributes: {
      pools: {
        address: string
        reserve_in_usd: string
        tokens: [{ symbol: string }, { symbol: string }]
      }[]
    }
  }
}

const geckoTerminalApi = createApi({
  reducerPath: 'geckoTerminalApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:3001/geckoterminal',
  }),
  endpoints: builder => ({
    geckoTerminalSearch: builder.query<SearchResponse, string>({
      query: search => ({
        url: '/api/p1/search',
        params: {
          query: search,
        },
      }),
    }),
  }),
})

export const { useGeckoTerminalSearchQuery } = geckoTerminalApi

export default geckoTerminalApi
