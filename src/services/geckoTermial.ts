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
    // TODO(viet-nv): for testting
    baseUrl: 'https://1a97-2a09-bac1-7ae0-50-00-245-28.ap.ngrok.io/geckoterminal',
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
