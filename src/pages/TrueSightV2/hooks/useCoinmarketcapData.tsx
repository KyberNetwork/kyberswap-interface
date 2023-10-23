import { createApi } from '@reduxjs/toolkit/dist/query/react'
import baseQueryOauth from 'services/baseQueryOauth'

import { BFF_API } from 'constants/env'

//https://kyberswap-bff.dev.kyberengineering.io/api/v1/coinmarketcap/data-api/v3/cryptocurrency/market-pairs/latest?slug=kyber-network-crystal-v2&start=1&limit=15&category=spot&centerType=dex&sort=cmc_rank_advanced&direction=desc&spotUntracked=true&pro=true
const coinmarketcapApi = createApi({
  reducerPath: 'coinmarketcapApi',
  baseQuery: baseQueryOauth({
    baseUrl: `${BFF_API}/v1/coinmarketcap`,
  }),
  endpoints: builder => ({
    getLiquidityMarkets: builder.query({
      query: ({ id, category }) => ({
        url: `/v2/cryptocurrency/market-pairs/latest`,
        params: {
          id: id,
          start: 1,
          limit: 15,
          category: category || 'spot',
          // centerType: centerType || 'all',
          sort: 'cmc_rank_advanced',
          sort_dir: 'desc',
          pro: 'true',
        },
      }),
    }),
  }),
})

export const { useGetLiquidityMarketsQuery } = coinmarketcapApi
export default coinmarketcapApi
