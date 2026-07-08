import type { BaseQueryFn, FetchBaseQueryError, FetchArgs as RtkFetchArgs } from '@reduxjs/toolkit/query'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { mockDataApi } from 'services/copyTrading/mockData'
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
  LeaderboardSummaryQuery,
  LeaderboardSummaryResponse,
  OwnerActivityQuery,
  OwnerActivityResponse,
  OwnerCopyAccountsQuery,
  OwnerCopyAccountsResponse,
  OwnerCopySummaryResponse,
  OwnerPositionsQuery,
  OwnerPositionsResponse,
  OwnerQuery,
} from 'services/copyTrading/types'

type QueryParam = string | number | boolean | readonly string[]
type QueryParams = Record<string, QueryParam | undefined>
type RequestArgs<T> = {
  url: `/${string}`
  mockResponse: T
  params?: QueryParams
}
type MockFetchArgs<T = unknown> = RtkFetchArgs & {
  mockResponse: T
}

const cleanParams = (params: QueryParams = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== ''))

const request = <T>({ url, mockResponse, params }: RequestArgs<T>): MockFetchArgs<T> => {
  const queryParams = cleanParams(params)

  return {
    url,
    ...(Object.keys(queryParams).length ? { params: queryParams } : {}),
    mockResponse,
  }
}

const mockBaseQuery: BaseQueryFn<string | MockFetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  if (typeof args === 'object' && 'mockResponse' in args) {
    return {
      data: args.mockResponse,
    }
  }
  return fetchBaseQuery({
    baseUrl: '/api/v1',
  })(args, api, extraOptions)
}

const copyTradingApi = createApi({
  reducerPath: 'copyTradingApi',
  baseQuery: mockBaseQuery,
  endpoints: builder => ({
    getChains: builder.query<ChainsResponse, void>({
      query: () =>
        request({
          url: '/chains',
          mockResponse: mockDataApi.getChains(),
        }),
    }),
    getLeaderboardSummary: builder.query<LeaderboardSummaryResponse, LeaderboardSummaryQuery | void>({
      query: query =>
        request({
          url: '/leaderboard/summary',
          mockResponse: mockDataApi.getLeaderboardSummary(query || undefined),
          params: {
            chainId: query?.chainId,
            strategy: query?.strategy,
            risk: query?.risk,
            search: query?.search,
          },
        }),
    }),
    getLeaderboard: builder.query<LeaderboardResponse, LeaderboardQuery | void>({
      query: query =>
        request({
          url: '/leaderboard',
          mockResponse: mockDataApi.getLeaderboard(query || undefined),
          params: {
            chainId: query?.chainId,
            strategy: query?.strategy,
            risk: query?.risk,
            search: query?.search,
            sortBy: query?.sortBy,
            sortOrder: query?.sortOrder,
            page: query?.page,
            pageSize: query?.pageSize,
          },
        }),
    }),
    getAgents: builder.query<AgentsResponse, AgentsQuery | void>({
      query: query =>
        request({
          url: '/agents',
          mockResponse: mockDataApi.getAgents(query || undefined),
          params: {
            chainId: query?.chainId,
            strategy: query?.strategy,
            risk: query?.risk,
            search: query?.search,
            page: query?.page,
            pageSize: query?.pageSize,
          },
        }),
    }),
    getAgent: builder.query<AgentResponse, AgentQuery>({
      query: ({ agentId }) =>
        request({
          url: `/agents/${agentId}`,
          mockResponse: mockDataApi.getAgent(agentId),
        }),
    }),
    getAgentStats: builder.query<AgentStatsResponse, AgentStatsQuery>({
      query: ({ agentId, window, chainId }) =>
        request({
          url: `/agents/${agentId}/stats`,
          mockResponse: mockDataApi.getAgentStats(agentId),
          params: {
            window,
            chainId,
          },
        }),
    }),
    getAgentPerformance: builder.query<AgentPerformanceResponse, AgentPerformanceQuery>({
      query: query =>
        request({
          url: `/agents/${query.agentId}/performance`,
          mockResponse: mockDataApi.getAgentPerformance(query),
          params: {
            series: query.series,
            window: query.window,
            interval: query.interval,
            chainId: query.chainId,
            cursor: query.cursor,
            limit: query.limit,
          },
        }),
    }),
    getAgentPositions: builder.query<AgentPositionsResponse, AgentPositionsQuery>({
      query: query =>
        request({
          url: `/agents/${query.agentId}/positions`,
          mockResponse: mockDataApi.getAgentPositions(query),
          params: {
            status: query.status,
            chainId: query.chainId,
            token: query.token,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
            cursor: query.cursor,
            limit: query.limit,
          },
        }),
    }),
    getAgentPosition: builder.query<AgentPositionResponse, AgentPositionQuery>({
      query: query =>
        request({
          url: `/agents/${query.agentId}/positions/${query.positionId}`,
          mockResponse: mockDataApi.getAgentPosition(query),
        }),
    }),
    getAgentPositionEvents: builder.query<AgentPositionEventsResponse, AgentPositionEventsQuery>({
      query: query =>
        request({
          url: `/agents/${query.agentId}/positions/${query.positionId}/events`,
          mockResponse: mockDataApi.getAgentPositionEvents(query),
          params: {
            cursor: query.cursor,
            limit: query.limit,
          },
        }),
    }),
    getAgentCotLogs: builder.query<CotLogsResponse, CotLogsQuery>({
      query: query =>
        request({
          url: `/agents/${query.agentId}/cot-logs`,
          mockResponse: mockDataApi.getAgentCotLogs(query),
          params: {
            chainId: query.chainId,
            positionId: query.positionId,
            from: query.from,
            to: query.to,
            cursor: query.cursor,
            limit: query.limit,
          },
        }),
    }),
    getOwnerCopySummary: builder.query<OwnerCopySummaryResponse, OwnerQuery>({
      query: query =>
        request({
          url: `/users/${query.ownerAddress}/copy-summary`,
          mockResponse: mockDataApi.getOwnerCopySummary(query),
          params: {
            chainId: query.chainId,
          },
        }),
    }),
    getCopyRuns: builder.query<CopyRunsResponse, CopyRunsQuery>({
      query: query =>
        request({
          url: `/users/${query.ownerAddress}/copy-runs`,
          mockResponse: mockDataApi.getCopyRuns(query),
          params: {
            status: query.status,
            agentId: query.agentId,
            chainId: query.chainId,
            cursor: query.cursor,
            limit: query.limit,
          },
        }),
    }),
    getCopyRun: builder.query<CopyRunResponse, CopyRunQuery>({
      query: query =>
        request({
          url: `/users/${query.ownerAddress}/copy-runs/${query.copyRunId}`,
          mockResponse: mockDataApi.getCopyRun(query),
        }),
    }),
    getCopyRunPositions: builder.query<CopyRunPositionsResponse, CopyRunPositionsQuery>({
      query: query =>
        request({
          url: `/users/${query.ownerAddress}/copy-runs/${query.copyRunId}/positions`,
          mockResponse: mockDataApi.getCopyRunPositions(query),
          params: {
            status: query.status,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
            cursor: query.cursor,
            limit: query.limit,
          },
        }),
    }),
    getCopyRunPerformance: builder.query<CopyRunPerformanceResponse, CopyRunPerformanceQuery>({
      query: query =>
        request({
          url: `/users/${query.ownerAddress}/copy-runs/${query.copyRunId}/performance`,
          mockResponse: mockDataApi.getCopyRunPerformance(query),
          params: {
            series: query.series,
            window: query.window,
            interval: query.interval,
            cursor: query.cursor,
            limit: query.limit,
          },
        }),
    }),
    getOwnerPositions: builder.query<OwnerPositionsResponse, OwnerPositionsQuery>({
      query: query =>
        request({
          url: `/users/${query.ownerAddress}/positions`,
          mockResponse: mockDataApi.getOwnerPositions(query),
          params: {
            status: query.status,
            agentId: query.agentId,
            chainId: query.chainId,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
            cursor: query.cursor,
            limit: query.limit,
          },
        }),
    }),
    getOwnerActivity: builder.query<OwnerActivityResponse, OwnerActivityQuery>({
      query: query =>
        request({
          url: `/users/${query.ownerAddress}/activity`,
          mockResponse: mockDataApi.getOwnerActivity(query),
          params: {
            copyRunId: query.copyRunId,
            chainId: query.chainId,
            cursor: query.cursor,
            limit: query.limit,
          },
        }),
    }),
    getOwnerCopyAccounts: builder.query<OwnerCopyAccountsResponse, OwnerCopyAccountsQuery>({
      query: query =>
        request({
          url: `/users/${query.ownerAddress}/copy-accounts`,
          mockResponse: mockDataApi.getOwnerCopyAccounts(query),
          params: {
            status: query.status,
            chainId: query.chainId,
            page: query.page,
            pageSize: query.pageSize,
          },
        }),
    }),
    getCopyAccount: builder.query<CopyAccountResponse, CopyAccountQuery>({
      query: query =>
        request({
          url: `/copy-accounts/${query.chainId}/${query.copyAccount}`,
          mockResponse: mockDataApi.getCopyAccount(query),
        }),
    }),
    getCopyAccountBalances: builder.query<CopyAccountBalancesResponse, CopyAccountBalancesQuery>({
      query: query =>
        request({
          url: `/copy-accounts/${query.chainId}/${query.copyAccount}/balances`,
          mockResponse: mockDataApi.getCopyAccountBalances(query),
          params: {
            tokenAddresses: query.tokenAddresses,
            cursor: query.cursor,
            limit: query.limit,
          },
        }),
    }),
    getCopyAccountPositions: builder.query<CopyAccountPositionsResponse, CopyAccountPositionsQuery>({
      query: query =>
        request({
          url: `/copy-accounts/${query.chainId}/${query.copyAccount}/positions`,
          mockResponse: mockDataApi.getCopyAccountPositions(query),
          params: {
            status: query.status,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
            cursor: query.cursor,
            limit: query.limit,
          },
        }),
    }),
    getCopyAccountHistory: builder.query<CopyAccountHistoryResponse, CopyAccountHistoryQuery>({
      query: query =>
        request({
          url: `/copy-accounts/${query.chainId}/${query.copyAccount}/history`,
          mockResponse: mockDataApi.getCopyAccountHistory(query),
          params: {
            activityType: query.activityType,
            cursor: query.cursor,
            limit: query.limit,
          },
        }),
    }),
  }),
})

export default copyTradingApi
