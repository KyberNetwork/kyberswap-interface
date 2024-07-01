import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { CAMPAIGN_URL } from 'constants/env'

const campaignApi = createApi({
  reducerPath: 'campaignApi',
  baseQuery: fetchBaseQuery({
    baseUrl: CAMPAIGN_URL,
  }),
  endpoints: builder => ({
    getLeaderboard: builder.query<
      {
        data: {
          leaderBoards: { wallet: string; point: number }[]
          participantCount: number
          pagination: {
            totalOfPages: number
            currentPage: number
            pageSize: number
            hasMore: boolean
          }
        }
      },
      {
        campaign: 'trading-incentive' | 'limit-order-farming' | 'referral'
        week: number
        year: number
        pageSize: number
        pageNumber: number
      }
    >({
      query: ({ campaign, week, year, pageNumber, pageSize }) => ({
        url: `/v1/stip/leader-boards?campaign=${campaign}&week=${week}&year=${year}&pageNumber=${pageNumber}&pageSize=${pageSize}`,
      }),
    }),

    getUserReward: builder.query<
      { data: { point: number; reward: string; rank: number } },
      { wallet: string; campaign: string; year: number; week: number }
    >({
      query: ({ campaign, wallet, week, year }) => ({
        url: `/v1/stip/rewards/${wallet}/weekly?campaign=${campaign}&year=${year}&week=${week}`,
      }),
    }),
  }),
})

export const { useGetLeaderboardQuery, useGetUserRewardQuery } = campaignApi

export default campaignApi
