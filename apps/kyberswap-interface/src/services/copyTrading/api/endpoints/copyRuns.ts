import { adaptActivityResponse } from 'services/copyTrading/adapters/activity'
import { adaptPerformanceResponse } from 'services/copyTrading/adapters/agents'
import { adaptCopyAccountsResponse } from 'services/copyTrading/adapters/copyAccounts'
import {
  adaptCopyRunCashbackPolicyResponse,
  adaptCopyRunResponse,
  adaptCopyRunsResponse,
  adaptOwnerCopySummaryResponse,
} from 'services/copyTrading/adapters/copyRuns'
import { adaptClosedPositionExecutionsResponse, adaptPositionsResponse } from 'services/copyTrading/adapters/positions'
import type {
  CopyRunPerformanceQuery,
  CopyRunPositionClosedExecutionsQuery,
  CopyRunPositionsQuery,
  CopyRunQuery,
  CopyRunsQuery,
  OwnerActivityQuery,
  OwnerCopyAccountsQuery,
  OwnerCopySummaryQuery,
  OwnerPositionsQuery,
} from 'services/copyTrading/types/queries'
import type {
  CopyRunCashbackPolicyResponse,
  CopyRunPerformanceResponse,
  CopyRunPositionClosedExecutionsResponse,
  CopyRunPositionsResponse,
  CopyRunResponse,
  CopyRunsResponse,
  OwnerActivityResponse,
  OwnerCopyAccountsResponse,
  OwnerCopySummaryResponse,
  OwnerPositionsResponse,
} from 'services/copyTrading/types/responses'

import copyTradingBaseApi from '../baseApi'
import {
  activityCategoryMap,
  activityGroupMap,
  activitySubtypeMap,
  activitySurfaceMap,
  cleanParams,
  copyAccountStatusMap,
  copyRunSortMap,
  ownerViewMap,
  pathPart,
  performanceParams,
  positionParams,
  sortOrderMap,
} from '../queryParams'

const copyRunApi = copyTradingBaseApi.injectEndpoints({
  endpoints: builder => ({
    getOwnerCopySummary: builder.query<OwnerCopySummaryResponse, OwnerCopySummaryQuery>({
      query: ({ ownerAddress, view, chainId }) => ({
        url: '/users/' + pathPart(ownerAddress) + '/copy-summary',
        params: cleanParams({ view: ownerViewMap[view], chainId }),
      }),
      transformResponse: adaptOwnerCopySummaryResponse,
      providesTags: ['CopyTrading'],
    }),
    getCopyRuns: builder.query<CopyRunsResponse, CopyRunsQuery>({
      query: ({ ownerAddress, view, agentId, chainId, sortBy, sortOrder, cursor, limit }) => ({
        url: '/users/' + pathPart(ownerAddress) + '/copy-runs',
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
      query: ({ ownerAddress, copyRunId }) => '/users/' + pathPart(ownerAddress) + '/copy-runs/' + pathPart(copyRunId),
      transformResponse: adaptCopyRunResponse,
      providesTags: ['CopyTrading'],
    }),
    getCopyRunCashbackPolicy: builder.query<CopyRunCashbackPolicyResponse, CopyRunQuery>({
      query: ({ ownerAddress, copyRunId }) =>
        '/users/' + pathPart(ownerAddress) + '/copy-runs/' + pathPart(copyRunId) + '/cashback-policy',
      transformResponse: adaptCopyRunCashbackPolicyResponse,
      providesTags: ['CopyTrading'],
    }),
    getCopyRunPositions: builder.query<CopyRunPositionsResponse, CopyRunPositionsQuery>({
      query: query => ({
        url: '/users/' + pathPart(query.ownerAddress) + '/copy-runs/' + pathPart(query.copyRunId) + '/positions',
        params: positionParams(query),
      }),
      transformResponse: adaptPositionsResponse,
      providesTags: ['CopyTrading'],
    }),
    getCopyRunPositionClosedExecutions: builder.query<
      CopyRunPositionClosedExecutionsResponse,
      CopyRunPositionClosedExecutionsQuery
    >({
      query: ({ ownerAddress, copyRunId, positionId, cursor, limit }) => ({
        url:
          '/users/' +
          pathPart(ownerAddress) +
          '/copy-runs/' +
          pathPart(copyRunId) +
          '/positions/' +
          pathPart(positionId) +
          '/closed-executions',
        params: cleanParams({ cursor, limit }),
      }),
      transformResponse: adaptClosedPositionExecutionsResponse,
      providesTags: ['CopyTrading'],
    }),
    getCopyRunPerformance: builder.query<CopyRunPerformanceResponse, CopyRunPerformanceQuery>({
      query: query => ({
        url: '/users/' + pathPart(query.ownerAddress) + '/copy-runs/' + pathPart(query.copyRunId) + '/performance',
        params: performanceParams(query),
      }),
      transformResponse: adaptPerformanceResponse,
      providesTags: ['CopyTrading'],
    }),
    getOwnerPositions: builder.query<OwnerPositionsResponse, OwnerPositionsQuery>({
      query: query => ({
        url: '/users/' + pathPart(query.ownerAddress) + '/positions',
        params: {
          ...positionParams(query),
          ...cleanParams({ agentId: query.agentId, chainId: query.chainId }),
        },
      }),
      transformResponse: adaptPositionsResponse,
      providesTags: ['CopyTrading'],
    }),
    getOwnerActivity: builder.query<OwnerActivityResponse, OwnerActivityQuery>({
      query: ({
        ownerAddress,
        copyRunId,
        chainId,
        activityType,
        group,
        activitySurface,
        category,
        subtype,
        cursor,
        limit,
      }) => ({
        url: '/users/' + pathPart(ownerAddress) + '/activity',
        params: cleanParams({
          copyRunId,
          chainId,
          type: activityType && activityType !== 'all' ? 'ACTIVITY_TYPE_' + activityType.toUpperCase() : undefined,
          group: group ? activityGroupMap[group] : undefined,
          activitySurface: activitySurface ? activitySurfaceMap[activitySurface] : undefined,
          category: category ? activityCategoryMap[category] : undefined,
          subtype: subtype ? activitySubtypeMap[subtype] : undefined,
          cursor,
          limit,
        }),
      }),
      transformResponse: adaptActivityResponse,
      providesTags: ['CopyTrading'],
    }),
    getOwnerCopyAccounts: builder.query<OwnerCopyAccountsResponse, OwnerCopyAccountsQuery>({
      query: ({ ownerAddress, chainId, status, cursor, limit }) => ({
        url: '/users/' + pathPart(ownerAddress) + '/copy-accounts',
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
  }),
})

export default copyRunApi
