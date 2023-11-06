import { ChainId } from '@kyberswap/ks-sdk-core'
import { createApi } from '@reduxjs/toolkit/query/react'
import baseQueryOauth from 'services/baseQueryOauth'

import { BFF_API } from 'constants/env'
import { RTK_QUERY_TAGS } from 'constants/index'
import {
  Portfolio,
  PortfolioWalletBalance,
  PortfolioWalletBalanceResponse,
  TokenAllowAnceResponse,
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
  baseQuery: baseQueryOauth({ baseUrl: BFF_API }),
  tagTypes: [RTK_QUERY_TAGS.GET_LIST_PORTFOLIO],
  endpoints: builder => ({
    getPortfolios: builder.query<Portfolio[], void>({
      query: () => ({
        url: 'https://ks-setting.dev.kyberengineering.io/api/v1/configurations/fetch',
        params: { serviceCode: 'kyberswap-137' },
      }),
      transformResponse: (_: any) => {
        const mock: any = {
          id: 1,
          name: 'Tét',
          wallets: [
            { id: 'string', walletAddress: '0x53beBc978F5AfC70aC3bFfaD7bbD88A351123723', nickName: 'string' },
            { id: 'string 2', walletAddress: '0x53beBc978F5AfC70aC3bFfaD7bbD88A351123724', nickName: 'string 2' },
            { id: 'string 2', walletAddress: '0x53beBc978F5AfC70aC3bFfaD7bbD88A351123724', nickName: 'string 2' },
            {
              id: 'string 2 22323232323232323232323',
              walletAddress: '0x53beBc978F5AfC70aC3bFfaD7bbD88A351123724',
              nickName:
                'string 2 string 2 22323232323232323232323 string 2 string 2 22323232323232323232323string 2 string 2 22323232323232323232323',
            },
          ],
        }
        return [mock, mock]
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
    createPortfolio: builder.mutation<Portfolio, void>({
      query: () => ({
        url: '/v1/profile/me',
        method: 'POST',
      }),
      transformResponse: (data: any) => data?.data?.profile,
      invalidatesTags: [RTK_QUERY_TAGS.GET_LIST_PORTFOLIO],
    }),
    updatePortfolio: builder.mutation<Portfolio, void>({
      query: () => ({
        url: '/v1/profile/me',
        method: 'POST',
      }),
      transformResponse: (data: any) => data?.data?.profile,
      invalidatesTags: [RTK_QUERY_TAGS.GET_LIST_PORTFOLIO],
    }),
  }),
})

export const {
  useGetPortfoliosQuery,
  useCreatePortfolioMutation,
  useUpdatePortfolioMutation,
  useGetRealtimeBalanceQuery,
  useGetTokenApprovalQuery,
} = portfolioApi

export default portfolioApi
