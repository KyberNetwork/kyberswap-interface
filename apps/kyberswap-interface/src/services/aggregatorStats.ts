import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { AGGREGATOR_STATS_API } from 'constants/env'
import { VERSION } from 'constants/v2'

type AggregatorAPR = {
  max_apr: {
    value: number
    id: string
    chain_id: number
    is_farm: boolean
    type?: VERSION.CLASSIC | VERSION.ELASTIC
  }
  total_earnings: number
}

type AggregatorVolume = {
  totalVolume: string
  last24hVolume: string
}

const aggregatorStatsApi = createApi({
  reducerPath: 'aggregatorStatsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${AGGREGATOR_STATS_API}`,
  }),
  endpoints: builder => ({
    getAggregatorAPR: builder.query<AggregatorAPR, unknown>({
      query: () => ({
        url: '/api/max-apr-and-total-earning',
      }),
    }),
    getAggregatorVolume: builder.query<AggregatorVolume, unknown>({
      query: () => ({
        url: '/api/volume',
      }),
    }),
  }),
})

export default aggregatorStatsApi
