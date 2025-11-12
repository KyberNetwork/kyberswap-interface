import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import dayjs from 'dayjs'
import { Text } from 'rebass'

import { CampaignWeek } from 'pages/Campaign/constants'

type Response<T> = {
  success: boolean
  message: string
  data: T
}

type Pagination<T> = {
  txs: T[]
  pagination: {
    totalOfPages: number
    currentPage: number
    pageSize: number
    hasMore: boolean
  }
}

export type RaffleCampaignStats = {
  'eligible.week_1': string
  'eligible.week_2': string
  'participant.week_1': string
  'participant.week_2': string
  weeks: CampaignWeek[]
  timelines: string
}

export type RaffleCampaignParticipant = {
  address: string
  joined_week1_at: string | null
  joined_week2_at: string | null
  tx_count_week_1: number
  tx_count_week_2: number
  reward: number
  eligible: boolean
}

export type RaffleCampaignTransaction = {
  id: string
  chain: number
  block_number: number
  tx: string
  token_in: string
  amount_in_usd: number
  token_out: string
  amount_out_usd: number
  time: string
  user_address: string
  eligible: boolean
  diff: number
  bit_block: number
  rewarded: number
}

const raffleCampaignApi = createApi({
  reducerPath: 'raffleCampaignApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://pre-raffle-campaign.kyberengineering.io/api',
  }),
  endpoints: builder => ({
    getStats: builder.query<RaffleCampaignStats, void>({
      query: () => ({
        url: '/stats',
      }),
      transformResponse: (response: Response<RaffleCampaignStats>) => {
        const timelines: Array<{ start: string; end: string; reward: number }> = Object.values(
          JSON.parse(response.data.timelines),
        )
        return {
          ...response.data,
          weeks: timelines.map((week, index) => {
            const start = Math.floor(new Date(week.start).getTime() / 1000) - 7 * 3600
            const end = Math.floor(new Date(week.end).getTime() / 1000) - 7 * 3600
            return {
              value: index,
              label: (
                <Text>
                  <Text as="span" color="#ffffff">
                    Week {index + 1}
                  </Text>{' '}
                  {dayjs.unix(start).format('MMM D')} - {dayjs.unix(end).format('MMM D')}
                </Text>
              ),
              start,
              end,
            }
          }),
        }
      },
    }),
    getParticipant: builder.query<RaffleCampaignParticipant, { address: string }>({
      query: ({ address }) => ({
        url: '/participant',
        params: {
          user_address: address,
        },
      }),
      transformResponse: (response: Response<RaffleCampaignParticipant>) => {
        if (response.success) {
          return response.data
        }
        return {
          address: '',
          joined_week1_at: null,
          joined_week2_at: null,
          tx_count_week_1: 0,
          tx_count_week_2: 0,
          reward: 0,
          eligible: false,
        }
      },
    }),
    getTransactions: builder.query<
      Pagination<RaffleCampaignTransaction>,
      { page: number; limit: number; address?: string }
    >({
      query: ({ page, limit, address }) => ({
        url: '/txs',
        params: {
          page,
          limit,
          user_address: address,
        },
      }),
      transformResponse: (response: Response<Pagination<RaffleCampaignTransaction>>) => {
        if (response.success) {
          return response.data
        }
        return {
          txs: [],
          pagination: {
            totalOfPages: 0,
            currentPage: 0,
            pageSize: 0,
            hasMore: false,
          },
        }
      },
    }),
  }),
})

export const {
  useGetStatsQuery: useGetRaffleCampaignStatsQuery,
  useGetParticipantQuery: useGetRaffleCampaignParticipantQuery,
  useGetTransactionsQuery: useGetRaffleCampaignTransactionsQuery,
} = raffleCampaignApi

export default raffleCampaignApi
