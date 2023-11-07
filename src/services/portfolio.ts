import { ChainId } from '@kyberswap/ks-sdk-core'
import { createApi } from '@reduxjs/toolkit/query/react'
import baseQueryOauth from 'services/baseQueryOauth'

import { RTK_QUERY_TAGS } from 'constants/index'
import {
  Portfolio,
  PortfolioWalletBalance,
  PortfolioWalletBalanceResponse,
  TokenAllowAnceResponse,
  TransactionHistoryResponse,
} from 'pages/NotificationCenter/Portfolio/type'

const mockBalance = {
  chainId: '137',
  tokenAddress: '0x1c954e8fe737f99f68fa1ccda3e51ebdb291948c',
  amount: '11000000000000000000',
  decimals: 18,
  amountUsd: '5.5',
  symbol: 'KNC',
  logoUrl: 'https://storage.googleapis.com/ks-setting-1d682dca/061620bb-15ab-4877-ae14-ea615e07a5291697781498049.png',
}

const KRYSTAL_API = 'https://api.krystal.app/all/v1'
const portfolioApi = createApi({
  reducerPath: 'portfolioApi',
  baseQuery: baseQueryOauth({ baseUrl: 'https://portfolio-service-api.dev.kyberengineering.io/api' }),
  tagTypes: [RTK_QUERY_TAGS.GET_LIST_PORTFOLIO],
  endpoints: builder => ({
    getPortfolios: builder.query<Portfolio[], void>({
      query: () => ({
        url: '/v1/portfolios',
        params: { identityId: '88476844-cb54-4cd7-be10-9838ec1777b4' }, // todo
      }),
      transformResponse: (data: any) => {
        // const mock: any = {
        //   id: 1,
        //   name: 'Tét',
        //   wallets: [
        //     { id: 'string', walletAddress: '0x53beBc978F5AfC70aC3bFfaD7bbD88A351123723', nickName: 'string' },
        //     { id: 'string 2', walletAddress: '0x53beBc978F5AfC70aC3bFfaD7bbD88A351123724', nickName: 'string 2' },
        //     { id: 'string 2', walletAddress: '0x53beBc978F5AfC70aC3bFfaD7bbD88A351123724', nickName: 'string 2' },
        //     {
        //       id: 'string 2 22323232323232323232323',
        //       walletAddress: '0x53beBc978F5AfC70aC3bFfaD7bbD88A351123724',
        //       nickName:
        //         'string 2 string 2 22323232323232323232323 string 2 string 2 22323232323232323232323string 2 string 2 22323232323232323232323',
        //     },
        //   ],
        // }
        // return [mock, mock]
        return data?.data?.portfolios
      },
      providesTags: [RTK_QUERY_TAGS.GET_LIST_PORTFOLIO],
    }),
    getRealtimeBalance: builder.query<PortfolioWalletBalanceResponse, { query: string; chainIds?: ChainId[] }>({
      query: ({ query, chainIds }) => ({
        url: 'https://ks-setting.dev.kyberengineering.io/api/v1/configurations/fetch',
        params: { query, chainIds: chainIds?.join(','), serviceCode: 'kyberswap-137' },
      }),
      transformResponse: (_: any) => {
        const data: any = {
          data: {
            balances: {
              '0x53beBc978F5AfC70aC3bFfaD7bbD88A351123723': new Array(10).fill(mockBalance),
              '0xD7724751a998f152c2D4515F612CfD92346594dc': new Array(10).fill(mockBalance),
            },
          },
        }
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
      query: () => ({
        url: '/v1/portfolios',
        method: 'POST',
        // body,
        body: { identityId: '88476844-cb54-4cd7-be10-9838ec1777b4' },
      }),
      invalidatesTags: [RTK_QUERY_TAGS.GET_LIST_PORTFOLIO],
    }),
    updatePortfolio: builder.mutation<Portfolio, { name: string; id: number }>({
      query: ({ id, ...body }) => ({
        url: `/v1/portfolios/${id}`,
        method: 'PUT',
        body: { ...body, identityId: '88476844-cb54-4cd7-be10-9838ec1777b4' }, // todo
      }),
      invalidatesTags: [RTK_QUERY_TAGS.GET_LIST_PORTFOLIO],
    }),
    deletePortfolio: builder.mutation<Portfolio, number>({
      query: id => ({
        url: `/v1/portfolios/${id}`,
        method: 'DELETE',
        body: { identityId: '88476844-cb54-4cd7-be10-9838ec1777b4' }, // todo
      }),
      invalidatesTags: [RTK_QUERY_TAGS.GET_LIST_PORTFOLIO],
    }),
    addWalletToPortfolio: builder.mutation<Portfolio, { portfolioId: number; walletAddress: string; nickName: string }>(
      {
        query: ({ portfolioId, ...body }) => ({
          url: `/v1/portfolios/${portfolioId}/wallets`,
          method: 'POST',
          body: { identityId: '88476844-cb54-4cd7-be10-9838ec1777b4', ...body }, // todo
        }),
        invalidatesTags: [RTK_QUERY_TAGS.GET_LIST_PORTFOLIO],
      },
    ),
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
} = portfolioApi

export default portfolioApi
