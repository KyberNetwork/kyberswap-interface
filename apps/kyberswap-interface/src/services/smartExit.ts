import { ChainId } from '@kyberswap/ks-sdk-core'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { SMART_EXIT_API_URL } from 'constants/env'
import { RTK_QUERY_TAGS } from 'constants/index'
import { SmartExitCondition, SmartExitFee, SmartExitOrder } from 'pages/Earns/types'

interface SmartExitOrderResponse {
  orders: SmartExitOrder[]
  totalItems: number
  totalPages: number
  currentPage: number
  pageSize: number
}

interface SmartExitOrderParams {
  chainIds?: string
  userWallet: string
  status?: string
  dexTypes?: string
  page?: number
  pageSize?: number
  positionIds?: string[]
}

export interface SmartExitFeeParams {
  chainId: number
  userWallet: string
  dexType: string
  poolId: string
  positionId: string
  removeLiquidity: string
  unwrap: boolean
  condition: SmartExitCondition
  deadline: number
}

export interface SmartExitConfig {
  smartIntentAddress: string
  supportedDexes: Record<string, number[]>
  enums: {
    dexType: Array<{ key: string; index: number }>
    orderStatus: Array<{ key: string; index: number }>
    orderType: Array<{ key: string; index: number }>
  }
}

const smartExitApi = createApi({
  reducerPath: 'smartExitApi',
  baseQuery: fetchBaseQuery({ baseUrl: SMART_EXIT_API_URL }),
  tagTypes: [RTK_QUERY_TAGS.GET_SMART_EXIT_ORDERS],
  endpoints: builder => ({
    getSmartExitConfig: builder.query<SmartExitConfig, ChainId>({
      query: chainId => ({
        url: '/v1/configs/public',
        params: { chainId },
      }),
      transformResponse: (data: any): SmartExitConfig => ({
        smartIntentAddress: data?.data?.config?.smartIntentAddress ?? '',
        supportedDexes: data?.data?.config?.supportedDexes ?? {},
        enums: data?.data?.config?.enums ?? { dexType: [], orderStatus: [], orderType: [] },
      }),
    }),

    getSmartExitOrders: builder.query<SmartExitOrderResponse, SmartExitOrderParams>({
      query: ({ chainIds, dexTypes, userWallet, status, page = 1, pageSize = 10, positionIds }) => {
        const params = new URLSearchParams({
          userWallet,
          page: page.toString(),
          pageSize: pageSize.toString(),
        })

        if (status) params.append('status', status)
        if (dexTypes) params.append('dexTypes', dexTypes)
        if (chainIds) params.append('chainIds', chainIds)

        // Handle array by appending each value separately
        if (positionIds) {
          positionIds.forEach(id => params.append('positionIds', id))
        }

        return {
          url: `/v1/orders/smart-exit?${params.toString()}`,
        }
      },
      transformResponse: (data: any) => {
        const orders = data?.data?.orders || []
        const totalItems = data?.data?.pagination?.totalItems || orders.length

        // Ensure chainId is properly typed
        orders.forEach((order: any) => {
          order.chainId = Number(order.chainId) as ChainId
        })

        return {
          orders,
          totalItems,
          totalPages: Math.ceil(totalItems / (data?.data?.pageSize || data?.pageSize || 10)),
          currentPage: data?.data?.currentPage || data?.currentPage || 1,
          pageSize: data?.data?.pageSize || data?.pageSize || 10,
        }
      },
      providesTags: [RTK_QUERY_TAGS.GET_SMART_EXIT_ORDERS],
    }),

    createSmartExitOrder: builder.mutation<
      { id: string; orderId: string },
      SmartExitFeeParams & { signature: string; maxGasPercentage: number; permitData: string }
    >({
      query: body => ({
        url: '/v1/orders/smart-exit',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      }),
      transformResponse: (data: any) => ({
        id: data?.data?.id || data?.id,
        orderId: data?.data?.orderId || data?.orderId,
      }),
      invalidatesTags: [RTK_QUERY_TAGS.GET_SMART_EXIT_ORDERS],
    }),

    estimateSmartExitFee: builder.mutation<SmartExitFee, SmartExitFeeParams>({
      query: body => ({
        url: '/v1/orders/smart-exit/estimate-fee',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      }),
      transformResponse: (data: any) => ({
        protocol: data?.data?.protocol ?? {},
        gas: data?.data?.gas ?? {},
      }),
    }),

    getSmartExitSignMessage: builder.mutation<
      {
        message: {
          domain: any
          types: any
          message: any
          primaryType: string
        }
      },
      SmartExitFeeParams & { maxFeesPercentage?: number[] }
    >({
      query: body => ({
        url: '/v1/orders/smart-exit/sign-message',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      }),
      transformResponse: (data: any) => ({
        message: data?.data || data?.message,
      }),
    }),

    getSmartExitCancelSignMessage: builder.mutation<
      {
        message: {
          domain: any
          types: any
          message: any
          primaryType: string
        }
      },
      {
        chainId: number
        userWallet: string
        orderId: number
      }
    >({
      query: body => ({
        url: `/v1/orders/smart-exit/cancel/sign-message`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      }),
      transformResponse: (data: any) => ({
        message: data?.data || data?.message,
      }),
    }),

    cancelSmartExitOrder: builder.mutation<
      any,
      {
        orderId: number
        chainId: number
        userWallet: string
        signature: string
      }
    >({
      query: body => ({
        url: `/v1/orders/smart-exit/cancel`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      }),
      invalidatesTags: [RTK_QUERY_TAGS.GET_SMART_EXIT_ORDERS],
    }),
  }),
})

export const {
  useGetSmartExitConfigQuery,
  useGetSmartExitOrdersQuery,
  useLazyGetSmartExitOrdersQuery,
  useCreateSmartExitOrderMutation,
  useGetSmartExitSignMessageMutation,
  useGetSmartExitCancelSignMessageMutation,
  useCancelSmartExitOrderMutation,
  useEstimateSmartExitFeeMutation,
} = smartExitApi

export default smartExitApi
