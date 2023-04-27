import { createApi } from '@reduxjs/toolkit/query/react'
import baseQueryOauth from 'services/baseQueryOauth'

import { BFF_API } from 'constants/env'
import { UserProfile } from 'state/authen/reducer'

const identityApi = createApi({
  reducerPath: 'identityApi',
  baseQuery: baseQueryOauth({ baseUrl: BFF_API }),
  endpoints: builder => ({
    getOrCreateProfile: builder.mutation<UserProfile, void>({
      query: () => ({
        url: '/v1/profiles',
        method: 'POST',
      }),
      transformResponse: (data: any) => data?.data?.profile,
    }),
    connectWalletToProfile: builder.mutation<any, { walletAddress: string }>({
      query: body => ({
        url: '/v1/profiles/connected-wallets',
        body,
        method: 'POST',
      }),
    }),
    sendOtp: builder.mutation<any, { email: string }>({
      query: body => ({
        url: '/v1/profiles/mine/link-email',
        body,
        method: 'PUT',
      }),
    }),
    verifyOtp: builder.mutation<any, { code: string; email: string }>({
      query: body => ({
        url: '/v1/profiles/mine/confirm-email',
        body,
        method: 'PUT',
      }),
    }),
  }),
})

export const {
  useConnectWalletToProfileMutation,
  useGetOrCreateProfileMutation,
  useSendOtpMutation,
  useVerifyOtpMutation,
} = identityApi

export default identityApi
