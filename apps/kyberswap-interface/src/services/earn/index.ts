import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type {
  AddRemoveFavoriteParams,
  EstimatePositionAprParams,
  EstimatePositionAprResponse,
  LandingResponse,
  PoolAprHistoryData,
  PoolChartQueryParams,
  PoolDetail,
  PoolEarningsData,
  PoolLiquidityFlowsData,
  PoolPriceData,
  PoolQueryParams,
  PoolQueryResponse,
  PositionChartQueryParams,
  PositionHistory,
  PositionHistoryParams,
  PositionQueryParams,
  SupportedProtocolsResponse,
} from 'services/earn/types'
import { transformAprHistoryData, transformEarningsData } from 'services/earn/utils'

import type { UserPosition, UserPositionsApiResponse, UserPositionsStats } from 'pages/Earns/types'

const earnServiceApi = createApi({
  reducerPath: 'earnServiceApi',
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
            earnServiceApi.util.upsertQueryData('poolsExplorer', agr, {
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
      transformResponse: (response: { data: PoolEarningsData }, _meta, arg) =>
        transformEarningsData(response.data, arg.window),
    }),
    positionEarnings: builder.query<PoolEarningsData, PositionChartQueryParams>({
      query: ({ chainId, positionId, window }) => ({
        url: `/v1/positions/${chainId}/${positionId}/earnings`,
        params: { window },
      }),
      transformResponse: (response: { data: PoolEarningsData }, _meta, arg) =>
        transformEarningsData(response.data, arg.window),
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
          dispatch(earnServiceApi.util.upsertQueryData('userPositions', agr, { positions: [], stats: undefined }))
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
          dispatch(earnServiceApi.util.upsertQueryData('positionHistory', agr, []))
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
} = earnServiceApi

export default earnServiceApi
