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
  /** Any of these; the service rejects an unknown value rather than ignoring it. */
  statuses?: StopOrderStatus[]
  tokenIns?: string[]
  tokenOuts?: string[]
  /** Matches a token symbol or address on either side of the order. */
  query?: string
  page?: number
  pageSize?: number
}

/** Exported for its test: list filters repeat their key once per value, the way the service reads them. */
export const buildStopOrderListSearchParams = ({
  userWallet,
  chainIds,
  statuses,
  tokenIns,
  tokenOuts,
  query,
  page = 1,
  pageSize = 10,
}: StopOrderListParams): URLSearchParams => {
  const params = new URLSearchParams({ userWallet, page: String(page), pageSize: String(pageSize) })
  statuses?.forEach(status => params.append('statuses', status))
  chainIds?.forEach(chainId => params.append('chainIds', String(chainId)))
  tokenIns?.forEach(token => params.append('tokenIns', token))
  tokenOuts?.forEach(token => params.append('tokenOuts', token))
  if (query?.trim()) params.append('query', query.trim())
  return params
}

export type StopOrderListResult = { orders: StopOrder[]; totalItems: number }

export type StopOrderCancelParams = { chainId: number; userWallet: string; orderId: number }

/** Cancel All clears one chain per signature; the message the service issues carries `issuedAt`. */
export type StopOrderCancelAllParams = { chainId: number; userWallet: string }

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
      // A trailing slash before the query string redirects, so the path stays bare.
      query: params => ({ url: `${ORDERS_PATH}?${buildStopOrderListSearchParams(params).toString()}` }),
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

    /**
     * Replaces an open order with new terms under one signature: the old one is cancelled and the new
     * one created together, or nothing changes. Both calls take the new order's payload plus the id of
     * the order it replaces, and the signature is the new order's own intent naming that id.
     */
    getStopOrderReplaceSignMessage: builder.mutation<StopOrderTypedData, StopOrderCorePayload & { orderId: number }>({
      query: body => ({ url: `${ORDERS_PATH}/replace/sign-message`, method: 'POST', body }),
      transformResponse: (response: ApiEnvelope<StopOrderTypedData>) => response?.data,
    }),

    replaceStopOrder: builder.mutation<StopOrder, StopOrderCorePayload & { orderId: number; signature: string }>({
      query: body => ({ url: `${ORDERS_PATH}/replace`, method: 'POST', body }),
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

    // Every open order on one chain under one signature, whatever their number — no ids are sent.
    getStopOrderCancelAllSignMessage: builder.mutation<StopOrderTypedData, StopOrderCancelAllParams>({
      query: body => ({ url: `${ORDERS_PATH}/cancel/all/sign-message`, method: 'POST', body }),
      transformResponse: (response: ApiEnvelope<StopOrderTypedData>) => response?.data,
    }),

    cancelAllStopOrders: builder.mutation<unknown, StopOrderCancelAllParams & { issuedAt: string; signature: string }>({
      query: body => ({ url: `${ORDERS_PATH}/cancel/all`, method: 'POST', body }),
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
  useGetStopOrderReplaceSignMessageMutation,
  useReplaceStopOrderMutation,
  useGetStopOrderCancelSignMessageMutation,
  useCancelStopOrderMutation,
  useGetStopOrderCancelAllSignMessageMutation,
  useCancelAllStopOrdersMutation,
} = stopOrderApi

export default stopOrderApi
