import { ChainId } from '@kyberswap/ks-sdk-core'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { Exchange } from 'pages/Earns/constants'
import {
  EarnPool,
  MerklOpportunity,
  PositionHistoryType,
  UserPosition,
  UserPositionsApiResponse,
  UserPositionsStats,
} from 'pages/Earns/types'

interface LandingResponse {
  data: {
    farmingPools: Array<EarnPool>
    highlightedPools: Array<EarnPool>
    solidEarning: Array<EarnPool>
    highAPR: Array<EarnPool>
    lowVolatility: Array<EarnPool>
  }
}

interface SupportedProtocolsResponse {
  code: number
  message: string
  data: {
    chains: {
      [chainId: string]: {
        chainId: number
        protocols: Array<{ id: string; name: string }>
      }
    }
  }
  requestId: string
}

export interface PoolQueryParams {
  chainId?: number
  chainIds?: string
  page?: number
  limit?: number
  interval?: string
  protocol: string
  rewardType?: string
  userAddress?: string
  tag?: string
  sortBy?: string
  orderBy?: string
  q?: string
}

interface PoolQueryResponse {
  code: number
  message: string
  data: {
    pools: Array<EarnPool>
    pagination: {
      totalItems: number
    }
  }
  requestId: string
}

type PoolStatsPeriod = '1d' | '7d' | '30d'

type PoolStatsByPeriod = Partial<Record<PoolStatsPeriod, number>>

export interface PoolDetailToken {
  address: string
  name: string
  symbol: string
  logoURI?: string
  decimals: number
  weight: number
  swappable: boolean
}

interface PoolDetailTick {
  index: number
  liquidityGross: string
  liquidityNet: string
}

interface PoolDetailPositionInfo {
  liquidity: string
  sqrtPriceX96: string
  tickSpacing: number
  tick: number
  ticks: Array<PoolDetailTick>
}

interface PoolAprStats {
  all?: PoolStatsByPeriod
  lp?: PoolStatsByPeriod
  kemLM?: PoolStatsByPeriod
  kemEG?: PoolStatsByPeriod
}

interface PoolDetailStats {
  tvl?: number
  volume24h?: number
  fees24h?: number
  volumeUsd?: PoolStatsByPeriod
  lpFeeUsd?: PoolStatsByPeriod

  apr?: number
  apr24h?: number
  apr30d?: number
  activeApr?: number

  bonusApr?: number
  kemEGApr?: number
  kemLMApr?: number
  activeEgApr?: number
  activeLmApr?: number
  activeFeeApr?: number

  allApr24h?: number
  allApr7d?: number
  allApr30d?: number

  lpApr24h?: number
  lpApr7d?: number
  lpApr30d?: number

  kemLMApr24h?: number
  kemLMApr7d?: number
  kemLMApr30d?: number

  kemEGApr24h?: number
  kemEGApr7d?: number
  kemEGApr30d?: number

  aprStats?: PoolAprStats
}

export interface PoolDetail {
  address: string
  exchange: Exchange
  swapFee: number
  reserveUsd: string
  amplifiedTvl: string

  reserves: Array<string>
  tokens: Array<PoolDetailToken>
  poolStats?: PoolDetailStats
  merklOpportunity?: MerklOpportunity
  positionInfo: PoolDetailPositionInfo

  type?: string
  programs?: string[]
  timestamp?: number
  blockNumber?: number
  staticExtra?: string
}

export type PoolAnalyticsWindow = '24h' | '7d' | '30d'

export type EstimatePositionAprParams = {
  chainId: number
  poolAddress: string
  tickLower: number
  tickUpper: number
  positionLiquidity: string
  positionTvl?: string
}

export type EstimatePositionAprResponse = {
  data: {
    feeApr: number
    egApr: number
    lmApr: number
  }
}

interface PoolChartQueryParams {
  chainId: number
  address: string
  window: PoolAnalyticsWindow
}

interface PositionChartQueryParams {
  chainId: number
  positionId: string
  window: PoolAnalyticsWindow
}

export interface PoolAprHistoryPoint {
  ts: number
  feeApr: number
  lmApr: number
  egApr: number
  bonusApr: number
  totalApr: number
  activeApr?: number
  activeFeeApr?: number
  activeLmApr?: number
  activeEgApr?: number
  volume: number
  tvlUsd: number
}

export interface PoolAprHistoryData {
  chainId: number
  poolAddress: string
  points: Array<PoolAprHistoryPoint>
}

export interface PoolPriceCandle {
  ts: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface PoolPriceData {
  window: PoolAnalyticsWindow
  candles: Array<PoolPriceCandle>
  currentPrice: number
  priceChange: number
}

export interface PoolLiquidityFlowBucket {
  ts: number
  addUsd: number
  removeUsd: number
  tvlUsd: number
}

export interface PoolLiquidityFlowsData {
  window: PoolAnalyticsWindow
  buckets: Array<PoolLiquidityFlowBucket>
}

export interface PoolEarningsBucket {
  ts: number
  lpFeeUsd: number
  lmUsd: number
  egUsd: number
  bonusUsd: number
  totalUsd: number
}

export interface PoolEarningsData {
  window: PoolAnalyticsWindow
  buckets: Array<PoolEarningsBucket>
}

const transformAprHistoryData = (data: PoolAprHistoryData): PoolAprHistoryData => ({
  ...data,
  points: data.points.map(point => ({
    ...point,
    activeApr: point.activeApr !== undefined ? point.activeApr + point.bonusApr : undefined,
    volume: point.volume ?? 0,
  })),
})

export interface PositionQueryParams {
  wallet: string
  chainIds?: string
  protocols?: string
  keyword?: string
  positionIds?: string
  statuses?: string
  sortBy?: string
  orderBy?: string
  page?: number
  pageSize?: number
  useOnFly?: boolean
}

interface PositionHistoryParams {
  chainId: ChainId
  tokenAddress: string
  tokenId: string
  userAddress?: string
}

export interface PositionHistoryTransaction {
  tokenIndex: number
  tokenWithValue: {
    token: {
      symbol: string
      address: string
      logo: string
      decimals: number
      name: string
    }
    balance: string
    price: number
    value: number
  }
}

export interface PositionHistory {
  txHash: string
  type: PositionHistoryType | string
  blockTime: number
  emitContractAddress: string
  gasFeeAmount: number
  gasFeeValue: number
  transactions: PositionHistoryTransaction[]
}

interface AddRemoveFavoriteParams {
  chainId: ChainId
  message: string
  signature: string
  poolAddress: string
  userAddress: string
}

const zapEarnServiceApi = createApi({
  reducerPath: 'zapEarnServiceApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_ZAP_EARN_URL,
  }),
  keepUnusedDataFor: 1,
  endpoints: builder => ({
    explorerLanding: builder.query<LandingResponse, { userAddress?: string }>({
      query: params => ({
        url: `/v1/explorer/landing-page`,
        params,
      }),
    }),
    supportedProtocols: builder.query<SupportedProtocolsResponse, void>({
      query: () => ({
        url: `/v1/protocol`,
      }),
    }),
    poolsExplorer: builder.query<PoolQueryResponse, PoolQueryParams>({
      query: params => ({
        url: `/v1/explorer/pools`,
        params: {
          ...params,
          orderBy: params.orderBy?.toUpperCase() || '',
        },
      }),
      async onQueryStarted(agr, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
        } catch {
          dispatch(
            zapEarnServiceApi.util.upsertQueryData('poolsExplorer', agr, {
              data: { pools: [], pagination: { totalItems: 0 } },
              code: 0,
              message: '',
              requestId: '',
            }),
          )
        }
      },
    }),
    poolDetail: builder.query<PoolDetail, { chainId: number; address: string }>({
      query: params => ({
        url: `/v1/pools`,
        params,
      }),
      transformResponse: (response: { data: PoolDetail }) => response.data,
    }),
    estimatePositionApr: builder.query<EstimatePositionAprResponse, EstimatePositionAprParams>({
      query: ({ chainId, poolAddress, tickLower, tickUpper, positionLiquidity, positionTvl }) => ({
        url: `/v1/apr-estimation`,
        params: {
          poolAddress,
          chainId,
          tickLower,
          tickUpper,
          positionLiquidity,
          positionTvl: positionTvl || '0',
        },
      }),
    }),
    poolAprHistory: builder.query<PoolAprHistoryData, PoolChartQueryParams>({
      query: params => ({
        url: `/v1/pools/apr-history`,
        params,
      }),
      transformResponse: (response: { data: PoolAprHistoryData }) => transformAprHistoryData(response.data),
    }),
    positionAprHistory: builder.query<PoolAprHistoryData, PositionChartQueryParams>({
      query: ({ chainId, positionId, window }) => ({
        url: `/v1/positions/${chainId}/${positionId}/apr-history`,
        params: { window },
      }),
      transformResponse: (response: { data: PoolAprHistoryData }) => transformAprHistoryData(response.data),
    }),
    poolEarnings: builder.query<PoolEarningsData, PoolChartQueryParams>({
      query: params => ({
        url: `/v1/pools/earnings`,
        params,
      }),
      transformResponse: (response: { data: PoolEarningsData }) => response.data,
    }),
    positionEarnings: builder.query<PoolEarningsData, PositionChartQueryParams>({
      query: ({ chainId, positionId, window }) => ({
        url: `/v1/positions/${chainId}/${positionId}/earnings`,
        params: { window },
      }),
      transformResponse: (response: { data: PoolEarningsData }) => response.data,
    }),
    poolPrice: builder.query<PoolPriceData, PoolChartQueryParams>({
      query: params => ({
        url: `/v1/pools/price`,
        params,
      }),
      transformResponse: (response: { data: PoolPriceData }) => response.data,
    }),
    poolLiquidityFlows: builder.query<PoolLiquidityFlowsData, PoolChartQueryParams>({
      query: params => ({
        url: `/v1/pools/liquidity-flows`,
        params,
      }),
      transformResponse: (response: { data: PoolLiquidityFlowsData }) => response.data,
    }),
    userPositions: builder.query<{ positions: Array<UserPosition>; stats?: UserPositionsStats }, PositionQueryParams>({
      query: params => ({
        url: `/v1/positions`,
        params,
      }),
      transformResponse: (response: UserPositionsApiResponse) => ({
        positions: response.data.positions,
        stats: response.data.stats,
      }),
      async onQueryStarted(agr, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
        } catch {
          dispatch(zapEarnServiceApi.util.upsertQueryData('userPositions', agr, { positions: [], stats: undefined }))
        }
      },
    }),
    positionHistory: builder.query<Array<PositionHistory>, PositionHistoryParams>({
      query: params => ({
        url: `/v1/userPositions/positionHistory`,
        params,
      }),
      transformResponse: (response: { data: Array<PositionHistory> }) => response.data,
      async onQueryStarted(agr, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
        } catch {
          dispatch(zapEarnServiceApi.util.upsertQueryData('positionHistory', agr, []))
        }
      },
    }),
    addFavorite: builder.mutation<void, AddRemoveFavoriteParams>({
      query: body => ({
        method: 'POST',
        body,
        url: `/v1/favorite`,
      }),
    }),
    removeFavorite: builder.mutation<void, AddRemoveFavoriteParams>({
      query: body => ({
        method: 'DELETE',
        body,
        url: `/v1/favorite`,
      }),
    }),
  }),
})

export const {
  useExplorerLandingQuery,
  useSupportedProtocolsQuery,
  usePoolsExplorerQuery,
  useLazyPoolsExplorerQuery,
  usePoolDetailQuery,
  useLazyPoolDetailQuery,
  useEstimatePositionAprQuery,
  usePoolAprHistoryQuery,
  usePoolEarningsQuery,
  usePositionAprHistoryQuery,
  usePositionEarningsQuery,
  usePoolPriceQuery,
  usePoolLiquidityFlowsQuery,
  useUserPositionsQuery,
  usePositionHistoryQuery,
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
} = zapEarnServiceApi

export default zapEarnServiceApi
