import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export type RaffleCampaignTimeline = {
  start: string
  end: string
  reward: number
}

export type RawRaffleCampaignStatsResponse = {
  'eligible.week_1': string
  'eligible.week_2': string
  'participant.week_1': string
  'participant.week_2': string
  'campaign:week_1': RaffleCampaignTimeline
  'campaign:week_2': RaffleCampaignTimeline
  timelines: string
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
    getStats: builder.query<RawRaffleCampaignStatsResponse, void>({
      query: () => ({
        url: '/stats',
      }),
      transformResponse: (response: RawRaffleCampaignStatsResponse) => {
        const timelines = JSON.parse(response.timelines)
        return { ...response, ...timelines }
      },
    }),
    getTransactions: builder.query<RaffleCampaignTransaction[], { page: number; limit: number; sender?: string }>({
      query: ({ page, limit, sender }) => ({
        url: '/txs',
        params: {
          page,
          limit,
          sender,
        },
      }),
    }),
  }),
})

export const {
  useGetStatsQuery: useGetRaffleCampaignStatsQuery,
  useGetTransactionsQuery: useGetRaffleCampaignTransactionsQuery,
} = raffleCampaignApi

export default raffleCampaignApi
