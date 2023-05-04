import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { BFF_API } from 'constants/env'
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
  tagTypes: [RTK_QUERY_TAGS.GET_CROSS_CHAIN_HISTORY],
  baseQuery: fetchBaseQuery({
    baseUrl: `${BFF_API}/v1`,
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
  }),
})

export const { useSaveCrossChainTxsMutation, useGetListCrossChainTxsQuery } = crossChainApi

export default crossChainApi
