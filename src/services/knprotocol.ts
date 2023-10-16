import { ChainId } from '@kyberswap/ks-sdk-core'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { POOL_FARM_BASE_URL } from 'constants/env'
import { EVM_NETWORK, NETWORKS_INFO } from 'constants/networks'
import { EVMNetworkInfo } from 'constants/networks/type'
import { SubgraphFarmV2 } from 'state/farms/elasticv2/types'

type Token = {
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
  endpoints: builder => ({
    getFarmV2: builder.query<{ data: { data: SubgraphFarmV2[] } }, ChainId>({
      query: (chainId: ChainId) => ({
        url: `/${
          (NETWORKS_INFO[chainId] as EVMNetworkInfo).poolFarmRoute
        }/api/v1/elastic-new/farm-v2?perPage=1000&page=1`,
      }),
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
  }),
})

export default knProtocolApi
export const { useLazyGetFarmV2Query, useLazyGetFarmClassicQuery, useGetPoolClassicQuery } = knProtocolApi
