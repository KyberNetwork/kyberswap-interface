import { ChainId } from '@kyberswap/ks-sdk-core'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { RTK_QUERY_TAGS } from 'constants/index'

export interface SmartExitOrder {
  id: string
  chainId: number
  userWallet: string
  dexType: string
  poolId: string
  positionId: string
  removeLiquidity: string
  unwrap: boolean
  condition: {
    logical: {
      op: 'and' | 'or'
      conditions: Array<{
        field: {
          type: 'time' | 'pool_price' | 'fee_yield'
          value: any
        }
      }>
    }
  }
  status: 'open' | 'done' | 'cancelled' | 'expired'
  createdAt: number
  updatedAt: number
  deadline: number
}

const SMART_EXIT_API_URL = 'https://pre-conditional-order.kyberengineering.io/api/v1/orders/smart-exit'

const smartExitApi = createApi({
  reducerPath: 'smartExitApi',
  baseQuery: fetchBaseQuery({ baseUrl: '' }),
  tagTypes: [RTK_QUERY_TAGS.GET_SMART_EXIT_ORDERS],
  endpoints: builder => ({
    getSmartExitOrders: builder.query<
      {
        orders: SmartExitOrder[]
        totalItems: number
        totalPages: number
        currentPage: number
        pageSize: number
      },
      {
        chainIds?: string
        userWallet: string
        status?: string
        dexTypes?: string
        page?: number
        pageSize?: number
      }
    >({
      query: ({ chainIds, dexTypes, userWallet, status, page = 1, pageSize = 10 }) => ({
        url: SMART_EXIT_API_URL,
        params: {
          userWallet,
          ...(status && { status }),
          ...(dexTypes && { dexTypes }),
          ...(chainIds && { chainIds }),
          page,
          pageSize,
        },
      }),
      transformResponse: (data: any) => {
        console.log(data)
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
      {
        chainId: number
        userWallet: string
        dexType: string
        poolId: string
        positionId: string
        removeLiquidity: string
        unwrap: boolean
        permitData: string
        condition: {
          logical: {
            op: 'and' | 'or'
            conditions: Array<{
              field: {
                type: 'time' | 'pool_price' | 'fee_yield'
                value: any
              }
            }>
          }
        }
        signature: string
        deadline: number
      }
    >({
      query: body => ({
        url: SMART_EXIT_API_URL,
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

    getSmartExitSignMessage: builder.mutation<
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
        dexType: string
        poolId: string
        positionId: string
        removeLiquidity: string
        unwrap: boolean
        permitData: string
        condition: {
          logical: {
            op: 'and' | 'or'
            conditions: Array<{
              field: {
                type: 'time' | 'pool_price' | 'fee_yield'
                value: any
              }
            }>
          }
        }
      }
    >({
      query: body => ({
        url: `${SMART_EXIT_API_URL}/sign-message`,
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
        url: `${SMART_EXIT_API_URL}/cancel/sign-message`,
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
        url: `${SMART_EXIT_API_URL}/cancel`,
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
  useGetSmartExitOrdersQuery,
  useLazyGetSmartExitOrdersQuery,
  useCreateSmartExitOrderMutation,
  useGetSmartExitSignMessageMutation,
  useGetSmartExitCancelSignMessageMutation,
  useCancelSmartExitOrderMutation,
} = smartExitApi

export default smartExitApi
