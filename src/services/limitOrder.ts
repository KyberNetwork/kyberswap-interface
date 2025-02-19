import { ChainId } from '@kyberswap/ks-sdk-core'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { LimitOrder, LimitOrderFromTokenPair, LimitOrderStatus } from 'components/swapv2/LimitOrder/type'
import { LIMIT_ORDER_API } from 'constants/env'
import { RTK_QUERY_TAGS } from 'constants/index'

const LIMIT_ORDER_API_READ = `${LIMIT_ORDER_API}/read-ks/api`
const LIMIT_ORDER_API_WRITE = `${LIMIT_ORDER_API}/write/api`
const LIMIT_ORDER_API_READ_PARTNER = `${LIMIT_ORDER_API}/read-partner/api`

const mapPath: Partial<Record<LimitOrderStatus, string>> = {
  [LimitOrderStatus.CANCELLED]: 'cancelled',
  [LimitOrderStatus.EXPIRED]: 'expired',
  [LimitOrderStatus.FILLED]: 'filled',
}

const transformResponse = (data: any) => data?.data

const limitOrderApi = createApi({
  reducerPath: 'limitOrderApi',
  baseQuery: fetchBaseQuery({ baseUrl: '' }),
  tagTypes: [RTK_QUERY_TAGS.GET_LIST_ORDERS, RTK_QUERY_TAGS.GET_ORDERS_BY_TOKEN_PAIR],
  endpoints: builder => ({
    getLOConfig: builder.query<
      { contract: string; features: { [address: string]: { supportDoubleSignature: boolean } } },
      ChainId
    >({
      query: chainId => ({
        url: `${LIMIT_ORDER_API_READ}/v1/configs/contract-address`,
        params: { chainId },
      }),
      transformResponse: (data: any) => {
        const features = data?.data?.features || {}
        Object.keys(features).forEach(key => {
          features[key.toLowerCase()] = features[key]
        })
        return { contract: data?.data?.latest?.toLowerCase?.() ?? '', features }
      },
    }),
    getListOrders: builder.query<
      { orders: LimitOrder[]; totalOrder: number },
      {
        chainId: ChainId
        maker: string | undefined
        status: string
        query?: string
        page?: number
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
      providesTags: [RTK_QUERY_TAGS.GET_LIST_ORDERS],
    }),
    getOrdersByTokenPair: builder.query<
      { orders: LimitOrderFromTokenPair[] },
      {
        chainId: ChainId
        makerAsset?: string
        takerAsset?: string
      }
    >({
      query: params => ({
        url: `${LIMIT_ORDER_API_READ_PARTNER}/v1/orders/allchains`,
        params,
      }),
      transformResponse: ({ data }: any) => {
        data.orders.forEach((order: any) => {
          order.chainId = Number(order.chainId) as ChainId
        })
        return { orders: data?.orders || [] }
      },
      async onQueryStarted(agr, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
        } catch {
          dispatch(limitOrderApi.util.upsertQueryData('getOrdersByTokenPair', agr, { orders: [] }))
        }
      },
      providesTags: [RTK_QUERY_TAGS.GET_ORDERS_BY_TOKEN_PAIR],
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
        headers: {
          'x-client-id': body.clientId || 'kyberswap',
        },
      }),
      transformResponse,
      invalidatesTags: [RTK_QUERY_TAGS.GET_LIST_ORDERS],
    }),
    createOrderSignature: builder.mutation<any, any>({
      query: body => ({
        url: `${LIMIT_ORDER_API_WRITE}/v1/orders/sign-message`,
        body,
        method: 'POST',
      }),
      transformResponse,
    }),

    getEncodeData: builder.mutation<any, { orderIds: number[]; isCancelAll?: boolean }>({
      query: ({ orderIds, isCancelAll = false }) => ({
        url: `${LIMIT_ORDER_API_READ}/v1/encode/${isCancelAll ? 'increase-nonce' : 'cancel-batch-orders'}`,
        body: isCancelAll ? {} : { orderIds },
        method: 'POST',
      }),
      transformResponse,
    }),
    ackNotificationOrder: builder.mutation<
      any,
      { docIds: string[]; maker: string; chainId: ChainId; type: LimitOrderStatus }
    >({
      query: ({ maker, chainId, type, docIds }) => ({
        url: `${LIMIT_ORDER_API_WRITE}/v1/events/${mapPath[type]}`,
        body: { maker, chainId: chainId + '', [type === LimitOrderStatus.FILLED ? 'uuids' : 'docIds']: docIds },
        method: 'DELETE',
      }),
      transformResponse,
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

    createCancelOrderSignature: builder.mutation<any, { chainId: string; maker: string; orderIds: number[] }>({
      query: body => ({
        url: `${LIMIT_ORDER_API_WRITE}/v1/orders/cancel-sign`,
        body,
        method: 'POST',
      }),
      transformResponse,
    }),
    cancelOrders: builder.mutation<any, { chainId: string; maker: string; orderIds: number[]; signature: string }>({
      query: body => ({
        url: `${LIMIT_ORDER_API_WRITE}/v1/orders/cancel`,
        body,
        method: 'POST',
      }),
      transformResponse,
      invalidatesTags: [RTK_QUERY_TAGS.GET_LIST_ORDERS],
    }),
  }),
})

export const {
  useGetLOConfigQuery,
  useGetListOrdersQuery,
  useGetOrdersByTokenPairQuery,
  useLazyGetListOrdersQuery,
  useInsertCancellingOrderMutation,
  useGetNumberOfInsufficientFundOrdersQuery,
  useCreateOrderMutation,
  useCreateOrderSignatureMutation,
  useGetEncodeDataMutation,
  useGetTotalActiveMakingAmountQuery,
  useAckNotificationOrderMutation,
  useCreateCancelOrderSignatureMutation,
  useCancelOrdersMutation,
} = limitOrderApi

export default limitOrderApi
