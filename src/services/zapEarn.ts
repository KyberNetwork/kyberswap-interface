import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export interface EarnPool {
  exchange: string
  address: string
  type: string
  feeTier: number // need mulpliple with 100 to percent
  chainId: number
  apr: number
  tokens: Array<{
    address: string
    logoURI: string
    symbol: string
  }>
}

interface Response {
  data: {
    highlightedPools: Array<EarnPool>
    solidEarning: Array<EarnPool>
    highAPR: Array<EarnPool>
    lowVolatility: Array<EarnPool>
  }
}

const zapEarnServiceApi = createApi({
  reducerPath: 'zapEarnServiceApi ',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_ZAP_EARN_URL,
  }),
  keepUnusedDataFor: 1,
  endpoints: builder => ({
    explorerLanding: builder.query<Response, void>({
      query: () => ({
        url: `/v1/explorer/landing-page`,
      }),
    }),
  }),
})

export const { useExplorerLandingQuery } = zapEarnServiceApi

export default zapEarnServiceApi
