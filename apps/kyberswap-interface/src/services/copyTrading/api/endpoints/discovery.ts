import {
  adaptChainsResponse,
  adaptLeaderboardResponse,
  adaptLeaderboardSummaryResponse,
} from 'services/copyTrading/adapters/agents'
import type { LeaderboardQuery, LeaderboardSummaryQuery } from 'services/copyTrading/types/queries'
import type {
  ChainsResponse,
  LeaderboardResponse,
  LeaderboardSummaryResponse,
} from 'services/copyTrading/types/responses'

import copyTradingBaseApi from '../baseApi'
import { cleanParams, leaderboardSortMap, sortOrderMap } from '../queryParams'

const discoveryApi = copyTradingBaseApi.injectEndpoints({
  endpoints: builder => ({
    getChains: builder.query<ChainsResponse, void>({
      query: () => '/chains',
      transformResponse: adaptChainsResponse,
    }),
    getLeaderboardSummary: builder.query<LeaderboardSummaryResponse, LeaderboardSummaryQuery | void>({
      query: query => ({
        url: '/leaderboard/summary',
        params: cleanParams({
          chainId: query?.chainId,
          search: query?.search,
          strategyCategory: query?.strategy ? 'STRATEGY_CATEGORY_' + query.strategy.toUpperCase() : undefined,
        }),
      }),
      transformResponse: adaptLeaderboardSummaryResponse,
      providesTags: ['CopyTrading'],
    }),
    getLeaderboard: builder.query<LeaderboardResponse, LeaderboardQuery | void>({
      query: query => ({
        url: '/leaderboard',
        params: cleanParams({
          chainId: query?.chainId,
          search: query?.search,
          strategyCategory: query?.strategy ? 'STRATEGY_CATEGORY_' + query.strategy.toUpperCase() : undefined,
          sortBy: query?.sortBy ? leaderboardSortMap[query.sortBy] : undefined,
          sortOrder: query?.sortOrder ? sortOrderMap[query.sortOrder] : undefined,
          cursor: query?.cursor,
          limit: query?.limit,
        }),
      }),
      transformResponse: adaptLeaderboardResponse,
      providesTags: ['CopyTrading'],
    }),
  }),
})

export default discoveryApi
