import { adaptActionLogsResponse } from 'services/copyTrading/adapters/activity'
import {
  adaptAgentResponse,
  adaptAgentStatsResponse,
  adaptAgentsResponse,
  adaptPerformanceResponse,
} from 'services/copyTrading/adapters/agents'
import {
  adaptPositionEventsResponse,
  adaptPositionResponse,
  adaptPositionsResponse,
} from 'services/copyTrading/adapters/positions'
import type {
  AgentPerformanceQuery,
  AgentPositionEventsQuery,
  AgentPositionQuery,
  AgentPositionsQuery,
  AgentQuery,
  AgentStatsQuery,
  AgentsQuery,
  CotLogsQuery,
} from 'services/copyTrading/types/queries'
import type {
  AgentPerformanceResponse,
  AgentPositionEventsResponse,
  AgentPositionResponse,
  AgentPositionsResponse,
  AgentResponse,
  AgentStatsResponse,
  AgentsResponse,
  CotLogsResponse,
} from 'services/copyTrading/types/responses'

import copyTradingBaseApi from '../baseApi'
import { cleanParams, pathPart, performanceParams, performanceWindowMap, positionParams } from '../queryParams'

const agentApi = copyTradingBaseApi.injectEndpoints({
  endpoints: builder => ({
    getAgents: builder.query<AgentsResponse, AgentsQuery | void>({
      query: query => ({
        url: '/agents',
        params: cleanParams({
          chainId: query?.chainId,
          search: query?.search,
          strategyCategory: query?.strategy ? 'STRATEGY_CATEGORY_' + query.strategy.toUpperCase() : undefined,
          cursor: query?.cursor,
          limit: query?.limit,
        }),
      }),
      transformResponse: adaptAgentsResponse,
    }),
    getAgent: builder.query<AgentResponse, AgentQuery>({
      query: ({ agentId }) => '/agents/' + pathPart(agentId),
      transformResponse: adaptAgentResponse,
      providesTags: ['CopyTrading'],
    }),
    getAgentStats: builder.query<AgentStatsResponse, AgentStatsQuery>({
      query: ({ agentId, window }) => ({
        url: '/agents/' + pathPart(agentId) + '/stats',
        params: cleanParams({ window: window ? performanceWindowMap[window] : undefined }),
      }),
      transformResponse: adaptAgentStatsResponse,
      providesTags: ['CopyTrading'],
    }),
    getAgentPerformance: builder.query<AgentPerformanceResponse, AgentPerformanceQuery>({
      query: query => ({
        url: '/agents/' + pathPart(query.agentId) + '/performance',
        params: performanceParams(query),
      }),
      transformResponse: adaptPerformanceResponse,
      providesTags: ['CopyTrading'],
    }),
    getAgentPositions: builder.query<AgentPositionsResponse, AgentPositionsQuery>({
      query: query => ({
        url: '/agents/' + pathPart(query.agentId) + '/positions',
        params: {
          ...positionParams(query),
          ...cleanParams({ token: query.token }),
        },
      }),
      transformResponse: adaptPositionsResponse,
    }),
    getAgentPosition: builder.query<AgentPositionResponse, AgentPositionQuery>({
      query: ({ agentId, positionId }) => '/agents/' + pathPart(agentId) + '/positions/' + pathPart(positionId),
      transformResponse: adaptPositionResponse,
    }),
    getAgentPositionEvents: builder.query<AgentPositionEventsResponse, AgentPositionEventsQuery>({
      query: ({ agentId, positionId, cursor, limit }) => ({
        url: '/agents/' + pathPart(agentId) + '/positions/' + pathPart(positionId) + '/events',
        params: cleanParams({ cursor, limit }),
      }),
      transformResponse: adaptPositionEventsResponse,
    }),
    getAgentActionLogs: builder.query<CotLogsResponse, CotLogsQuery>({
      query: ({ agentId, leaderPositionId, type, groupBy, from, to, cursor, limit }) => ({
        url: '/agents/' + pathPart(agentId) + '/action-logs',
        params: cleanParams({ leaderPositionId, type, groupBy, from, to, cursor, limit }),
      }),
      transformResponse: adaptActionLogsResponse,
    }),
  }),
})

export default agentApi
