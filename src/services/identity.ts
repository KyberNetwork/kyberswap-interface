import { createApi } from '@reduxjs/toolkit/query/react'
import baseQueryOauth from 'services/baseQueryOauth'

import { BFF_API, ENV_LEVEL } from 'constants/env'
import { ENV_TYPE } from 'constants/type'
import { UserProfile } from 'state/authen/reducer'

const url = ENV_LEVEL === ENV_TYPE.LOCAL ? '/v1/profile/me' : '/v1/profiles'
const identityApi = createApi({
  reducerPath: 'identityApi',
  baseQuery: baseQueryOauth({ baseUrl: BFF_API }),
  endpoints: builder => ({
    getOrCreateProfile: builder.mutation<UserProfile, void>({
      query: () => ({
        url: url,
        method: 'POST',
      }),
      transformResponse: (data: any) => data?.data?.profile,
    }),
    connectWalletToProfile: builder.mutation<any, { walletAddress: string }>({
      query: body => ({
        url: `${url}/connected-wallets`,
        body,
        method: 'POST',
      }),
    }),
    sendOtp: builder.mutation<any, { email: string }>({
      query: body => ({
        url: `${url}/mine/link-email`,
        body,
        method: 'PUT',
      }),
    }),
    verifyOtp: builder.mutation<any, { code: string; email: string }>({
      query: body => ({
        url: `${url}/mine/confirm-email`,
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
