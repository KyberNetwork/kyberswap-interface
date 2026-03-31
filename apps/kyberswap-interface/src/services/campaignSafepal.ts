import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

type SafePalApiResponse<T> = {
  code: number
  message: string
  data: T
}

type SafePalTimeRangeParams = {
  fromTs: number
  toTs: number
}

type SafePalPaginationParams = {
  page?: number
  pageSize?: number
}

type SafePalPagedRangeParams = SafePalTimeRangeParams & SafePalPaginationParams

type SafePalLeaderboardParams = SafePalTimeRangeParams &
  SafePalPaginationParams & {
    userAddress?: string
  }

export type SafePalCampaignJoin = {
  id: number
  user_address: string
  status: string
  created_at: string
  updated_at: string
}

export type SafePalCampaignWeekStats = {
  cycle: number
  cycle_start: string
  cycle_end: string
  cycle_eligible_tx: number
  distinct_products?: string[]
  base_points: number
  bonus_points: number
  total_points: number
  rank: number
  total_users: number
  joined: boolean
  winner: boolean
  winner_type?: string
}

export type SafePalCampaignUserStats = {
  user_address: string
  from_ts: number
  to_ts: number
  rank: number
  total_users: number
  base_points: number
  bonus_points: number
  total_points: number
  joined: boolean
  weeks: SafePalCampaignWeekStats[]
}

export type SafePalCampaignLeaderboardEntry = {
  rank: number
  user_address: string
  joined_at: string
  joined: boolean
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

export type SafePalCampaignJoinedStats = {
  from_ts: number
  to_ts: number
  user_joinned: number
}

export type SafePalCampaignWeeklyStats = {
  user_address: string
  page: number
  page_size: number
  total_weeks: number
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
  total_valid_tx: number
  items: SafePalCampaignTransaction[]
}

const SAFEPAL_CAMPAIGN_API_BASE_URL = 'https://common-service.kyberswap.com/api/v1/safepal'

const extractSafePalData = <T>(response: SafePalApiResponse<T>) => response.data

const mapTimeRangeParams = ({ fromTs, toTs }: SafePalTimeRangeParams) => {
  return {
    from_ts: fromTs,
    to_ts: toTs,
  }
}

const mapPagedRangeParams = (params: SafePalPagedRangeParams) => {
  const { page = 1, pageSize = 10, ...timeRange } = params
  return {
    page,
    page_size: pageSize,
    ...mapTimeRangeParams(timeRange),
  }
}

const safepalCampaignApi = createApi({
  reducerPath: 'safepalCampaignApi',
  baseQuery: fetchBaseQuery({
    baseUrl: SAFEPAL_CAMPAIGN_API_BASE_URL,
  }),
  endpoints: builder => ({
    getJoinedStats: builder.query<SafePalCampaignJoinedStats, SafePalTimeRangeParams>({
      query: params => ({
        url: '/joinned',
        params: mapTimeRangeParams(params),
      }),
      transformResponse: extractSafePalData,
    }),
    getStats: builder.query<SafePalCampaignStats, SafePalLeaderboardParams>({
      query: ({ userAddress, ...params }) => ({
        url: '/leaderboard',
        params: {
          ...mapPagedRangeParams(params),
          user_address: userAddress,
        },
      }),
      transformResponse: extractSafePalData,
    }),
    getUserStats: builder.query<SafePalCampaignUserStats, { address: string } & SafePalTimeRangeParams>({
      query: ({ address, ...timeRange }) => ({
        url: `/users/${address}/stats`,
        params: mapTimeRangeParams(timeRange),
      }),
      transformResponse: extractSafePalData,
    }),
    getWeeklyStats: builder.query<SafePalCampaignWeeklyStats, { address: string } & SafePalTimeRangeParams>({
      query: ({ address, ...timeRange }) => ({
        url: `/users/${address}/weekly-stats`,
        params: mapTimeRangeParams(timeRange),
      }),
      transformResponse: extractSafePalData,
    }),
    getTransactions: builder.query<SafePalCampaignTransactions, { address: string } & SafePalPagedRangeParams>({
      query: ({ address, ...params }) => ({
        url: `/users/${address}/txs`,
        params: mapPagedRangeParams(params),
      }),
      transformResponse: extractSafePalData,
    }),
    joinCampaign: builder.mutation<SafePalCampaignJoin, { userAddress: string; signature: string; message: string }>({
      query: ({ userAddress, ...rest }) => ({
        url: '/join',
        method: 'POST',
        body: {
          ...rest,
          user_address: userAddress,
        },
      }),
      transformResponse: extractSafePalData,
    }),
  }),
})

export const {
  useGetJoinedStatsQuery: useGetSafePalCampaignJoinedStatsQuery,
  useGetStatsQuery: useGetSafePalCampaignStatsQuery,
  useGetUserStatsQuery: useGetSafePalCampaignUserStatsQuery,
  useGetWeeklyStatsQuery: useGetSafePalCampaignWeeklyStatsQuery,
  useGetTransactionsQuery: useGetSafePalCampaignTransactionsQuery,
  useJoinCampaignMutation: useJoinSafePalCampaignMutation,
} = safepalCampaignApi

export default safepalCampaignApi
