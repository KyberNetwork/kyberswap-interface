import { adaptActivityResponse } from 'services/copyTrading/adapters/activity'
import {
  adaptCopyAccountBalancesResponse,
  adaptCopyAccountResponse,
  adaptCopyAccountWalletInventoryResponse,
  adaptPendingSellObligationsResponse,
} from 'services/copyTrading/adapters/copyAccounts'
import { adaptPositionsResponse } from 'services/copyTrading/adapters/positions'
import type {
  CopyAccountBalancesQuery,
  CopyAccountHistoryQuery,
  CopyAccountPositionsQuery,
  CopyAccountQuery,
  PendingSellObligationsQuery,
} from 'services/copyTrading/types/queries'
import type {
  CopyAccountBalancesResponse,
  CopyAccountHistoryResponse,
  CopyAccountPositionsResponse,
  CopyAccountResponse,
  CopyAccountWalletInventoryResponse,
  PendingSellObligationsResponse,
} from 'services/copyTrading/types/responses'

import copyTradingBaseApi from '../baseApi'
import { activityGroupMap, cleanParams, pathPart, positionParams } from '../queryParams'

const copyAccountApi = copyTradingBaseApi.injectEndpoints({
  endpoints: builder => ({
    getCopyAccount: builder.query<CopyAccountResponse, CopyAccountQuery>({
      query: ({ chainId, copyAccount }) => '/copy-accounts/' + pathPart(chainId) + '/' + pathPart(copyAccount),
      transformResponse: adaptCopyAccountResponse,
      providesTags: ['CopyTrading'],
    }),
    getCopyAccountBalances: builder.query<CopyAccountBalancesResponse, CopyAccountBalancesQuery>({
      query: ({ chainId, copyAccount, cursor, limit }) => ({
        url: '/copy-accounts/' + pathPart(chainId) + '/' + pathPart(copyAccount) + '/balances',
        params: cleanParams({ cursor, limit }),
      }),
      transformResponse: adaptCopyAccountBalancesResponse,
      providesTags: ['CopyTrading'],
    }),
    getCopyAccountWalletInventory: builder.query<CopyAccountWalletInventoryResponse, CopyAccountQuery>({
      query: ({ chainId, copyAccount }) =>
        '/copy-accounts/' + pathPart(chainId) + '/' + pathPart(copyAccount) + '/wallet-inventory',
      transformResponse: adaptCopyAccountWalletInventoryResponse,
      providesTags: ['CopyTrading'],
    }),
    getCopyAccountPositions: builder.query<CopyAccountPositionsResponse, CopyAccountPositionsQuery>({
      query: query => ({
        url: '/copy-accounts/' + pathPart(query.chainId) + '/' + pathPart(query.copyAccount) + '/positions',
        params: positionParams(query),
      }),
      transformResponse: adaptPositionsResponse,
      providesTags: ['CopyTrading'],
    }),
    getPendingSellObligations: builder.query<PendingSellObligationsResponse, PendingSellObligationsQuery>({
      query: ({ chainId, copyAccount, userPositionId, cursor, limit }) => ({
        url:
          '/copy-accounts/' +
          pathPart(chainId) +
          '/' +
          pathPart(copyAccount) +
          '/positions/' +
          pathPart(userPositionId) +
          '/pending-sell-obligations',
        params: cleanParams({ cursor, limit }),
      }),
      transformResponse: adaptPendingSellObligationsResponse,
      providesTags: ['CopyTrading'],
    }),
    getCopyAccountHistory: builder.query<CopyAccountHistoryResponse, CopyAccountHistoryQuery>({
      query: ({ chainId, copyAccount, activityType, group, cursor, limit }) => ({
        url: '/copy-accounts/' + pathPart(chainId) + '/' + pathPart(copyAccount) + '/history',
        params: cleanParams({
          type: activityType && activityType !== 'all' ? 'ACTIVITY_TYPE_' + activityType.toUpperCase() : undefined,
          group: group ? activityGroupMap[group] : undefined,
          cursor,
          limit,
        }),
      }),
      transformResponse: adaptActivityResponse,
      providesTags: ['CopyTrading'],
    }),
  }),
})

export default copyAccountApi
