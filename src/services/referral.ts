import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { REFERRAL_URL } from 'constants/env'

const referralApi = createApi({
  reducerPath: 'referralApi',
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
      { referralCode: string; page: number }
    >({
      query: ({ referralCode, page }) => ({
        url: `/v3/referrals?referralProgramId=1&referrerCode=${referralCode}&page=${page}&pageSize=10`,
      }),
    }),
  }),
})

export const { useGetParticipantQuery, useLazyGetNonceQuery, useJoinCampaignMutation, useGetDashboardQuery } =
  referralApi

export default referralApi
