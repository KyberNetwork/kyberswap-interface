import { ChainId, Currency, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { BigNumber } from 'ethers'

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

export interface ElasticPoolKN {
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

interface Position {
  amount0: string
  amount1: string
  amountUSD: string
  createdAtTimestamp: string
  depositedUSD: string
  id: string
  depositedPosition: {
    farm: string
  }
  joinedPositions: Array<{
    farmId: string
    liquidity: string
    pendingRewards: Array<string>
    pid: string
  }>
  farmV2DepositedPositions: Array<{
    farmId: string
    liquidity: string
    pendingRewards: Array<string>
    range: {
      id: string
    }
  }>

  liquidity: string
  stakedLiq: string // fill added by Fe
  myFarmApr: string
  myPoolApr: string
  outOfRange: false
  pendingFee0: string
  pendingFee1: string
  pendingFeeUSD: string
  pendingRewardUSD: string
  poolID: string
  stakedUSD: string
  tickLower: string
  tickUpper: string
}

interface FarmKn {
  chain: string
  protocol: string
  id: string
  pid: string
  startTime: string
  endTime: string
  start: string // classic
  end: string // classic
  farm: {
    id: string
  }
  pool: ClassicPoolKN | ElasticPoolKN
  positions: Array<Position>
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

  // static:
  rewards: Array<{
    amount: string
    index: number
    token: TokenKn
  }>

  ranges: Array<{
    apr: string
    id: string
    index: number
    isRemoved: boolean
    tickLower: string
    tickUpper: string
    createdAt: number
    updatedAt: number
    weight: string
  }>
}

export interface NormalizedFarm {
  chain: EVMNetworkInfo
  protocol: ProtocolType
  id: string
  pid: string
  fid: string
  startTime: number
  endTime: number
  farmAddress: string
  token0: Token
  token1: Token
  pool: ClassicPoolKN | ElasticPoolKN
  rewardAmounts: Array<CurrencyAmount<Currency>>
  stakedTvl: string
  apr: number
  positions: Array<Position>
  availablePositions: Array<Position>
  isSettled: boolean

  ranges: Array<{
    apr: number
    id: string
    index: number
    isRemoved: boolean
    tickLower: number
    tickUpper: number
    createdAt: number
    updatedAt: number
    weight: number
  }>
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
          farmPools: (raw.farmPools || []).map(farm => {
            let rewardAmounts: Array<CurrencyAmount<Currency>> = []
            if (farm.protocol === ProtocolType.Dynamic) {
              const rewardTokens =
                farm.rewardTokens?.map(
                  item => new Token(chainIdByRoute[farm.chain], item.id, +item.decimals, item.symbol, item.name),
                ) || []

              rewardAmounts = rewardTokens.map((token, index) => {
                let amount = CurrencyAmount.fromRawAmount(token, 0)
                farm.positions?.forEach(item => {
                  const joinedPos = item.joinedPositions?.filter(p => p.pid == farm.pid)
                  amount = amount.add(
                    CurrencyAmount.fromRawAmount(token, joinedPos?.[0]?.pendingRewards?.[index] || '0'),
                  )
                })
                return amount
              })
            }

            if (farm.protocol === ProtocolType.Static) {
              const rewardTokens =
                farm.rewards?.map(
                  rw =>
                    new Token(
                      chainIdByRoute[farm.chain],
                      rw.token.id,
                      +rw.token.decimals,
                      rw.token.symbol,
                      rw.token.name,
                    ),
                ) || []

              rewardAmounts = rewardTokens.map((token, index) => {
                let amount = CurrencyAmount.fromRawAmount(token, 0)
                farm.positions?.forEach(item => {
                  amount = amount.add(
                    CurrencyAmount.fromRawAmount(
                      token,
                      item.farmV2DepositedPositions?.[0]?.pendingRewards?.[index] || '0',
                    ),
                  )
                })
                return amount
              })
            }

            const positions =
              farm?.positions?.map(item => {
                let stakedLiq =
                  item?.joinedPositions?.reduce(
                    (acc, cur) => acc.add(BigNumber.from(cur.liquidity)),
                    BigNumber.from(0),
                  ) || BigNumber.from(0)

                if (farm.protocol === ProtocolType.Static) {
                  const stakedRange =
                    farm.ranges.find(r => item.farmV2DepositedPositions?.[0].range.id === r.id)?.weight || '1'
                  console.log(stakedRange)
                  stakedLiq = BigNumber.from(item.farmV2DepositedPositions?.[0].liquidity || '0').div(
                    BigNumber.from(stakedRange),
                  )
                }
                return {
                  ...item,
                  stakedLiq: stakedLiq.toString(),
                }
              }) || []

            const availablePositions = positions.filter(item =>
              BigNumber.from(item.liquidity).gt(BigNumber.from(item.stakedLiq)),
            )

            return {
              chain: NETWORKS_INFO[chainIdByRoute[farm.chain] || ChainId.MAINNET] as EVMNetworkInfo,
              protocol: farm.protocol as ProtocolType,
              ranges: farm.ranges?.map(item => ({
                ...item,
                tickLower: +item.tickLower,
                tickUpper: +item.tickUpper,
                weight: +item.weight,
                apr: +item.apr,
              })),
              id: farm.id,
              pid: farm.pid,
              fid: farm.id.split('_')[1],
              startTime: +farm.startTime || +farm.start,
              endTime: +farm.endTime || +farm.end,
              farmAddress: farm.id.split('_')[0],
              pool: farm.pool,
              token0: convertTokenBEToTokenSDK(chainIdByRoute[farm.chain], farm.pool.token0),
              token1: convertTokenBEToTokenSDK(chainIdByRoute[farm.chain], farm.pool.token1),
              rewardAmounts,
              stakedTvl: farm.stakedTvl,
              apr: +farm.pool.apr + +farm.pool.farmApr,
              isSettled: !!farm.isSettled,
              positions,
              availablePositions,
            }
          }),
        }
      },
    }),
  }),
})

export default knProtocolApi
export const { useGetFarmsQuery, useLazyGetFarmV2Query, useLazyGetFarmClassicQuery, useGetPoolClassicQuery } =
  knProtocolApi
