import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

type SafePalApiResponse<T> = {
  code: number
  message: string
  data: T
}

type SafePalTimeRangeParams = { fromTs: number; toTs: number } | { from: string; to: string }

type SafePalPaginationParams = {
  page?: number
  pageSize?: number
}

export type SafePalCampaignJoin = {
  id: number
  user_address: string
  status: string
  created_at: string
  updated_at: string
}

export type SafePalCampaignWeekStats = {
  iso_year: number
  iso_week: number
  week_start: string
  week_end: string
  distinct_products: string[]
  base_points: number
  bonus_points: number
  total_points: number
}

export type SafePalCampaignParticipant = {
  user_address: string
  from_ts: number
  to_ts: number
  rank?: number
  total_users: number
  base_points: number
  bonus_points: number
  total_points: number
  weeks: SafePalCampaignWeekStats[]
}

export type SafePalCampaignLeaderboardEntry = {
  rank: number
  user_address: string
  joined_at: string
  base_points: number
  bonus_points: number
  total_points: number
}

export type SafePalCampaignStats = {
  from_ts: number
  to_ts: number
  page: number
  page_size: number
  total_items: number
  entries: SafePalCampaignLeaderboardEntry[]
}

export type SafePalCampaignWeeklyStats = {
  user_address: string
  page: number
  page_size: number
  total_items: number
  from_ts?: number
  to_ts?: number
  items: SafePalCampaignWeekStats[]
}

export type SafePalCampaignTransaction = {
  id: number
  product_name: string
  chain_id: number
  chain_name: string
  tx_hash: string
  ts: number
  date: string
  user_address: string
  vol: number
  point: number
  token_in_symbol: string
  token_out_symbol: string
  token_in_category: string
  token_out_category: string
  pair_type: string
  created_at: string
}

export type SafePalCampaignTransactions = {
  user_address: string
  from_ts: number
  to_ts: number
  page: number
  page_size: number
  total_items: number
  total_users: number
  total_tx_all_users: number
  total_tx_of_user: number
  items: SafePalCampaignTransaction[]
}

const mapTimeRangeParams = (timeRange: SafePalTimeRangeParams) => {
  if ('fromTs' in timeRange) {
    return {
      from_ts: timeRange.fromTs,
      to_ts: timeRange.toTs,
    }
  }

  return {
    from: timeRange.from,
    to: timeRange.to,
  }
}

const safepalCampaignApi = createApi({
  reducerPath: 'safepalCampaignApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://common-service.kyberswap.com/api/v1/safepal',
  }),
  endpoints: builder => ({
    getStats: builder.query<SafePalCampaignStats, SafePalPaginationParams & SafePalTimeRangeParams>({
      query: params => {
        const { page = 1, pageSize = 50, ...timeRange } = params
        return {
          url: '/leaderboard',
          params: {
            page,
            page_size: pageSize,
            ...mapTimeRangeParams(timeRange),
          },
        }
      },
      transformResponse: (response: SafePalApiResponse<SafePalCampaignStats>) => response.data,
    }),
    getParticipant: builder.query<SafePalCampaignParticipant, { address: string } & SafePalTimeRangeParams>({
      query: ({ address, ...timeRange }) => ({
        url: `/users/${address}/stats`,
        params: mapTimeRangeParams(timeRange),
      }),
      transformResponse: (response: SafePalApiResponse<SafePalCampaignParticipant>) => response.data,
    }),
    getWeeklyStats: builder.query<SafePalCampaignWeeklyStats, { address: string } & SafePalPaginationParams>({
      query: params => {
        const { address, page = 1, pageSize = 50 } = params
        return {
          url: `/users/${address}/weekly-stats`,
          params: {
            page,
            page_size: pageSize,
          },
        }
      },
      transformResponse: (response: SafePalApiResponse<SafePalCampaignWeeklyStats>) => response.data,
    }),
    getTransactions: builder.query<
      SafePalCampaignTransactions,
      { address: string } & SafePalPaginationParams & SafePalTimeRangeParams
    >({
      query: params => {
        const { address, page = 1, pageSize = 50, ...timeRange } = params
        return {
          url: `/users/${address}/txs`,
          params: {
            page,
            page_size: pageSize,
            ...mapTimeRangeParams(timeRange),
          },
        }
      },
      transformResponse: (response: SafePalApiResponse<SafePalCampaignTransactions>) => response.data,
    }),
    joinCampaign: builder.mutation<SafePalCampaignJoin, { userAddress: string; signature: string; message: string }>({
      query: ({ userAddress, ...rest }) => ({
        url: '/join',
        method: 'POST',
        body: {
          user_address: userAddress,
          ...rest,
        },
      }),
      transformResponse: (response: SafePalApiResponse<SafePalCampaignJoin>) => response.data,
    }),
    disjoinCampaign: builder.mutation<SafePalCampaignJoin, { userAddress: string }>({
      query: ({ userAddress }) => ({
        url: '/disjoin',
        method: 'POST',
        body: {
          user_address: userAddress,
        },
      }),
      transformResponse: (response: SafePalApiResponse<SafePalCampaignJoin>) => response.data,
    }),
  }),
})

export const {
  useGetStatsQuery: useGetSafePalCampaignStatsQuery,
  useGetParticipantQuery: useGetSafePalCampaignParticipantQuery,
  useGetWeeklyStatsQuery: useGetSafePalCampaignWeeklyStatsQuery,
  useGetTransactionsQuery: useGetSafePalCampaignTransactionsQuery,
  useJoinCampaignMutation: useJoinSafePalCampaignMutation,
  useDisjoinCampaignMutation: useDisjoinSafePalCampaignMutation,
} = safepalCampaignApi

export default safepalCampaignApi
