import { createApi } from '@reduxjs/toolkit/query/react'
import baseQueryOauth from 'services/baseQueryOauth'

import { BFF_API } from 'constants/env'
import { Topic } from 'hooks/useNotification'
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
        url: '/v1/profiles/me/link-email',
        body,
        method: 'PUT',
      }),
    }),
    verifyOtp: builder.mutation<any, { code: string; email: string }>({
      query: body => ({
        url: '/v1/profiles/me/confirm-email',
        body,
        method: 'PUT',
      }),
    }),
    getSubscriptionTopics: builder.query<{ topicGroups: Topic[] }, void>({
      query: () => ({
        url: '/v1/profiles/me/notification-subscriptions',
      }),
      transformResponse: (data: any) => data?.data,
    }),
    subscribeTopics: builder.mutation<any, { topicIds: number[] }>({
      query: body => ({
        url: '/v1/profiles/me/notification-subscriptions',
        body,
        method: 'PUT',
      }),
    }),
    unsubscribeTopics: builder.mutation<any, { topicIds: number[] }>({
      query: body => ({
        url: '/v1/profiles/me/notification-subscriptions',
        body,
        method: 'DELETE',
      }),
    }),
    // double check
    ackTelegramSubscriptionStatus: builder.mutation<Response, string>({
      query: wallet => ({
        url: `/v1/subscription-result/telegram`,
        method: 'DELETE',
        body: { wallet },
      }),
    }),
    buildTelegramVerification: builder.mutation<
      string,
      {
        chainId: string
        wallet: string
        subscribe: number[]
        unsubscribe: number[]
      }
    >({
      query: body => ({
        url: `/v1/topics/build-verification/telegram`,
        method: 'POST',
        body,
      }),
      transformResponse: (data: any) => data?.data?.verificationUrl,
    }),
  }),
})

export const {
  useConnectWalletToProfileMutation,
  useGetOrCreateProfileMutation,
  useSendOtpMutation,
  useVerifyOtpMutation,
  useGetSubscriptionTopicsQuery,
  useSubscribeTopicsMutation,
  useUnsubscribeTopicsMutation,
  useAckTelegramSubscriptionStatusMutation,
  useBuildTelegramVerificationMutation,
} = identityApi

export default identityApi
