import { ChainId } from '@kyberswap/ks-sdk-core'
import { createApi } from '@reduxjs/toolkit/query/react'
import baseQueryOauth from 'services/baseQueryOauth'

import { RTK_QUERY_TAGS } from 'constants/index'
import {
  Portfolio,
  PortfolioWallet,
  PortfolioWalletBalance,
  PortfolioWalletBalanceResponse,
  TokenAllowAnceResponse,
  TransactionHistoryResponse,
} from 'pages/NotificationCenter/Portfolio/type'

const KRYSTAL_API = 'https://api.krystal.app/all/v1'
const portfolioApi = createApi({
  reducerPath: 'portfolioApi',
  baseQuery: baseQueryOauth({ baseUrl: 'https://portfolio-service-api.dev.kyberengineering.io/api' }),
  tagTypes: [RTK_QUERY_TAGS.GET_LIST_PORTFOLIO, RTK_QUERY_TAGS.GET_LIST_WALLET_PORTFOLIO],
  endpoints: builder => ({
    getPortfolios: builder.query<Portfolio[], void>({
      query: () => ({
        url: '/v1/portfolios',
        params: { identityId: window.identityId }, // todo
      }),
      transformResponse: (data: any) => data?.data?.portfolios,
      providesTags: [RTK_QUERY_TAGS.GET_LIST_PORTFOLIO],
    }),
    getRealtimeBalance: builder.query<PortfolioWalletBalanceResponse, { query: string; chainIds?: ChainId[] }>({
      query: ({ query, chainIds }) => ({
        url: `/v1/real-time-data/${query}`,
        params: { chainIds: chainIds?.join(',') },
      }),
      transformResponse: (data: any) => {
        const balances = data?.data?.balances
        if (balances)
          Object.keys(balances).forEach(wallet => {
            data.data.balances[wallet] = balances[wallet].map((el: PortfolioWalletBalance) => ({
              ...el,
              walletAddress: wallet,
              chainId: +el.chainId,
            }))
          })
        return data?.data
      },
    }),
    getTokenApproval: builder.query<TokenAllowAnceResponse, { address: string; chainIds?: ChainId[] }>({
      query: ({ address, chainIds }) => ({
        url: `${KRYSTAL_API}/approval/list`,
        params: { address, chainIds: chainIds?.join(',') },
      }),
      transformResponse: (data: any) => data?.data,
    }),
    getTransactions: builder.query<
      TransactionHistoryResponse,
      {
        walletAddress: string
        chainIds?: ChainId[]
        limit: number
        endTime: number
        tokenAddress?: string
        tokenSymbol?: string
      }
    >({
      query: ({ chainIds, ...params }) => ({
        url: `${KRYSTAL_API}/txHistory/getHistory`,
        params: { ...params, chainIds: chainIds?.join(',') },
      }),
    }),
    createPortfolio: builder.mutation<void, { name: string }>({
      query: body => ({
        url: '/v1/portfolios',
        method: 'POST',
        body,
        params: { identityId: window.identityId }, // todo
      }),
      invalidatesTags: [RTK_QUERY_TAGS.GET_LIST_PORTFOLIO],
    }),
    updatePortfolio: builder.mutation<Portfolio, { name: string; id: number }>({
      query: ({ id, ...body }) => ({
        url: `/v1/portfolios/${id}`,
        method: 'PUT',
        body,
        params: { identityId: window.identityId }, // todo
      }),
      invalidatesTags: [RTK_QUERY_TAGS.GET_LIST_PORTFOLIO],
    }),
    deletePortfolio: builder.mutation<Portfolio, number>({
      query: id => ({
        url: `/v1/portfolios/${id}`,
        method: 'DELETE',
        params: { identityId: window.identityId }, // todo
      }),
      invalidatesTags: [RTK_QUERY_TAGS.GET_LIST_PORTFOLIO],
    }),
    // wallets
    getWalletsPortfolios: builder.query<PortfolioWallet[], { portfolioId: number }>({
      query: ({ portfolioId }) => ({
        url: `/v1/portfolios/${portfolioId}/wallets`,
        params: { identityId: window.identityId }, // todo
      }),
      transformResponse: (data: any) => data?.data?.wallets,
      providesTags: [RTK_QUERY_TAGS.GET_LIST_WALLET_PORTFOLIO],
    }),
    addWalletToPortfolio: builder.mutation<Portfolio, { portfolioId: number; walletAddress: string; nickName: string }>(
      {
        query: ({ portfolioId, ...body }) => ({
          url: `/v1/portfolios/${portfolioId}/wallets`,
          method: 'POST',
          body,
          params: { identityId: window.identityId }, // todo
        }),
        invalidatesTags: [RTK_QUERY_TAGS.GET_LIST_WALLET_PORTFOLIO],
      },
    ),
    updateWalletToPortfolio: builder.mutation<
      Portfolio,
      { portfolioId: number; walletAddress: string; nickName: string }
    >({
      query: ({ portfolioId, walletAddress, ...body }) => ({
        url: `/v1/portfolios/${portfolioId}/wallets/${walletAddress}`,
        method: 'PUT',
        body,
        params: { identityId: window.identityId }, // todo
      }),
      invalidatesTags: [RTK_QUERY_TAGS.GET_LIST_WALLET_PORTFOLIO],
    }),
    removeWalletFromPortfolio: builder.mutation<Portfolio, { portfolioId: number; walletAddress: string }>({
      query: ({ portfolioId, walletAddress }) => ({
        url: `/v1/portfolios/${portfolioId}/wallets/${walletAddress}`,
        method: 'DELETE',
        params: { identityId: window.identityId }, // todo
      }),
      invalidatesTags: [RTK_QUERY_TAGS.GET_LIST_WALLET_PORTFOLIO],
    }),
  }),
})

export const {
  useGetPortfoliosQuery,
  useCreatePortfolioMutation,
  useUpdatePortfolioMutation,
  useGetRealtimeBalanceQuery,
  useGetTokenApprovalQuery,
  useGetTransactionsQuery,
  useDeletePortfolioMutation,
  useAddWalletToPortfolioMutation,
  useGetWalletsPortfoliosQuery,
  useRemoveWalletFromPortfolioMutation,
  useUpdateWalletToPortfolioMutation,
} = portfolioApi

export default portfolioApi
