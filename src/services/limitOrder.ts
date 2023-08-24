import { ChainId } from '@kyberswap/ks-sdk-core'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { LimitOrder, LimitOrderStatus } from 'components/swapv2/LimitOrder/type'
import { LIMIT_ORDER_API_READ, LIMIT_ORDER_API_WRITE } from 'constants/env'

const mapPath: Partial<Record<LimitOrderStatus, string>> = {
  [LimitOrderStatus.CANCELLED]: 'cancelled',
  [LimitOrderStatus.EXPIRED]: 'expired',
  [LimitOrderStatus.FILLED]: 'filled',
}

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
      query: body => ({
        url: `${LIMIT_ORDER_API_WRITE}/v1/orders/cancelling`,
        body,
        method: 'POST',
      }),
    }),
    createOrder: builder.mutation<{ id: number }, any>({
      query: body => ({
        url: `${LIMIT_ORDER_API_WRITE}/v1/orders`,
        body,
        method: 'POST',
      }),
      transformResponse: (data: any) => data?.data,
    }),
    createOrderSignature: builder.mutation<any, any>({
      query: body => ({
        url: `${LIMIT_ORDER_API_WRITE}/v1/orders/sign-message`,
        body,
        method: 'POST',
      }),
      transformResponse: (data: any) => data?.data,
    }),
    getEncodeData: builder.mutation<any, { orderIds: number[]; isCancelAll?: boolean }>({
      query: ({ orderIds, isCancelAll = false }) => ({
        url: `${LIMIT_ORDER_API_READ}/v1/encode/${isCancelAll ? 'increase-nonce' : 'cancel-batch-orders'}`,
        body: isCancelAll ? {} : { orderIds },
        method: 'POST',
      }),
      transformResponse: (data: any) => data?.data,
    }),
    ackNotificationOrder: builder.mutation<
      any,
      { docIds: string[]; maker: string; chainId: ChainId; type: LimitOrderStatus }
    >({
      // todo test
      query: ({ maker, chainId, type, docIds }) => ({
        url: `${LIMIT_ORDER_API_WRITE}/v1/events/${mapPath[type]}`,
        body: { maker, chainId: chainId + '', [type === LimitOrderStatus.FILLED ? 'uuids' : 'docIds']: docIds },
        method: 'DELETE',
      }),
      transformResponse: (data: any) => data?.data,
    }),
    getTotalActiveMakingAmount: builder.query<string, { chainId: ChainId; tokenAddress: string; account: string }>({
      query: ({ chainId, tokenAddress, account }) => ({
        url: `${LIMIT_ORDER_API_READ}/v1/orders/active-making-amount`,
        params: {
          chainId: chainId + '',
          makerAsset: tokenAddress,
          maker: account,
        },
      }),
      transformResponse: (data: any) => data?.data?.activeMakingAmount,
    }),
  }),
})

export const {
  useGetLOContractAddressQuery,
  useGetListOrdersQuery,
  useInsertCancellingOrderMutation,
  useGetNumberOfInsufficientFundOrdersQuery,
  useCreateOrderMutation,
  useCreateOrderSignatureMutation,
  useGetEncodeDataMutation,
  useGetTotalActiveMakingAmountQuery,
  useAckNotificationOrderMutation,
} = limitOrderApi

export default limitOrderApi
