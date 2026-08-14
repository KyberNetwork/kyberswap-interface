import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import {
  adaptActionLogsResponse,
  adaptActivityResponse,
  adaptAgentResponse,
  adaptAgentStatsResponse,
  adaptAgentsResponse,
  adaptChainsResponse,
  adaptCopyAccountBalancesResponse,
  adaptCopyAccountResponse,
  adaptCopyAccountWalletInventoryResponse,
  adaptCopyAccountsResponse,
  adaptCopyRunCashbackPolicyResponse,
  adaptCopyRunResponse,
  adaptCopyRunsResponse,
  adaptLeaderboardResponse,
  adaptLeaderboardSummaryResponse,
  adaptOwnerCopySummaryResponse,
  adaptPendingSellObligationsResponse,
  adaptPerformanceResponse,
  adaptPositionEventsResponse,
  adaptPositionResponse,
  adaptPositionsResponse,
} from 'services/copyTrading/adapters'
import type {
  AgentPerformanceQuery,
  AgentPerformanceResponse,
  AgentPositionEventsQuery,
  AgentPositionEventsResponse,
  AgentPositionQuery,
  AgentPositionResponse,
  AgentPositionsQuery,
  AgentPositionsResponse,
  AgentQuery,
  AgentResponse,
  AgentStatsQuery,
  AgentStatsResponse,
  AgentsQuery,
  AgentsResponse,
  ChainsResponse,
  CopyAccountBalancesQuery,
  CopyAccountBalancesResponse,
  CopyAccountHistoryQuery,
  CopyAccountHistoryResponse,
  CopyAccountPositionsQuery,
  CopyAccountPositionsResponse,
  CopyAccountQuery,
  CopyAccountResponse,
  CopyAccountWalletInventoryResponse,
  CopyRunCashbackPolicyResponse,
  CopyRunPerformanceQuery,
  CopyRunPerformanceResponse,
  CopyRunPositionsQuery,
  CopyRunPositionsResponse,
  CopyRunQuery,
  CopyRunResponse,
  CopyRunsQuery,
  CopyRunsResponse,
  CotLogsQuery,
  CotLogsResponse,
  LeaderboardQuery,
  LeaderboardResponse,
  LeaderboardSortBy,
  LeaderboardSummaryQuery,
  LeaderboardSummaryResponse,
  OwnerActivityQuery,
  OwnerActivityResponse,
  OwnerCopyAccountsQuery,
  OwnerCopyAccountsResponse,
  OwnerCopySummaryQuery,
  OwnerCopySummaryResponse,
  OwnerPositionsQuery,
  OwnerPositionsResponse,
  PendingSellObligationsQuery,
  PendingSellObligationsResponse,
  PerformanceInterval,
  PerformanceSeries,
  PerformanceWindow,
  PositionSortBy,
  PositionStatusFilter,
  PrepareAddCapitalRequest,
  PrepareAddCapitalResponse,
  PrepareClosePositionRequest,
  PrepareClosePositionResponse,
  PrepareManualSellRequest,
  PrepareManualSellResponse,
  PrepareStartCopyRequest,
  PrepareStartCopyResponse,
  PrepareStopCopyRequest,
  PrepareStopCopyResponse,
  PrepareWithdrawQuoteRequest,
  PrepareWithdrawQuoteResponse,
  SortOrder,
} from 'services/copyTrading/types'

type QueryParam = string | number | boolean
type QueryParams = Record<string, QueryParam | undefined>

const cleanParams = (params: QueryParams = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== ''))

const pathPart = (value: string | number) => encodeURIComponent(String(value))

const sortOrderMap: Record<SortOrder, string> = {
  asc: 'SORT_ORDER_ASC',
  desc: 'SORT_ORDER_DESC',
}

const leaderboardSortMap: Record<LeaderboardSortBy, string> = {
  apr_30d_pct: 'LEADERBOARD_SORT_FIELD_APR_30D',
  win_rate_pct: 'LEADERBOARD_SORT_FIELD_WIN_RATE',
  volume_usd: 'LEADERBOARD_SORT_FIELD_LIFETIME_VOLUME',
  copiers: 'LEADERBOARD_SORT_FIELD_COPIERS',
  aum_usd: 'LEADERBOARD_SORT_FIELD_AUM',
  open_positions: 'LEADERBOARD_SORT_FIELD_OPEN_POSITIONS',
}

const positionSortMap: Record<PositionSortBy, string> = {
  opened_at: 'POSITION_SORT_FIELD_OPENED_AT',
  closed_at: 'POSITION_SORT_FIELD_CLOSED_AT',
  value_usd: 'POSITION_SORT_FIELD_VALUE_USD',
}

const positionViewMap: Record<PositionStatusFilter, string | undefined> = {
  all: undefined,
  open: 'POSITION_VIEW_OPEN',
  closed: 'POSITION_VIEW_CLOSED',
  leftover: 'POSITION_VIEW_LEFTOVER',
}

const performanceSeriesMap: Record<PerformanceSeries, string> = {
  portfolio_value: 'PERFORMANCE_SERIES_PORTFOLIO_EQUITY',
  cumulative_realized_pnl: 'PERFORMANCE_SERIES_CUMULATIVE_REALIZED_PNL',
  period_realized_pnl: 'PERFORMANCE_SERIES_PERIOD_REALIZED_PNL',
  per_trade_realized_pnl: 'PERFORMANCE_SERIES_PER_TRADE_REALIZED_PNL',
}

const performanceWindowMap: Record<PerformanceWindow, string> = {
  '7d': 'WINDOW_7D',
  '30d': 'WINDOW_30D',
  '90d': 'WINDOW_90D',
  all: 'WINDOW_ALL',
}

const performanceIntervalMap: Record<PerformanceInterval, string> = {
  day: 'PERFORMANCE_INTERVAL_DAY',
  week: 'PERFORMANCE_INTERVAL_WEEK',
  month: 'PERFORMANCE_INTERVAL_MONTH',
}

const activityGroupMap = {
  buys: 'ACTIVITY_GROUP_BUYS',
  sells: 'ACTIVITY_GROUP_SELLS',
  deposits_withdrawals: 'ACTIVITY_GROUP_DEPOSITS_WITHDRAWALS',
  skipped: 'ACTIVITY_GROUP_SKIPPED',
}

const copyRunSortMap: Record<NonNullable<CopyRunsQuery['sortBy']>, string> = {
  started_at: 'OWNER_COPY_RUN_SORT_FIELD_STARTED_AT',
  stopped_at: 'OWNER_COPY_RUN_SORT_FIELD_STOPPED_AT',
  agent_apr_30d: 'OWNER_COPY_RUN_SORT_FIELD_AGENT_APR_30D',
  agent_win_rate: 'OWNER_COPY_RUN_SORT_FIELD_AGENT_WIN_RATE',
  agent_volume: 'OWNER_COPY_RUN_SORT_FIELD_AGENT_LIFETIME_VOLUME',
  capital_in: 'OWNER_COPY_RUN_SORT_FIELD_CAPITAL_IN',
}

const ownerViewMap = {
  open: 'OWNER_COPY_VIEW_OPEN',
  history: 'OWNER_COPY_VIEW_HISTORY',
}

const copyAccountStatusMap = {
  active: 'COPY_ACCOUNT_STATUS_ACTIVE',
  closed: 'COPY_ACCOUNT_STATUS_CLOSED',
  closing: 'COPY_ACCOUNT_STATUS_CLOSING',
  stopped: 'COPY_ACCOUNT_STATUS_STOPPED',
}

const performanceParams = ({
  series,
  window,
  interval,
  cursor,
  limit,
}: {
  series?: PerformanceSeries
  window?: PerformanceWindow
  interval?: PerformanceInterval
  cursor?: string
  limit?: number
}) =>
  cleanParams({
    series: series ? performanceSeriesMap[series] : undefined,
    window: window ? performanceWindowMap[window] : undefined,
    interval: interval ? performanceIntervalMap[interval] : undefined,
    cursor,
    limit,
  })

const positionParams = ({
  status,
  sortBy,
  sortOrder,
  cursor,
  limit,
}: {
  status?: PositionStatusFilter
  sortBy?: PositionSortBy
  sortOrder?: SortOrder
  cursor?: string
  limit?: number
}) =>
  cleanParams({
    view: status ? positionViewMap[status] : undefined,
    sortBy: sortBy ? positionSortMap[sortBy] : undefined,
    sortOrder: sortOrder ? sortOrderMap[sortOrder] : undefined,
    cursor,
    limit,
  })

const copyTradingApi = createApi({
  reducerPath: 'copyTradingApi',
  tagTypes: ['CopyTrading'],
  refetchOnMountOrArgChange: true,
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_COPY_TRADING_API_URL,
    prepareHeaders: headers => {
      headers.set('Accept', 'application/json')
      return headers
    },
  }),
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
          strategyCategory: query?.strategy ? `STRATEGY_CATEGORY_${query.strategy.toUpperCase()}` : undefined,
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
          strategyCategory: query?.strategy ? `STRATEGY_CATEGORY_${query.strategy.toUpperCase()}` : undefined,
          sortBy: query?.sortBy ? leaderboardSortMap[query.sortBy] : undefined,
          sortOrder: query?.sortOrder ? sortOrderMap[query.sortOrder] : undefined,
          cursor: query?.cursor,
          limit: query?.limit,
        }),
      }),
      transformResponse: adaptLeaderboardResponse,
      providesTags: ['CopyTrading'],
    }),
    getAgents: builder.query<AgentsResponse, AgentsQuery | void>({
      query: query => ({
        url: '/agents',
        params: cleanParams({
          chainId: query?.chainId,
          search: query?.search,
          strategyCategory: query?.strategy ? `STRATEGY_CATEGORY_${query.strategy.toUpperCase()}` : undefined,
          cursor: query?.cursor,
          limit: query?.limit,
        }),
      }),
      transformResponse: adaptAgentsResponse,
    }),
    getAgent: builder.query<AgentResponse, AgentQuery>({
      query: ({ agentId }) => `/agents/${pathPart(agentId)}`,
      transformResponse: adaptAgentResponse,
      providesTags: ['CopyTrading'],
    }),
    getAgentStats: builder.query<AgentStatsResponse, AgentStatsQuery>({
      query: ({ agentId, window }) => ({
        url: `/agents/${pathPart(agentId)}/stats`,
        params: cleanParams({ window: window ? performanceWindowMap[window] : undefined }),
      }),
      transformResponse: adaptAgentStatsResponse,
    }),
    getAgentPerformance: builder.query<AgentPerformanceResponse, AgentPerformanceQuery>({
      query: query => ({
        url: `/agents/${pathPart(query.agentId)}/performance`,
        params: performanceParams(query),
      }),
      transformResponse: adaptPerformanceResponse,
    }),
    getAgentPositions: builder.query<AgentPositionsResponse, AgentPositionsQuery>({
      query: query => ({
        url: `/agents/${pathPart(query.agentId)}/positions`,
        params: {
          ...positionParams(query),
          ...cleanParams({ token: query.token }),
        },
      }),
      transformResponse: adaptPositionsResponse,
    }),
    getAgentPosition: builder.query<AgentPositionResponse, AgentPositionQuery>({
      query: ({ agentId, positionId }) => `/agents/${pathPart(agentId)}/positions/${pathPart(positionId)}`,
      transformResponse: adaptPositionResponse,
    }),
    getAgentPositionEvents: builder.query<AgentPositionEventsResponse, AgentPositionEventsQuery>({
      query: ({ agentId, positionId, cursor, limit }) => ({
        url: `/agents/${pathPart(agentId)}/positions/${pathPart(positionId)}/events`,
        params: cleanParams({ cursor, limit }),
      }),
      transformResponse: adaptPositionEventsResponse,
    }),
    getAgentActionLogs: builder.query<CotLogsResponse, CotLogsQuery>({
      query: ({ agentId, leaderPositionId, from, to, cursor, limit }) => ({
        url: `/agents/${pathPart(agentId)}/action-logs`,
        params: cleanParams({ leaderPositionId, from, to, cursor, limit }),
      }),
      transformResponse: adaptActionLogsResponse,
    }),
    getOwnerCopySummary: builder.query<OwnerCopySummaryResponse, OwnerCopySummaryQuery>({
      query: ({ ownerAddress, view, chainId }) => ({
        url: `/users/${pathPart(ownerAddress)}/copy-summary`,
        params: cleanParams({ view: ownerViewMap[view], chainId }),
      }),
      transformResponse: adaptOwnerCopySummaryResponse,
      providesTags: ['CopyTrading'],
    }),
    getCopyRuns: builder.query<CopyRunsResponse, CopyRunsQuery>({
      query: ({ ownerAddress, view, agentId, chainId, sortBy, sortOrder, cursor, limit }) => ({
        url: `/users/${pathPart(ownerAddress)}/copy-runs`,
        params: cleanParams({
          view: ownerViewMap[view],
          agentId,
          chainId,
          sortBy: sortBy ? copyRunSortMap[sortBy] : undefined,
          sortOrder: sortOrder ? sortOrderMap[sortOrder] : undefined,
          cursor,
          limit,
        }),
      }),
      transformResponse: adaptCopyRunsResponse,
      providesTags: ['CopyTrading'],
    }),
    getCopyRun: builder.query<CopyRunResponse, CopyRunQuery>({
      query: ({ ownerAddress, copyRunId }) => `/users/${pathPart(ownerAddress)}/copy-runs/${pathPart(copyRunId)}`,
      transformResponse: adaptCopyRunResponse,
      providesTags: ['CopyTrading'],
    }),
    getCopyRunCashbackPolicy: builder.query<CopyRunCashbackPolicyResponse, CopyRunQuery>({
      query: ({ ownerAddress, copyRunId }) =>
        `/users/${pathPart(ownerAddress)}/copy-runs/${pathPart(copyRunId)}/cashback-policy`,
      transformResponse: adaptCopyRunCashbackPolicyResponse,
      providesTags: ['CopyTrading'],
    }),
    getCopyRunPositions: builder.query<CopyRunPositionsResponse, CopyRunPositionsQuery>({
      query: query => ({
        url: `/users/${pathPart(query.ownerAddress)}/copy-runs/${pathPart(query.copyRunId)}/positions`,
        params: positionParams(query),
      }),
      transformResponse: adaptPositionsResponse,
      providesTags: ['CopyTrading'],
    }),
    getCopyRunPerformance: builder.query<CopyRunPerformanceResponse, CopyRunPerformanceQuery>({
      query: query => ({
        url: `/users/${pathPart(query.ownerAddress)}/copy-runs/${pathPart(query.copyRunId)}/performance`,
        params: performanceParams(query),
      }),
      transformResponse: adaptPerformanceResponse,
      providesTags: ['CopyTrading'],
    }),
    getOwnerPositions: builder.query<OwnerPositionsResponse, OwnerPositionsQuery>({
      query: query => ({
        url: `/users/${pathPart(query.ownerAddress)}/positions`,
        params: {
          ...positionParams(query),
          ...cleanParams({ agentId: query.agentId, chainId: query.chainId }),
        },
      }),
      transformResponse: adaptPositionsResponse,
      providesTags: ['CopyTrading'],
    }),
    getOwnerActivity: builder.query<OwnerActivityResponse, OwnerActivityQuery>({
      query: ({ ownerAddress, copyRunId, chainId, activityType, group, cursor, limit }) => ({
        url: `/users/${pathPart(ownerAddress)}/activity`,
        params: cleanParams({
          copyRunId,
          chainId,
          type: activityType && activityType !== 'all' ? `ACTIVITY_TYPE_${activityType.toUpperCase()}` : undefined,
          group: group ? activityGroupMap[group] : undefined,
          cursor,
          limit,
        }),
      }),
      transformResponse: adaptActivityResponse,
      providesTags: ['CopyTrading'],
    }),
    getOwnerCopyAccounts: builder.query<OwnerCopyAccountsResponse, OwnerCopyAccountsQuery>({
      query: ({ ownerAddress, chainId, status, cursor, limit }) => ({
        url: `/users/${pathPart(ownerAddress)}/copy-accounts`,
        params: cleanParams({
          chainId,
          status: status && status !== 'all' ? copyAccountStatusMap[status] : undefined,
          cursor,
          limit,
        }),
      }),
      transformResponse: adaptCopyAccountsResponse,
      providesTags: ['CopyTrading'],
    }),
    getCopyAccount: builder.query<CopyAccountResponse, CopyAccountQuery>({
      query: ({ chainId, copyAccount }) => `/copy-accounts/${pathPart(chainId)}/${pathPart(copyAccount)}`,
      transformResponse: adaptCopyAccountResponse,
      providesTags: ['CopyTrading'],
    }),
    getCopyAccountBalances: builder.query<CopyAccountBalancesResponse, CopyAccountBalancesQuery>({
      query: ({ chainId, copyAccount, cursor, limit }) => ({
        url: `/copy-accounts/${pathPart(chainId)}/${pathPart(copyAccount)}/balances`,
        params: cleanParams({ cursor, limit }),
      }),
      transformResponse: adaptCopyAccountBalancesResponse,
      providesTags: ['CopyTrading'],
    }),
    getCopyAccountWalletInventory: builder.query<CopyAccountWalletInventoryResponse, CopyAccountQuery>({
      query: ({ chainId, copyAccount }) =>
        `/copy-accounts/${pathPart(chainId)}/${pathPart(copyAccount)}/wallet-inventory`,
      transformResponse: adaptCopyAccountWalletInventoryResponse,
      providesTags: ['CopyTrading'],
    }),
    getCopyAccountPositions: builder.query<CopyAccountPositionsResponse, CopyAccountPositionsQuery>({
      query: query => ({
        url: `/copy-accounts/${pathPart(query.chainId)}/${pathPart(query.copyAccount)}/positions`,
        params: positionParams(query),
      }),
      transformResponse: adaptPositionsResponse,
      providesTags: ['CopyTrading'],
    }),
    getPendingSellObligations: builder.query<PendingSellObligationsResponse, PendingSellObligationsQuery>({
      query: ({ chainId, copyAccount, userPositionId, cursor, limit }) => ({
        url: `/copy-accounts/${pathPart(chainId)}/${pathPart(copyAccount)}/positions/${pathPart(
          userPositionId,
        )}/pending-sell-obligations`,
        params: cleanParams({ cursor, limit }),
      }),
      transformResponse: adaptPendingSellObligationsResponse,
      providesTags: ['CopyTrading'],
    }),
    getCopyAccountHistory: builder.query<CopyAccountHistoryResponse, CopyAccountHistoryQuery>({
      query: ({ chainId, copyAccount, activityType, group, cursor, limit }) => ({
        url: `/copy-accounts/${pathPart(chainId)}/${pathPart(copyAccount)}/history`,
        params: cleanParams({
          type: activityType && activityType !== 'all' ? `ACTIVITY_TYPE_${activityType.toUpperCase()}` : undefined,
          group: group ? activityGroupMap[group] : undefined,
          cursor,
          limit,
        }),
      }),
      transformResponse: adaptActivityResponse,
      providesTags: ['CopyTrading'],
    }),
    prepareStartCopy: builder.mutation<PrepareStartCopyResponse, PrepareStartCopyRequest>({
      query: ({ ownerAddress, agentId, ...body }) => ({
        url: `/users/${pathPart(ownerAddress)}/agents/${pathPart(agentId)}:prepareStartCopy`,
        method: 'POST',
        body,
      }),
    }),
    prepareAddCapital: builder.mutation<PrepareAddCapitalResponse, PrepareAddCapitalRequest>({
      query: ({ ownerAddress, copyRunId, ...body }) => ({
        url: `/users/${pathPart(ownerAddress)}/copy-runs/${pathPart(copyRunId)}:prepareAddCapital`,
        method: 'POST',
        body,
      }),
    }),
    prepareStopCopy: builder.mutation<PrepareStopCopyResponse, PrepareStopCopyRequest>({
      query: ({ ownerAddress, copyRunId, ...body }) => ({
        url: `/users/${pathPart(ownerAddress)}/copy-runs/${pathPart(copyRunId)}:prepareStopCopy`,
        method: 'POST',
        body,
      }),
    }),
    prepareWithdrawQuote: builder.mutation<PrepareWithdrawQuoteResponse, PrepareWithdrawQuoteRequest>({
      query: ({ ownerAddress, copyRunId }) => ({
        url: `/users/${pathPart(ownerAddress)}/copy-runs/${pathPart(copyRunId)}:prepareWithdrawQuote`,
        method: 'POST',
        body: {},
      }),
    }),
    prepareManualSell: builder.mutation<PrepareManualSellResponse, PrepareManualSellRequest>({
      query: ({
        ownerAddress,
        copyRunId,
        userPositionId,
        slippageBps,
        expectedUnresolvedSkipCount,
        expectedSellRatioRaw,
      }) => ({
        url: `/users/${pathPart(ownerAddress)}/copy-runs/${pathPart(copyRunId)}/positions/${pathPart(
          userPositionId,
        )}:prepareManualSell`,
        method: 'POST',
        body: { slippageBps, expectedUnresolvedSkipCount, expectedSellRatioRaw },
      }),
    }),
    prepareClosePosition: builder.mutation<PrepareClosePositionResponse, PrepareClosePositionRequest>({
      query: ({ ownerAddress, copyRunId, userPositionId, slippageBps }) => ({
        url: `/users/${pathPart(ownerAddress)}/copy-runs/${pathPart(copyRunId)}/positions/${pathPart(
          userPositionId,
        )}:prepareClosePosition`,
        method: 'POST',
        body: { slippageBps },
      }),
    }),
  }),
})

export const {
  usePrepareStartCopyMutation,
  usePrepareAddCapitalMutation,
  usePrepareStopCopyMutation,
  usePrepareWithdrawQuoteMutation,
  usePrepareManualSellMutation,
  usePrepareClosePositionMutation,
} = copyTradingApi

export default copyTradingApi
