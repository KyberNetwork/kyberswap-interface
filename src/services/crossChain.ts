import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { RTK_QUERY_TAGS } from 'constants/index'

type CrossChainPayload = {
  walletAddress: string
  srcChainId: string
  dstChainId: string
  srcTxHash: string
  srcTokenAddress: string
  dstTokenAddress: string
  srcAmount: string
  dstAmount: string
}

const crossChainApi = createApi({
  reducerPath: 'crossChainApi',
  tagTypes: [RTK_QUERY_TAGS.GET_CROSS_CHAIN_HISTORY, RTK_QUERY_TAGS.GET_BRIDGE_HISTORY],
  baseQuery: fetchBaseQuery({
    baseUrl: `https://cross-chain-history.stg.kyberengineering.io/api/v1`,
  }),

  endpoints: builder => ({
    getListCrossChainTxs: builder.query<any, { walletAddress: string; page: number }>({
      query: ({ walletAddress, page }) => ({
        url: '/squid-transfers',
        params: {
          page,
          pageSize: 10,
          walletAddress,
        },
      }),
      providesTags: [RTK_QUERY_TAGS.GET_CROSS_CHAIN_HISTORY],
    }),
    saveCrossChainTxs: builder.mutation<CrossChainPayload, any>({
      query: body => ({
        url: `/squid-transfers`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [RTK_QUERY_TAGS.GET_CROSS_CHAIN_HISTORY],
    }),
    getListBridgeTxs: builder.query<any, { walletAddress: string; page: number }>({
      query: ({ walletAddress, page }) => ({
        url: '/multichain-transfers',
        params: {
          page,
          pageSize: 10,
          walletAddress,
        },
      }),
      providesTags: [RTK_QUERY_TAGS.GET_BRIDGE_HISTORY],
    }),
    saveBridgeTxs: builder.mutation<CrossChainPayload, any>({
      query: body => ({
        url: `/multichain-transfers`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [RTK_QUERY_TAGS.GET_BRIDGE_HISTORY],
    }),
    getBridgeTransactionDetail: builder.query<{ error?: string }, string>({
      query: (hash: string) => ({
        url: `https://scanapi.multichain.org/v3/tx/${hash}`,
      }),
    }),
  }),
})

export const {
  useSaveCrossChainTxsMutation,
  useGetListCrossChainTxsQuery,
  useGetListBridgeTxsQuery,
  useSaveBridgeTxsMutation,
  useLazyGetBridgeTransactionDetailQuery,
} = crossChainApi

export default crossChainApi
