import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { COMMON_SERVICE_API } from 'constants/env'

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
  }),
})

export const { useLazyGetAccessTokensQuery, useGetUserSelectedOptionQuery, useCreateOptionMutation } = commonServiceApi

export default commonServiceApi
