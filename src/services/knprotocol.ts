import { ChainId } from '@kyberswap/ks-sdk-core'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { POOL_FARM_BASE_URL } from 'constants/env'
import { RTK_QUERY_TAGS } from 'constants/index'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { SubgraphFarmV2 } from 'state/farms/elasticv2/types'
import { ElasticPool, RawToken } from 'state/prommPools/useGetElasticPools/useGetElasticPoolsV2'

type Token = {
  id: string
  symbol: string
  name: string
  decimals: string
  priceUSD: string
}

export type FarmingPool = {
  id: string
  pid: string
  startTime: string
  endTime: string
  feeTarget: string
  farm: {
    id: string // address of fair launch contract
  }
  rewardTokensIds: string[]
  totalRewardAmounts: string[]
  pool: ElasticPool
  rewardTokens: RawToken[]
  stakedTvl: string
  apr: string
}

export type ClassicPoolKN = {
  id: string
  fee: string
  feeUSD: string
  feesUsdOneDayAgo: string
  feesUsdTwoDaysAgo: string
  feeUSD0: string
  feeUSD1: string
  feeAmount0: string
  feeAmount1: string
  token0: Token
  token1: Token
  reserve0: string
  reserve1: string
  vReserve0: string
  vReserve1: string
  totalSupply: string
  pair: string
  reserveUSD: string
  volumeUsd: string
  volumeUsdOneDayAgo: string
  volumeUsdTwoDaysAgo: string
  amp: string
  apr: string
  farmApr: string
}

export type ClassicFarmKN = {
  id: string
  pid: string
  start: string
  end: string
  rewardTokensIds: string[]
  pool: {
    id: string
    feeUSD: string
    feesUsdOneDayAgo: string
    feesUsdTwoDaysAgo: string
    feeUSD0: string
    feeUSD1: string
    feeAmount0: string
    feeAmount1: string
    token0: Token
    token1: Token
    reserve0: string
    reserve1: string
    vReserve0: string
    vReserve1: string
    totalSupply: string
    pair: string
    reserveUSD: string
    volumeUsd: string
    volumeUsdOneDayAgo: string
    volumeUsdTwoDaysAgo: string
    fee: string
    amp: string
    apr: string
    farmApr: string
  }
  rewardTokens: Token[]
  rewardPerUnits: number[]
  stakedAmount: string
  stakedTvl: string
  apr: string
  version: 1 | 2 | 3
}

const knProtocolApi = createApi({
  reducerPath: 'knProtocol',
  baseQuery: fetchBaseQuery({ baseUrl: POOL_FARM_BASE_URL }),
  tagTypes: [RTK_QUERY_TAGS.GET_FARM_V2],
  endpoints: builder => ({
    getFarmV2: builder.query<{ data: { data: SubgraphFarmV2[] } }, ChainId>({
      query: (chainId: ChainId) => ({
        url: `/${NETWORKS_INFO[chainId].poolFarmRoute}/api/v1/elastic-new/farm-v2?perPage=1000&page=1`,
      }),
      providesTags: [RTK_QUERY_TAGS.GET_FARM_V2],
    }),
    getFarmPools: builder.query<FarmingPool[], ChainId>({
      query: (chainId: ChainId) => ({
        url: `/${NETWORKS_INFO[chainId].poolFarmRoute}/api/v1/elastic-new/farm-pools`,
        params: { page: 1, perPage: 1000 },
      }),
      transformResponse: (res: CommonPagingRes<{ farmPools: FarmingPool[] }>) => res.data.farmPools,
    }),
    getPoolElastic: builder.query<ElasticPool[], { chainId: ChainId; thisParamToForceRefresh: boolean }>({
      query: ({ chainId, thisParamToForceRefresh }) => ({
        url: `/${NETWORKS_INFO[chainId].poolFarmRoute}/api/v1/elastic-new/pools`,
        params: { page: 1, perPage: 1000, includeLowTvl: true, thisParamToForceRefresh },
      }),
      transformResponse: (res: CommonPagingRes<{ pools: ElasticPool[] }>) => res.data.pools,
    }),
    getPoolClassic: builder.query<{ data: { pools: ClassicPoolKN[] } }, ChainId>({
      query: (chainId: ChainId) => ({
        url: `/${NETWORKS_INFO[chainId].poolFarmRoute}/api/v1/classic/pools?includeLowTvl=true&perPage=10000&page=1`,
      }),
    }),
    getFarmClassic: builder.query<{ data: { farmPools: ClassicFarmKN[] } }, ChainId>({
      query: (chainId: ChainId) => ({
        url: `/${NETWORKS_INFO[chainId].poolFarmRoute}/api/v1/classic/farm-pools?perPage=1000&page=1`,
      }),
    }),
  }),
})

export default knProtocolApi
export const { useLazyGetFarmV2Query, useLazyGetFarmClassicQuery, useGetPoolClassicQuery } = knProtocolApi
