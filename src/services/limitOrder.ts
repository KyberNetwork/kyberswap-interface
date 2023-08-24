import { ChainId } from '@kyberswap/ks-sdk-core'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { LimitOrder } from 'components/swapv2/LimitOrder/type'
import { LIMIT_ORDER_API_READ, LIMIT_ORDER_API_WRITE } from 'constants/env'

const limitOrderApi = createApi({
  reducerPath: 'limitOrderApi',
  baseQuery: fetchBaseQuery({ baseUrl: '' }),
  endpoints: builder => ({
    getLOContractAddress: builder.query<string, ChainId>({
      query: chainId => ({
        url: `${LIMIT_ORDER_API_READ}/v1/configs/contract-address`,
        params: { chainId },
      }),
      transformResponse: (data: any) => data?.data?.latest ?? '',
    }),
    getListOrders: builder.query<
      { orders: LimitOrder[]; totalOrder: number },
      {
        chainId: ChainId
        maker: string | undefined
        status: string
        query: string
        page: number
        pageSize: number
      }
    >({
      query: params => ({
        url: `${LIMIT_ORDER_API_READ}/v1/orders`,
        params,
      }),
      transformResponse: ({ data }: any) => {
        data.orders.forEach((order: any) => {
          order.chainId = Number(order.chainId) as ChainId
        })
        return { orders: data?.orders || [], totalOrder: data?.pagination?.totalItems || 0 }
      },
    }),
    getNumberOfInsufficientFundOrders: builder.query<number, { chainId: ChainId; maker: string }>({
      query: params => ({
        url: `${LIMIT_ORDER_API_READ}/v1/orders/insufficient-funds`,
        params,
      }),
      transformResponse: (data: any) => data?.data?.total || 0,
    }),
    insertCancellingOrder: builder.mutation<
      any,
      {
        orderIds?: number[]
        nonce?: number
        maker: string
        chainId: string
        txHash: string
        contractAddress: string
      }
    >({
      query: params => ({
        url: `${LIMIT_ORDER_API_WRITE}/v1/orders/cancelling`,
        params,
        method: 'POST',
      }),
    }),
  }),
})

// todo danh (later, move all api to this file)
export const {
  useGetLOContractAddressQuery,
  useGetListOrdersQuery,
  useInsertCancellingOrderMutation,
  useGetNumberOfInsufficientFundOrdersQuery,
} = limitOrderApi

export default limitOrderApi
