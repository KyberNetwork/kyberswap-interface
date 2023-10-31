import { createApi } from '@reduxjs/toolkit/dist/query/react'
import baseQueryOauth from 'services/baseQueryOauth'

import { BFF_API } from 'constants/env'

const coinmarketcapApi = createApi({
  reducerPath: 'coinmarketcapApi',
  baseQuery: baseQueryOauth({
    baseUrl: `${BFF_API}/v1/coinmarketcap`,
  }),
  endpoints: builder => ({
    getLiquidityMarkets: builder.query({
      query: ({ id, category, centerType }) => ({
        url: `/data-api/v3/cryptocurrency/market-pairs/latest`,
        params: {
          id: id,
          start: 1,
          limit: 100,
          category: category || 'spot',
          centerType: centerType || 'all',
          sort: 'volume_24h_strict',
          direction: 'desc',
          spotUntracked: 'true',
        },
      }),
    }),
  }),
})

export const { useGetLiquidityMarketsQuery } = coinmarketcapApi
export default coinmarketcapApi
