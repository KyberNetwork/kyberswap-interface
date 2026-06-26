import { ChainId } from '@kyberswap/ks-sdk-core'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { CancelOrderResponse, LimitOrder, LimitOrderFromTokenPair, LimitOrderStatus } from 'components/LimitOrder/types'
import { LIMIT_ORDER_API } from 'constants/env'
import { RTK_QUERY_TAGS } from 'constants/index'
import { isSupportedChainId } from 'constants/networks'

const LIMIT_ORDER_API_READ = `${LIMIT_ORDER_API}/read-ks/api`
const LIMIT_ORDER_API_WRITE = `${LIMIT_ORDER_API}/write/api`
const LIMIT_ORDER_API_READ_PARTNER = `${LIMIT_ORDER_API}/read-partner/api`

const mapPath: Partial<Record<LimitOrderStatus, string>> = {
  [LimitOrderStatus.CANCELLED]: 'cancelled',
  [LimitOrderStatus.EXPIRED]: 'expired',
  [LimitOrderStatus.FILLED]: 'filled',
}

type ApiEnvelope<T> = {
  code: number
  message: string
  data: T
}

type LimitOrderConfigResponse = {
  latest?: string
  features?: Record<string, { supportDoubleSignature: boolean }>
}

type LimitOrderConfig = {
  contract: string
  features: Record<string, { supportDoubleSignature: boolean }>
}

type ListOrdersResponse = {
  orders?: LimitOrder[]
  pagination?: {
    totalItems?: number
  }
}

type TokenPairOrdersResponse = {
  orders?: LimitOrderFromTokenPair[]
}

type NumberOfInsufficientFundOrdersResponse = {
  total?: number
}

type ActiveMakingAmountResponse = {
  activeMakingAmount?: string
}

type EncodeDataResponse = {
  encodedData: string
}

export type CreateOrderBody = {
  chainId: string
  makerAsset?: string
  takerAsset?: string
  maker?: string
  makingAmount?: string
  takingAmount?: string
  expiredAt: number
  nativeOutput: boolean
  referral?: string
  salt: string
  signature: string
  clientId?: string | null
}

export type CreateOrderSignatureBody = Omit<CreateOrderBody, 'salt' | 'signature' | 'clientId'>

export type CreateOrderSignatureResponse = {
  domain: unknown
  types: Record<string, unknown>
  primaryType: string
  message: { salt?: string } & Record<string, unknown>
}

export type CreateCancelOrderSignatureResponse = {
  domain: unknown
  types: Record<string, unknown>
  primaryType: string
  message: Record<string, unknown>
}

export type InsertCancellingOrderBody = {
  orderIds?: number[]
  nonce?: number
  maker: string
  chainId: string
  txHash: string
  contractAddress: string
}

export type OperatorSignature = {
  id: number
  chainId: string
  operatorSignature: string
  operatorSignatureExpiredAt: number
}

export type FillOrderBody = {
  orderId: number
  takingAmount: string
  thresholdAmount: string
  target: string
  operatorSignature: string
}

const transformResponse = <T>(data: ApiEnvelope<T>) => data.data

const normalizeSupportedLimitOrders = (orders: LimitOrder[] = []) =>
  orders.reduce<LimitOrder[]>((accumulator, order) => {
    const chainId = Number(order.chainId)
    if (!isSupportedChainId(chainId)) return accumulator

    accumulator.push({ ...order, chainId })
    return accumulator
  }, [])

const limitOrderApi = createApi({
  reducerPath: 'limitOrderApi',
  baseQuery: fetchBaseQuery({ baseUrl: '' }),
  tagTypes: [
    RTK_QUERY_TAGS.GET_LIMIT_ORDER_LIST,
    RTK_QUERY_TAGS.GET_LIMIT_ORDER_BOOK,
    RTK_QUERY_TAGS.GET_LIMIT_ORDER_INSUFFICIENT,
    RTK_QUERY_TAGS.GET_LIMIT_ORDER_ACTIVE_MAKING_AMOUNT,
  ],
  endpoints: builder => ({
    getLOConfig: builder.query<LimitOrderConfig, ChainId>({
      query: chainId => ({
        url: `${LIMIT_ORDER_API_READ}/v1/configs/contract-address`,
        params: { chainId },
      }),
      transformResponse: ({ data }: ApiEnvelope<LimitOrderConfigResponse>) => {
        const features = Object.entries(data.features ?? {}).reduce<LimitOrderConfig['features']>(
          (accumulator, [key, value]) => {
            accumulator[key.toLowerCase()] = value
            return accumulator
          },
          {},
        )
        return { contract: data.latest?.toLowerCase() ?? '', features }
      },
    }),
    getListOrders: builder.query<
      { orders: LimitOrder[]; totalOrder: number },
      {
        chainId?: ChainId
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
      transformResponse: ({ data }: ApiEnvelope<ListOrdersResponse>) => {
        const rawOrders = data.orders || []
        const orders = normalizeSupportedLimitOrders(rawOrders)
        const totalOrder = Math.max(
          (data.pagination?.totalItems || 0) - (rawOrders.length - orders.length),
          orders.length,
        )

        return { orders, totalOrder }
      },
      providesTags: [RTK_QUERY_TAGS.GET_LIMIT_ORDER_LIST],
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
      transformResponse: ({ data }: ApiEnvelope<TokenPairOrdersResponse>) => {
        data.orders?.forEach(order => {
          order.chainId = Number(order.chainId) as ChainId
        })
        return { orders: data?.orders || [] }
      },
      providesTags: [RTK_QUERY_TAGS.GET_LIMIT_ORDER_BOOK],
    }),
    getNumberOfInsufficientFundOrders: builder.query<number, { chainId: ChainId; maker: string }>({
      query: params => ({
        url: `${LIMIT_ORDER_API_READ}/v1/orders/insufficient-funds`,
        params,
      }),
      transformResponse: ({ data }: ApiEnvelope<NumberOfInsufficientFundOrdersResponse>) => data.total || 0,
      providesTags: [RTK_QUERY_TAGS.GET_LIMIT_ORDER_INSUFFICIENT],
    }),
    insertCancellingOrder: builder.mutation<unknown, InsertCancellingOrderBody>({
      query: body => ({
        url: `${LIMIT_ORDER_API_WRITE}/v1/orders/cancelling`,
        body,
        method: 'POST',
      }),
      invalidatesTags: [
        RTK_QUERY_TAGS.GET_LIMIT_ORDER_LIST,
        RTK_QUERY_TAGS.GET_LIMIT_ORDER_INSUFFICIENT,
        RTK_QUERY_TAGS.GET_LIMIT_ORDER_ACTIVE_MAKING_AMOUNT,
      ],
    }),
    createOrder: builder.mutation<{ id: number }, CreateOrderBody>({
      query: body => ({
        url: `${LIMIT_ORDER_API_WRITE}/v1/orders`,
        body,
        method: 'POST',
        headers: {
          'x-client-id': body.clientId || 'kyberswap',
        },
      }),
      transformResponse,
      invalidatesTags: [
        RTK_QUERY_TAGS.GET_LIMIT_ORDER_LIST,
        RTK_QUERY_TAGS.GET_LIMIT_ORDER_INSUFFICIENT,
        RTK_QUERY_TAGS.GET_LIMIT_ORDER_ACTIVE_MAKING_AMOUNT,
      ],
    }),
    createOrderSignature: builder.mutation<CreateOrderSignatureResponse, CreateOrderSignatureBody>({
      query: body => ({
        url: `${LIMIT_ORDER_API_WRITE}/v1/orders/sign-message`,
        body,
        method: 'POST',
      }),
      transformResponse,
    }),

    getEncodeData: builder.mutation<EncodeDataResponse, { orderIds: number[]; isCancelAll?: boolean }>({
      query: ({ orderIds, isCancelAll = false }) => ({
        url: `${LIMIT_ORDER_API_READ}/v1/encode/${isCancelAll ? 'increase-nonce' : 'cancel-batch-orders'}`,
        body: isCancelAll ? {} : { orderIds },
        method: 'POST',
      }),
      transformResponse,
    }),
    ackNotificationOrder: builder.mutation<
      unknown,
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
      transformResponse: ({ data }: ApiEnvelope<ActiveMakingAmountResponse>) => data.activeMakingAmount || '',
      providesTags: [RTK_QUERY_TAGS.GET_LIMIT_ORDER_ACTIVE_MAKING_AMOUNT],
    }),

    createCancelOrderSignature: builder.mutation<
      CreateCancelOrderSignatureResponse,
      { chainId: string; maker: string; orderIds: number[] }
    >({
      query: body => ({
        url: `${LIMIT_ORDER_API_WRITE}/v1/orders/cancel-sign`,
        body,
        method: 'POST',
      }),
      transformResponse,
    }),
    cancelOrders: builder.mutation<
      CancelOrderResponse,
      { chainId: string; maker: string; orderIds: number[]; signature: string }
    >({
      query: body => ({
        url: `${LIMIT_ORDER_API_WRITE}/v1/orders/cancel`,
        body,
        method: 'POST',
      }),
      transformResponse,
      invalidatesTags: [
        RTK_QUERY_TAGS.GET_LIMIT_ORDER_LIST,
        RTK_QUERY_TAGS.GET_LIMIT_ORDER_INSUFFICIENT,
        RTK_QUERY_TAGS.GET_LIMIT_ORDER_ACTIVE_MAKING_AMOUNT,
      ],
    }),
    getOperatorSignature: builder.query<OperatorSignature[], { chainId: ChainId; orderIds: number[] }>({
      query: ({ chainId, orderIds }) => ({
        url: `${LIMIT_ORDER_API_READ_PARTNER}/v1/orders/operator-signature`,
        params: {
          chainId: chainId.toString(),
          orderIds: orderIds.join(','),
        },
      }),
      transformResponse: ({ data }: ApiEnvelope<{ orders?: OperatorSignature[] }>) => data.orders || [],
    }),
    encodeFillOrder: builder.mutation<EncodeDataResponse, FillOrderBody>({
      query: body => ({
        url: `${LIMIT_ORDER_API_READ}/v1/encode/fill-order-to`,
        body,
        method: 'POST',
      }),
      transformResponse,
    }),
  }),
})

export const {
  useGetLOConfigQuery,
  useGetListOrdersQuery,
  useGetOrdersByTokenPairQuery,
  useInsertCancellingOrderMutation,
  useGetNumberOfInsufficientFundOrdersQuery,
  useCreateOrderMutation,
  useCreateOrderSignatureMutation,
  useGetEncodeDataMutation,
  useGetTotalActiveMakingAmountQuery,
  useAckNotificationOrderMutation,
  useCreateCancelOrderSignatureMutation,
  useCancelOrdersMutation,
  useLazyGetOperatorSignatureQuery,
  useEncodeFillOrderMutation,
} = limitOrderApi

export default limitOrderApi
