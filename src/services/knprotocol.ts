import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { POOL_FARM_BASE_URL } from 'constants/env'
import { RTK_QUERY_TAGS } from 'constants/index'
import { EVM_NETWORK, NETWORKS_INFO } from 'constants/networks'
import { EVMNetworkInfo } from 'constants/networks/type'
import { ProtocolType } from 'hooks/farms/useFarmFilters'
import { chainIdByRoute } from 'pages/MyEarnings/utils'
import { SubgraphFarmV2 } from 'state/farms/elasticv2/types'

type TokenKn = {
  id: string
  symbol: string
  name: string
  decimals: string
  priceUSD: string
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
  token0: TokenKn
  token1: TokenKn
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
    token0: TokenKn
    token1: TokenKn
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
  rewardTokens: TokenKn[]
  rewardPerUnits: number[]
  stakedAmount: string
  stakedTvl: string
  apr: string
  version: 1 | 2 | 3
}

interface GetFarmParams {
  account?: string
  perPage: number
  page: number
  chainNames: string
  search?: string
  sortBy?: string
  sortType?: 'asc' | 'decs'
}

interface ElasticPoolKN {
  apr: string
  apr7d: string
  apr30d: string
  farmApr: string
  feeTier: string
  feesUsd: string
  feesUsd7DaysAgo: string
  feesUsd30DaysAgo: string
  feesUsdOneDayAgo: string
  feesUsdTwoDaysAgo: string
  id: string
  liquidity: string
  reinvestL: string
  sqrtPrice: string
  tick: string
  token0: TokenKn
  token1: TokenKn
  totalValueLockedToken0: string
  totalValueLockedToken1: string
  totalValueLockedUsd: string
  totalValueLockedUsdInRange: string
  totalValueLockedUsdOneDayAgo: string
  volumeToken0: string
  volumeToken1: string
  volumeUsd: string
  volumeUsd7DaysAgo: string
  volumeUsd30DaysAgo: string
  volumeUsdOneDayAgo: string
  volumeUsdTwoDaysAgo: string
}

interface FarmKn {
  chain: string
  protocol: string
  id: string
  startTime: string
  endTime: string
  start: string // classic
  end: string // classic
  farm: {
    id: string
  }
  pool: ClassicPoolKN | ElasticPoolKN
  rewardTokens: Array<{
    decimals: string
    id: string
    name: string
    symbol: string
    priceUSD: string
  }>
  stakedTvl: string
  totalRewardAmounts: Array<string>
  apr: string
  isSettled?: boolean
}

export interface NormalizedFarm {
  chain: EVMNetworkInfo
  protocol: ProtocolType
  id: string
  startTime: number
  endTime: number
  farmAddress: string
  token0: Token
  token1: Token
  pool: ClassicPoolKN | ElasticPoolKN
  // rewardTokens: Array<Token>
  stakedTvl: string
  apr: number
  isSettled: boolean
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
    getPoolClassic: builder.query<{ data: { pools: ClassicPoolKN[] } }, ChainId>({
      query: (chainId: EVM_NETWORK) => ({
        url: `/${NETWORKS_INFO[chainId].poolFarmRoute}/api/v1/classic/pools?includeLowTvl=true&perPage=10000&page=1`,
      }),
    }),
    getFarmClassic: builder.query<{ data: { farmPools: ClassicFarmKN[] } }, ChainId>({
      query: (chainId: EVM_NETWORK) => ({
        url: `/${NETWORKS_INFO[chainId].poolFarmRoute}/api/v1/classic/farm-pools?perPage=1000&page=1`,
      }),
    }),

    getFarms: builder.query<{ farmPools: NormalizedFarm[]; pagination: { totalRecords: number } }, GetFarmParams>({
      query: params => ({
        url: `/all-chain/api/v1/farm-pools`,
        params,
      }),
      transformResponse: (response: { data: { farmPools: FarmKn[]; pagination: { totalRecords: number } } }) => {
        const raw = response.data

        const convertTokenBEToTokenSDK = (chainId: ChainId, token: TokenKn) => {
          return new Token(chainId, token.id, +token.decimals, token.symbol, token.name)
        }
        return {
          ...raw,
          farmPools: raw.farmPools.map(farm => ({
            chain: NETWORKS_INFO[chainIdByRoute[farm.chain] || ChainId.MAINNET] as EVMNetworkInfo,
            protocol: farm.protocol as ProtocolType,
            id: farm.id,
            startTime: +farm.startTime || +farm.start,
            endTime: +farm.endTime || +farm.end,
            farmAddress: farm.id.split('_')[0],
            pool: farm.pool,
            token0: convertTokenBEToTokenSDK(chainIdByRoute[farm.chain], farm.pool.token0),
            token1: convertTokenBEToTokenSDK(chainIdByRoute[farm.chain], farm.pool.token1),
            rewardTokens:
              farm.rewardTokens?.map(
                item => new Token(chainIdByRoute[farm.chain], item.id, +item.decimals, item.symbol, item.name),
              ) || [],
            stakedTvl: farm.stakedTvl,
            apr: +farm.pool.apr + +farm.pool.farmApr,
            isSettled: !!farm.isSettled,
          })),
        }
      },
    }),
  }),
})

export default knProtocolApi
export const { useGetFarmsQuery, useLazyGetFarmV2Query, useLazyGetFarmClassicQuery, useGetPoolClassicQuery } =
  knProtocolApi
