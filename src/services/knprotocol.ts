import { ChainId } from '@kyberswap/ks-sdk-core'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { POOL_FARM_BASE_URL } from 'constants/env'
import { RTK_QUERY_TAGS } from 'constants/index'
import { EVM_NETWORK, NETWORKS_INFO } from 'constants/networks'
import { EVMNetworkInfo } from 'constants/networks/type'
import { ClassicPoolData } from 'hooks/pool/classic/type'
import { SubgraphFarmV2 } from 'state/farms/elasticv2/types'
import { ElasticPoolDetail } from 'types/pool'

import { AllChainClassicPool, KNToken, transformResponseAllChainAllPool } from './utils/knprotocol'

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
    token0: KNToken
    token1: KNToken
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
  rewardTokens: KNToken[]
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
        url: `/${
          (NETWORKS_INFO[chainId] as EVMNetworkInfo).poolFarmRoute
        }/api/v1/elastic-new/farm-v2?perPage=1000&page=1`,
      }),
      providesTags: [RTK_QUERY_TAGS.GET_FARM_V2],
    }),
    getPoolClassic: builder.query<
      { data: { pools: Omit<AllChainClassicPool, 'protocol'>[] | null | undefined } },
      ChainId
    >({
      query: (chainId: EVM_NETWORK) => ({
        url: `/${NETWORKS_INFO[chainId].poolFarmRoute}/api/v1/classic/pools?includeLowTvl=true&perPage=10000&page=1`,
      }),
    }),
    getFarmClassic: builder.query<{ data: { farmPools: ClassicFarmKN[] } }, ChainId>({
      query: (chainId: EVM_NETWORK) => ({
        url: `/${NETWORKS_INFO[chainId].poolFarmRoute}/api/v1/classic/farm-pools?perPage=1000&page=1`,
      }),
    }),
    getAllPools: builder.query<
      { pools: { [address: string]: ClassicPoolData | ElasticPoolDetail }; pagination: { totalRecords: number } },
      {
        chainIds: EVM_NETWORK[]
        search?: string
        page: number
        size: number
        protocol?: 'elastic' | 'classic'
        sortBy?: 'apr' | 'tvl' | 'volume' | 'fees' | 'myLiquidity'
        sortType?: 'asc' | 'desc'
        timeframe?: '24h' | '7d' | '30d'
        type?: 'farming' | 'stable' | 'lsd' | 'mine'
        account?: string
      }
    >({
      query: ({ chainIds, search, page, size, protocol, type, sortBy, sortType, account, timeframe }) => ({
        url: `/all-chain/api/v1/pools`,
        params: {
          chainNames: chainIds.map(chainId => NETWORKS_INFO[chainId].poolFarmRoute).join(','),
          page,
          perPage: size,
          search,
          protocol,
          type,
          sortBy: ['tvl', 'myLiquidity'].includes(sortBy)
            ? sortBy
            : ['apr', 'volume', 'fees'].includes(sortBy) && timeframe
            ? sortBy + (timeframe === '24h' ? '1d' : timeframe)
            : undefined,
          sortType,
          account,
        },
      }),
      transformResponse: transformResponseAllChainAllPool,
    }),
  }),
})

export default knProtocolApi
export const { useLazyGetFarmV2Query, useLazyGetFarmClassicQuery, useGetPoolClassicQuery, useGetAllPoolsQuery } =
  knProtocolApi
