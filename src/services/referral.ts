import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { REFERRAL_URL } from 'constants/env'

const referralApi = createApi({
  reducerPath: 'referralApi',
  keepUnusedDataFor: 0,
  baseQuery: fetchBaseQuery({
    baseUrl: REFERRAL_URL,
  }),
  endpoints: builder => ({
    getParticipant: builder.query<{ data: { participant: { referralCode: string } } }, { wallet: string }>({
      query: ({ wallet }) => ({
        url: `/v3/participants?identityId=${wallet}&referralProgramId=1`,
      }),
    }),
    getNonce: builder.query<{ data: { nonce: string } }, string>({
      query: wallet => ({
        url: `/v3/auth/nonce/${wallet}`,
      }),
    }),

    joinCampaign: builder.mutation({
      query: ({ wallet, code, message, signature }) => ({
        url: '/v3/participants',
        method: 'POST',
        body: {
          referralProgramId: 1,
          walletAddress: wallet,
          identityID: wallet,
          referredByCode: code,
          message: message,
          signature,
        },
      }),
    }),

    getDashboard: builder.query<
      {
        data: {
          referrals: { id: number; walletAddress: string; referralsNumber: number; createdAt: number }[]
          pagination: { totalItems: number }
        }
      },
      { referralCode: string; page: number; sort?: string }
    >({
      query: ({ referralCode, page, sort }) => ({
        url: `/v3/referrals?referralProgramId=1&referrerCode=${referralCode}&page=${page}&pageSize=10${
          sort ? `&sort=${sort}` : ''
        }`,
      }),
    }),

    getShare: builder.query({
      query: code => ({
        url: `/v3/shared-links/${code}`,
      }),
    }),

    createShare: builder.mutation({
      query: ({ code, account }) => ({
        url: `/v3/shared-links`,
        method: 'POST',
        body: {
          type: 'ARB_STIP',
          redirectURL: `https://kyberswap.com/campaigns/referrals?code=${code}`,
          metaImageURL: 'https://i.imgur.com/KRrAZWc.png',
          referredByCode: code,
          createdBy: account,
        },
      }),
    }),
  }),
})

export const {
  useGetParticipantQuery,
  useLazyGetNonceQuery,
  useJoinCampaignMutation,
  useGetDashboardQuery,
  useCreateShareMutation,
  useGetShareQuery,
} = referralApi

export default referralApi
