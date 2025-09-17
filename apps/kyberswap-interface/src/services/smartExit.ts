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
      SmartExitOrder[],
      {
        chainId: ChainId
        userWallet: string
        status?: string
      }
    >({
      query: ({ chainId, userWallet, status }) => ({
        url: SMART_EXIT_API_URL,
        params: {
          chainId,
          userWallet,
          ...(status && { status }),
        },
      }),
      transformResponse: (data: any) => {
        const orders = data?.data?.orders || data?.orders || data || []

        // Ensure chainId is properly typed
        orders.forEach((order: any) => {
          order.chainId = Number(order.chainId) as ChainId
        })

        return orders
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

    cancelSmartExitOrder: builder.mutation<
      any,
      {
        orderId: string
        chainId: number
        userWallet: string
        signature: string
      }
    >({
      query: ({ orderId, ...body }) => ({
        url: `${SMART_EXIT_API_URL}/${orderId}/cancel`,
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
  useCancelSmartExitOrderMutation,
} = smartExitApi

export default smartExitApi

