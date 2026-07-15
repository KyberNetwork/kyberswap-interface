import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { COMMON_SERVICE_API } from 'constants/env'

// Recap API types
export interface AggregatedVolumeResponse {
  code: number
  message: string
  data: {
    pagination: { totalItems: number }
    data: Array<{
      chainId: number
      totalVolume: number
      totalTransactions: number
    }>
    summary: {
      totalVolume: number
      totalTransactions: number
      rankPercent: number
    }
  }
}

export interface ChainVolumeResponse {
  code: number
  message: string
  data: {
    pagination: { totalItems: number }
    data: Array<{
      chainId: number
      totalVolume: number
    }>
    total: {
      totalVolume: number
    }
  }
}

export interface TokenVolumeResponse {
  code: number
  message: string
  data: {
    pagination: { totalItems: number }
    tokens: Array<{
      address: string
      chainId: number
      logo: string
      symbol: string
      totalTransactions: number
      totalVolume: number
    }>
  }
}

const commonServiceApi = createApi({
  reducerPath: 'commonServiceApi',
  baseQuery: fetchBaseQuery({
    baseUrl: COMMON_SERVICE_API,
  }),
  endpoints: builder => ({
    getAccessTokens: builder.query<{ data: { accessToken: string } }, void>({
      query: () => ({
        url: `v1/treasury-grant/zkme-access-token`,
      }),
    }),

    getUserSelectedOption: builder.query<{ data: { option: string } }, string>({
      query: walletAddress => ({
        url: `v1/treasury-grant/options?walletAddress=${walletAddress}`,
      }),
    }),

    createOption: builder.mutation<
      { code: number; message: string },
      { walletAddress: string; signature: string; message: string }
    >({
      query: ({ walletAddress, signature, message }) => ({
        url: `v1/treasury-grant/options`,
        method: 'POST',
        body: { walletAddress, signature, message },
      }),
    }),

    // Recap API endpoints
    getAggregatedVolume: builder.query<AggregatedVolumeResponse, string>({
      query: walletAddress => ({
        url: `v1/users/${walletAddress}/total-volume/aggregated`,
      }),
    }),

    getChainVolume: builder.query<ChainVolumeResponse, string>({
      query: walletAddress => ({
        url: `v1/users/${walletAddress}/chain-volume/total`,
      }),
    }),

    getTokenVolume: builder.query<TokenVolumeResponse, string>({
      query: walletAddress => ({
        url: `v1/users/${walletAddress}/token-volume/aggregated`,
      }),
    }),
  }),
})

export const {
  useLazyGetAccessTokensQuery,
  useGetUserSelectedOptionQuery,
  useCreateOptionMutation,
  useGetAggregatedVolumeQuery,
  useGetChainVolumeQuery,
  useGetTokenVolumeQuery,
} = commonServiceApi

export default commonServiceApi
