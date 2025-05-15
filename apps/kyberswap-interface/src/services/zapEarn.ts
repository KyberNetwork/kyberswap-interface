import { ChainId } from '@kyberswap/ks-sdk-core'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { DEX_FILTER_MAPPING } from 'pages/Earns/constants'
import { EarnPool, EarnPosition, PositionHistoryType } from 'pages/Earns/types'

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
  chainId: ChainId
  page?: number
  limit?: number
  interval: string
  protocol: string
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

export interface PositionQueryParams {
  addresses: string
  chainIds: string
  protocols: string
  q?: string
  positionId?: string
}

interface PositionHistoryParams {
  chainId: ChainId
  tokenAddress: string
  tokenId: string
  userAddress?: string
}

export interface PositionHistory {
  txHash: string
  type: PositionHistoryType
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
          protocol: DEX_FILTER_MAPPING[params.protocol as keyof typeof DEX_FILTER_MAPPING]
            ? DEX_FILTER_MAPPING[params.protocol as keyof typeof DEX_FILTER_MAPPING].join(',')
            : params.protocol,
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
    userPositions: builder.query<Array<EarnPosition>, PositionQueryParams>({
      query: params => ({
        url: `/v1/userPositions`,
        params,
      }),
      transformResponse: (response: {
        data: {
          positions: Array<EarnPosition>
        }
      }) => response.data.positions,
      async onQueryStarted(agr, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
        } catch {
          dispatch(zapEarnServiceApi.util.upsertQueryData('userPositions', agr, []))
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
  useUserPositionsQuery,
  usePositionHistoryQuery,
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
} = zapEarnServiceApi

export default zapEarnServiceApi
