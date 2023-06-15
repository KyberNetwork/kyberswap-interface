import { ChainId } from '@kyberswap/ks-sdk-core'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { NETWORKS_INFO } from 'constants/networks'
import {
  aggregateAccountEarnings,
  aggregatePoolEarnings,
  fillEmptyDaysForPositionEarnings,
} from 'pages/MyEarnings/utils'

export type TokenEarning = {
  token: string
  amount: string
  decimals: string
  amountUSD: string
  amountFloat: string
}

export type HistoricalSingleData = {
  day: number
  block: number
  fees: Array<TokenEarning> | null
  rewards: Array<TokenEarning> | null
  total: Array<TokenEarning> | null
}

export type PoolDetails = {
  id: string
  token0: {
    id: string
    symbol: string
    name: string
    decimals: string
  }
  token1: {
    id: string
    symbol: string
    name: string
    decimals: string
  }
  feeTier: string
  liquidity: string
  reinvestL: string
  sqrtPrice: string
  tick: string
  volumeUsd: string
  feesUsd: string
  totalValueLockedUsd: string
  feesUsdOneDayAgo: string
  volumeUsdOneDayAgo: string
  totalValueLockedUsdInRange: string
  apr: string
  farmApr: string
}

export type HistoricalEarning = {
  historicalEarning: HistoricalSingleData[]
}

export type PoolEarningWithDetails = PoolDetails & HistoricalEarning

export type PositionEarningWithDetails = {
  id: string
  owner: string
  ownerOriginal: string
  pool: PoolDetails
  token0: string
  token1: string
  tickLower: string
  tickUpper: string
  liquidity: string
  feeGrowthInsideLast: string
} & HistoricalEarning

type MetaResponse<T> = {
  code: number
  message: string
  data?: T
}

export type GetEarningDataResponse = Record<
  string,
  {
    positions: PositionEarningWithDetails[]
    pools: PoolEarningWithDetails[]
    account: HistoricalSingleData[]
  }
>

type Params = {
  account: string
  chainIds: ChainId[]
}
const earningApi = createApi({
  reducerPath: 'earningApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://pool-farm.dev.kyberengineering.io' }),
  endpoints: builder => ({
    getElasticEarning: builder.query<GetEarningDataResponse, Params>({
      query: ({ account, chainIds }) => ({
        url: `/all-chain/api/v1/elastic/portfolio`,
        params: {
          account,
          chainNames: chainIds.map(chainId => NETWORKS_INFO[chainId].aggregatorRoute),
        },
      }),
      transformResponse: (response: MetaResponse<GetEarningDataResponse>) => {
        return aggregateAccountEarnings(
          aggregatePoolEarnings(fillEmptyDaysForPositionEarnings(response.data as GetEarningDataResponse)),
        ) as GetEarningDataResponse
      },
      keepUnusedDataFor: 300, // 5 minutes
    }),
    getElasticLegacyEarning: builder.query<GetEarningDataResponse, Params>({
      query: ({ account, chainIds }) => ({
        url: `/all-chain/api/v1/elastic-legacy/portfolio`,
        params: {
          account,
          chainNames: chainIds.map(chainId => NETWORKS_INFO[chainId].aggregatorRoute),
        },
      }),
      transformResponse: (response: MetaResponse<GetEarningDataResponse>) => {
        return aggregateAccountEarnings(
          aggregatePoolEarnings(fillEmptyDaysForPositionEarnings(response.data as GetEarningDataResponse)),
        ) as GetEarningDataResponse
      },
      keepUnusedDataFor: 300, // 5 minutes
    }),
  }),
})

export default earningApi
export const {
  useGetElasticEarningQuery,
  useGetElasticLegacyEarningQuery,

  useLazyGetElasticEarningQuery,
  useLazyGetElasticLegacyEarningQuery,
} = earningApi
