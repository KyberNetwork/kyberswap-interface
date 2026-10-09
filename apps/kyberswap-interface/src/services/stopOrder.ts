import { ChainId } from '@kyberswap/ks-sdk-core'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import {
  StopOrder,
  StopOrderConfig,
  StopOrderCorePayload,
  StopOrderFee,
  StopOrderOracleConfig,
  StopOrderOraclePrice,
  StopOrderStatus,
  StopOrderTypedData,
} from 'components/StopOrder/types'
import { parseStopOrders } from 'components/StopOrder/utils'
import { CONDITIONAL_SERVICE_URL } from 'constants/env'
import { RTK_QUERY_TAGS } from 'constants/index'

// Every response is wrapped in { code, message, data }; a non-zero code carries `errorEntities`
// naming the offending fields.
type ApiEnvelope<T> = { code: number; message: string; data: T }

type ListOrdersResponse = { orders: unknown[]; pagination?: { totalItems?: number } }
type PublicConfigResponse = { config?: { smartIntentAddress?: string } }

export type StopOrderListParams = {
  userWallet: string
  chainIds?: ChainId[]
  status?: StopOrderStatus
  tokenIns?: string[]
  tokenOuts?: string[]
  page?: number
  pageSize?: number
}

export type StopOrderListResult = { orders: StopOrder[]; totalItems: number }

export type StopOrderCancelParams = { chainId: number; userWallet: string; orderId: number }

export type StopOrderBatchCancelParams = { chainId: number; userWallet: string; orderIds: number[] }

export type StopOrderBatchCancelResult = {
  orderId: number
  success: boolean
  errorCode?: string
  errorMessage?: string
}

export type StopOrderOraclePriceParams = { chainId: ChainId; base: string; quote: string }

export type StopOrderActiveMakingAmountParams = { chainId: ChainId; userWallet: string; tokenIn: string }

const ORDERS_PATH = '/v1/orders/stop-loss'

const stopOrderApi = createApi({
  reducerPath: 'stopOrderApi',
  baseQuery: fetchBaseQuery({ baseUrl: CONDITIONAL_SERVICE_URL }),
  tagTypes: [RTK_QUERY_TAGS.GET_STOP_ORDER_LIST],
  endpoints: builder => ({
    // The address tokenIn is approved to, and the EIP-712 verifying contract. Shared with Smart Exit.
    getStopOrderConfig: builder.query<StopOrderConfig, ChainId>({
      query: chainId => ({ url: '/v1/configs/public', params: { chainId } }),
      transformResponse: (response: ApiEnvelope<PublicConfigResponse>) => ({
        smartIntentAddress: response?.data?.config?.smartIntentAddress ?? '',
      }),
    }),

    getStopOrders: builder.query<StopOrderListResult, StopOrderListParams>({
      query: ({ userWallet, chainIds, status, tokenIns, tokenOuts, page = 1, pageSize = 10 }) => {
        const params = new URLSearchParams({
          userWallet,
          page: String(page),
          pageSize: String(pageSize),
        })
        if (status) params.append('status', status)
        chainIds?.forEach(chainId => params.append('chainIds', String(chainId)))
        tokenIns?.forEach(token => params.append('tokenIns', token))
        tokenOuts?.forEach(token => params.append('tokenOuts', token))

        // A trailing slash before the query string redirects, so the path stays bare.
        return { url: `${ORDERS_PATH}?${params.toString()}` }
      },
      transformResponse: (response: ApiEnvelope<ListOrdersResponse>) => {
        // Rendered in the order the service returns them: it rejects every `sorts` value, and the
        // table offers no column sorting to reconcile with.
        const orders = parseStopOrders(response?.data?.orders)
        return { orders, totalItems: response?.data?.pagination?.totalItems ?? orders.length }
      },
      providesTags: [RTK_QUERY_TAGS.GET_STOP_ORDER_LIST],
    }),

    // Must run before sign-message: the BE doc requires each maxFeesPercentage entry to be at least
    // the live protocol fee, and the cap is signed into the intent.
    estimateStopOrderFee: builder.mutation<StopOrderFee, StopOrderCorePayload>({
      query: body => ({ url: `${ORDERS_PATH}/estimate-fee`, method: 'POST', body }),
      transformResponse: (response: ApiEnvelope<StopOrderFee>) => response?.data,
    }),

    getStopOrderSignMessage: builder.mutation<StopOrderTypedData, StopOrderCorePayload>({
      query: body => ({ url: `${ORDERS_PATH}/sign-message`, method: 'POST', body }),
      transformResponse: (response: ApiEnvelope<StopOrderTypedData>) => response?.data,
    }),

    createStopOrder: builder.mutation<StopOrder, StopOrderCorePayload & { signature: string }>({
      query: body => ({ url: ORDERS_PATH, method: 'POST', body }),
      transformResponse: (response: ApiEnvelope<StopOrder>) => response?.data,
      invalidatesTags: [RTK_QUERY_TAGS.GET_STOP_ORDER_LIST],
    }),

    // Cancelling is user-signed too, one order per signature — the service takes a single orderId.
    getStopOrderCancelSignMessage: builder.mutation<StopOrderTypedData, StopOrderCancelParams>({
      query: body => ({ url: `${ORDERS_PATH}/cancel/sign-message`, method: 'POST', body }),
      transformResponse: (response: ApiEnvelope<StopOrderTypedData>) => response?.data,
    }),

    cancelStopOrder: builder.mutation<unknown, StopOrderCancelParams & { signature: string }>({
      query: body => ({ url: `${ORDERS_PATH}/cancel`, method: 'POST', body }),
      invalidatesTags: [RTK_QUERY_TAGS.GET_STOP_ORDER_LIST],
    }),

    // Up to 100 orders under one signature, all on the same chain and order type.
    getStopOrderBatchCancelSignMessage: builder.mutation<StopOrderTypedData, StopOrderBatchCancelParams>({
      query: body => ({ url: `${ORDERS_PATH}/cancel/batch/sign-message`, method: 'POST', body }),
      transformResponse: (response: ApiEnvelope<StopOrderTypedData>) => response?.data,
    }),

    batchCancelStopOrders: builder.mutation<
      StopOrderBatchCancelResult[],
      StopOrderBatchCancelParams & { signature: string }
    >({
      query: body => ({ url: `${ORDERS_PATH}/cancel/batch`, method: 'POST', body }),
      // A verified signature returns code 0 even when individual ids fail, so the per-order results
      // are the only place a partial failure shows up.
      transformResponse: (response: ApiEnvelope<{ results?: StopOrderBatchCancelResult[] }>) =>
        response?.data?.results ?? [],
      invalidatesTags: [RTK_QUERY_TAGS.GET_STOP_ORDER_LIST],
    }),

    // What the wallet's open stop orders on a token add up to, raw — the share of the smartIntent
    // allowance they will draw when they fire. Tagged with the list so placing or cancelling refreshes it.
    getStopOrderActiveMakingAmount: builder.query<string, StopOrderActiveMakingAmountParams>({
      query: params => ({ url: `${ORDERS_PATH}/active-making-amount`, params }),
      transformResponse: (response: ApiEnvelope<{ activeMakingAmount?: string }>) =>
        response?.data?.activeMakingAmount || '0',
      providesTags: [RTK_QUERY_TAGS.GET_STOP_ORDER_LIST],
    }),

    // Which oracle the chain's triggers run on, and the token-list filter that finds the tokens it prices.
    getStopOrderOracleConfig: builder.query<StopOrderOracleConfig, ChainId>({
      query: chainId => ({ url: `${ORDERS_PATH}/oracle-config`, params: { chainId } }),
      transformResponse: (response: ApiEnvelope<StopOrderOracleConfig>) => response?.data,
    }),

    // The exact cross-rate the trigger is evaluated against, so the form shows what actually fires.
    getStopOrderOraclePrice: builder.query<StopOrderOraclePrice, StopOrderOraclePriceParams>({
      query: ({ chainId, base, quote }) => ({
        url: `${ORDERS_PATH}/oracle-price`,
        params: { chainId, base, quote },
      }),
      transformResponse: (response: ApiEnvelope<StopOrderOraclePrice>) => response?.data,
    }),
  }),
})

export const {
  useGetStopOrderConfigQuery,
  useGetStopOrdersQuery,
  useGetStopOrderActiveMakingAmountQuery,
  useGetStopOrderOracleConfigQuery,
  useGetStopOrderOraclePriceQuery,
  useEstimateStopOrderFeeMutation,
  useGetStopOrderSignMessageMutation,
  useCreateStopOrderMutation,
  useGetStopOrderCancelSignMessageMutation,
  useCancelStopOrderMutation,
  useGetStopOrderBatchCancelSignMessageMutation,
  useBatchCancelStopOrdersMutation,
} = stopOrderApi

export default stopOrderApi
