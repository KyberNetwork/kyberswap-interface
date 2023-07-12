import { createApi } from '@reduxjs/toolkit/query/react'
import baseQueryOauth from 'services/baseQueryOauth'

import { BFF_API } from 'constants/env'
import { RTK_QUERY_TAGS } from 'constants/index'
import { Topic } from 'hooks/useNotification'
import { UserProfile } from 'state/authen/reducer'

const identityApi = createApi({
  reducerPath: 'identityApi',
  baseQuery: baseQueryOauth({ baseUrl: BFF_API }),
  tagTypes: [RTK_QUERY_TAGS.GET_ALL_TOPICS_GROUP],
  endpoints: builder => ({
    getOrCreateProfile: builder.mutation<UserProfile, void>({
      query: () => ({
        url: '/v1/profile/me',
        method: 'POST',
      }),
      transformResponse: (data: any) => data?.data?.profile,
    }),
    connectWalletToProfile: builder.mutation<any, { walletAddress: string }>({
      query: body => ({
        url: '/v1/profile/me/connected-wallets',
        body,
        method: 'POST',
      }),
    }),
    sendOtp: builder.mutation<any, { email: string }>({
      query: body => ({
        url: '/v1/profile/me/link-email',
        body,
        method: 'PUT',
      }),
    }),
    verifyOtp: builder.mutation<any, { code: string; email: string }>({
      query: body => ({
        url: '/v1/profile/me/confirm-email',
        body,
        method: 'PUT',
      }),
    }),
    updateProfile: builder.mutation<any, { nickname?: string; avatarURL?: string }>({
      query: body => ({
        url: `/v1/profile/me`,
        body,
        method: 'PATCH',
      }),
    }),
    getSubscriptionTopics: builder.query<{ topicGroups: Topic[] }, void>({
      query: () => ({
        url: '/v1/profile/me/notification-subscriptions',
      }),
      transformResponse: (data: any) => data?.data,
      providesTags: [RTK_QUERY_TAGS.GET_ALL_TOPICS_GROUP],
    }),
    subscribeTopics: builder.mutation<any, { topicIds: number[] }>({
      query: body => ({
        url: '/v1/profile/me/notification-subscriptions',
        body,
        method: 'PUT',
      }),
      invalidatesTags: [RTK_QUERY_TAGS.GET_ALL_TOPICS_GROUP],
    }),
    createWatchWallet: builder.mutation<any, { walletAddress: string }>({
      query: body => ({
        url: '/v1/profile/me/watched-wallets',
        body,
        method: 'POST',
      }),
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
  useUpdateProfileMutation,
  useCreateWatchWalletMutation,
} = identityApi

export default identityApi
