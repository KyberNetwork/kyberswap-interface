import { ChainId } from '@kyberswap/ks-sdk-core'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import {
  StopLossConfig,
  StopLossCorePayload,
  StopLossFee,
  StopLossOraclePrice,
  StopLossOrder,
  StopLossOrderStatus,
  StopLossSupportedToken,
  StopLossTypedData,
} from 'components/StopLoss/types'
import { parseStopLossOrders } from 'components/StopLoss/utils'
import { CONDITIONAL_SERVICE_URL } from 'constants/env'
import { RTK_QUERY_TAGS } from 'constants/index'

// Every response is wrapped in { code, message, data }; a non-zero code carries `errorEntities`
// naming the offending fields.
type ApiEnvelope<T> = { code: number; message: string; data: T }

type SupportedTokensResponse = { chainId: number; tokens: StopLossSupportedToken[] }
type ListOrdersResponse = { orders: unknown[]; pagination?: { totalItems?: number } }
type PublicConfigResponse = { config?: { smartIntentAddress?: string } }

export type StopLossListParams = {
  userWallet: string
  chainIds?: ChainId[]
  status?: StopLossOrderStatus
  tokenIns?: string[]
  tokenOuts?: string[]
  page?: number
  pageSize?: number
}

export type StopLossListResult = { orders: StopLossOrder[]; totalItems: number }

export type StopLossCancelParams = { chainId: number; userWallet: string; orderId: number }

export type StopLossBatchCancelParams = { chainId: number; userWallet: string; orderIds: number[] }

export type StopLossBatchCancelResult = {
  orderId: number
  success: boolean
  errorCode?: string
  errorMessage?: string
}

export type StopLossOraclePriceParams = { chainId: ChainId; base: string; quote: string }

const ORDERS_PATH = '/v1/orders/stop-loss'

const stopLossApi = createApi({
  reducerPath: 'stopLossApi',
  baseQuery: fetchBaseQuery({ baseUrl: CONDITIONAL_SERVICE_URL }),
  tagTypes: [RTK_QUERY_TAGS.GET_STOP_LOSS_ORDER_LIST],
  endpoints: builder => ({
    // The address tokenIn is approved to, and the EIP-712 verifying contract. Shared with Smart Exit.
    getStopLossConfig: builder.query<StopLossConfig, ChainId>({
      query: chainId => ({ url: '/v1/configs/public', params: { chainId } }),
      transformResponse: (response: ApiEnvelope<PublicConfigResponse>) => ({
        smartIntentAddress: response?.data?.config?.smartIntentAddress ?? '',
      }),
    }),

    // Tokens with an oracle feed on this chain. Addresses only — symbols come from the app token list.
    getStopLossSupportedTokens: builder.query<StopLossSupportedToken[], ChainId>({
      query: chainId => ({ url: `${ORDERS_PATH}/supported-tokens`, params: { chainId } }),
      transformResponse: (response: ApiEnvelope<SupportedTokensResponse>) => response?.data?.tokens ?? [],
    }),

    getStopLossOrders: builder.query<StopLossListResult, StopLossListParams>({
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
        const orders = parseStopLossOrders(response?.data?.orders)
        return { orders, totalItems: response?.data?.pagination?.totalItems ?? orders.length }
      },
      providesTags: [RTK_QUERY_TAGS.GET_STOP_LOSS_ORDER_LIST],
    }),

    // Must run before sign-message: the BE doc requires each maxFeesPercentage entry to be at least
    // the live protocol fee, and the cap is signed into the intent.
    estimateStopLossFee: builder.mutation<StopLossFee, StopLossCorePayload>({
      query: body => ({ url: `${ORDERS_PATH}/estimate-fee`, method: 'POST', body }),
      transformResponse: (response: ApiEnvelope<StopLossFee>) => response?.data,
    }),

    getStopLossSignMessage: builder.mutation<StopLossTypedData, StopLossCorePayload>({
      query: body => ({ url: `${ORDERS_PATH}/sign-message`, method: 'POST', body }),
      transformResponse: (response: ApiEnvelope<StopLossTypedData>) => response?.data,
    }),

    createStopLossOrder: builder.mutation<StopLossOrder, StopLossCorePayload & { signature: string }>({
      query: body => ({ url: ORDERS_PATH, method: 'POST', body }),
      transformResponse: (response: ApiEnvelope<StopLossOrder>) => response?.data,
      invalidatesTags: [RTK_QUERY_TAGS.GET_STOP_LOSS_ORDER_LIST],
    }),

    // Cancelling is user-signed too, one order per signature — the service takes a single orderId.
    getStopLossCancelSignMessage: builder.mutation<StopLossTypedData, StopLossCancelParams>({
      query: body => ({ url: `${ORDERS_PATH}/cancel/sign-message`, method: 'POST', body }),
      transformResponse: (response: ApiEnvelope<StopLossTypedData>) => response?.data,
    }),

    cancelStopLossOrder: builder.mutation<unknown, StopLossCancelParams & { signature: string }>({
      query: body => ({ url: `${ORDERS_PATH}/cancel`, method: 'POST', body }),
      invalidatesTags: [RTK_QUERY_TAGS.GET_STOP_LOSS_ORDER_LIST],
    }),

    // Up to 100 orders under one signature, all on the same chain and order type.
    getStopLossBatchCancelSignMessage: builder.mutation<StopLossTypedData, StopLossBatchCancelParams>({
      query: body => ({ url: `${ORDERS_PATH}/cancel/batch/sign-message`, method: 'POST', body }),
      transformResponse: (response: ApiEnvelope<StopLossTypedData>) => response?.data,
    }),

    batchCancelStopLossOrders: builder.mutation<
      StopLossBatchCancelResult[],
      StopLossBatchCancelParams & { signature: string }
    >({
      query: body => ({ url: `${ORDERS_PATH}/cancel/batch`, method: 'POST', body }),
      // A verified signature returns code 0 even when individual ids fail, so the per-order results
      // are the only place a partial failure shows up.
      transformResponse: (response: ApiEnvelope<{ results?: StopLossBatchCancelResult[] }>) =>
        response?.data?.results ?? [],
      invalidatesTags: [RTK_QUERY_TAGS.GET_STOP_LOSS_ORDER_LIST],
    }),

    // The exact cross-rate the trigger is evaluated against, so the form shows what actually fires.
    getStopLossOraclePrice: builder.query<StopLossOraclePrice, StopLossOraclePriceParams>({
      query: ({ chainId, base, quote }) => ({
        url: `${ORDERS_PATH}/oracle-price`,
        params: { chainId, base, quote },
      }),
      transformResponse: (response: ApiEnvelope<StopLossOraclePrice>) => response?.data,
    }),
  }),
})

export const {
  useGetStopLossConfigQuery,
  useGetStopLossSupportedTokensQuery,
  useGetStopLossOrdersQuery,
  useGetStopLossOraclePriceQuery,
  useEstimateStopLossFeeMutation,
  useGetStopLossSignMessageMutation,
  useCreateStopLossOrderMutation,
  useGetStopLossCancelSignMessageMutation,
  useCancelStopLossOrderMutation,
  useGetStopLossBatchCancelSignMessageMutation,
  useBatchCancelStopLossOrdersMutation,
} = stopLossApi

export default stopLossApi
