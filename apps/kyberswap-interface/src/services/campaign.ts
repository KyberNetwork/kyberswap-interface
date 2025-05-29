import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { CAMPAIGN_URL } from 'constants/env'

type WeeklyReward = {
  year: number
  week: number
  point: number
  reward: string
  isClaimed: boolean
  claimableReward: string
  claimInfo: {
    ref: string
    clientCode: string
  }
}

const campaignApi = createApi({
  reducerPath: 'campaignApi',
  keepUnusedDataFor: 0,
  baseQuery: fetchBaseQuery({
    baseUrl: CAMPAIGN_URL,
  }),
  endpoints: builder => ({
    getLeaderboard: builder.query<
      {
        data: {
          leaderBoards: { wallet: string; point: number; reward: string }[]
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
        program: 'stip' | 'grind/base'
        campaign: 'trading-incentive' | 'limit-order-farming' | 'referral-program'
        week: number
        year: number
        pageSize: number
        pageNumber: number
      }
    >({
      query: ({ program, campaign, week, year, pageNumber, pageSize }) => ({
        url: `/v1/${program}/leader-boards?campaign=${campaign}&week=${week}&year=${year}&pageNumber=${pageNumber}&pageSize=${pageSize}`,
      }),
    }),

    getUserReward: builder.query<
      { data: { point: number; reward: string; rank: number } },
      { program: 'stip' | 'grind/base'; wallet: string; campaign: string; year: number; week: number }
    >({
      query: ({ program, campaign, wallet, week, year }) => ({
        url: `/v1/${program}/rewards/${wallet}/weekly?campaign=${campaign}&year=${year}&week=${week}`,
      }),
    }),

    getUserWeeklyReward: builder.query<
      {
        data: {
          weeklyRewards: WeeklyReward[]
          totalReward: string
          totalClaimableReward: string
          totalPoint: number
        }
      },
      { program: 'stip' | 'grind/base'; campaign: string; wallet: string }
    >({
      query: ({ program, campaign, wallet }) => ({
        url: `/v1/${program}/rewards?campaign=${campaign}&wallet=${wallet}`,
      }),
    }),

    getUserReferralTotalReward: builder.query<
      {
        data: {
          totalReward: string
        }
      },
      { program: 'stip' | 'grind/base'; wallet: string }
    >({
      query: ({ program, wallet }) => ({
        url: `/v1/${program}/rewards/${wallet}/total?campaign=referral-program`,
      }),
    }),
  }),
})

export const {
  useGetLeaderboardQuery,
  useGetUserRewardQuery,
  useGetUserWeeklyRewardQuery,
  useGetUserReferralTotalRewardQuery,
} = campaignApi

export default campaignApi
