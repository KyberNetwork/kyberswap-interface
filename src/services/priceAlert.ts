import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import produce from 'immer'

import { NOTIFICATION_API, PRICE_ALERT_API, PRICE_ALERT_TEMPLATE_IDS } from 'constants/env'
import {
  CreatePriceAlertPayload,
  HistoricalPriceAlert,
  PriceAlert,
  PriceAlertStat,
} from 'pages/NotificationCenter/const'

type MetaResponse<T> = {
  code: number
  data?: T
  message: string
}

type GetListAlertsResponseData = {
  alerts: PriceAlert[]
  pagination: {
    totalItems: number
  }
}

type GetListHistoricalAlertsResponseData = {
  historicalAlerts: HistoricalPriceAlert[]
  pagination: {
    totalItems: number
  }
}

type GetListAlertsParams = {
  walletAddress: string
  page?: number
  pageSize?: number

  // TODO: check this
  sort?: string
}

const transformGetListHistoricalAlertsResponse = (data: any): GetListHistoricalAlertsResponseData => {
  const { notifications, pagination } = data.data ?? {}
  try {
    return {
      historicalAlerts: (notifications || []).map((notification: any) => {
        const { alert } = JSON.parse(notification.templateBody || '{}') || {}
        return produce(alert, (draft: any) => {
          draft.sentAt = notification.sentAt
          draft.id = notification.id

          draft.tokenInLogoURL = draft.tokenInLogoUrl
          delete draft.tokenInLogoUrl

          draft.tokenOutLogoURL = draft.tokenOutLogoUrl
          delete draft.tokenOutLogoUrl
        })
      }),
      pagination,
    } as GetListHistoricalAlertsResponseData
  } catch (e) {
    return {
      historicalAlerts: [],
      pagination: {
        totalItems: 0,
      },
    }
  }
}

const priceAlertApi = createApi({
  reducerPath: 'priceAlertApi',
  baseQuery: fetchBaseQuery({ baseUrl: PRICE_ALERT_API }),
  tagTypes: ['PriceAlerts', 'PriceAlertsHistory', 'PriceAlertsStat'],
  endpoints: builder => ({
    getListAlerts: builder.query<GetListAlertsResponseData, GetListAlertsParams>({
      query: params => ({
        url: `/v1/alerts`,
        params,
      }),
      transformResponse: (data: any) => {
        return data.data as GetListAlertsResponseData
      },
      providesTags: ['PriceAlerts'],
    }),
    getAlertStats: builder.query<PriceAlertStat, string>({
      query: walletAddress => ({
        url: `/v1/alerts/statistics`,
        params: {
          walletAddress,
        },
      }),
      transformResponse: (data: any) => data?.data?.statistics,
      providesTags: ['PriceAlertsStat'],
    }),
    createPriceAlert: builder.mutation<MetaResponse<{ id: number }>, CreatePriceAlertPayload>({
      query: body => ({
        url: `/v1/alerts`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PriceAlerts', 'PriceAlertsStat'],
    }),
    updatePriceAlert: builder.mutation<void, { isEnabled: boolean; id: number }>({
      query: ({ isEnabled, id }) => ({
        url: `/v1/alerts/${id}`,
        method: 'PATCH',
        body: { isEnabled },
      }),
      invalidatesTags: ['PriceAlerts', 'PriceAlertsStat'],
    }),
    deleteAllAlerts: builder.mutation<void, { account: string }>({
      query: ({ account }) => ({
        url: `/v1/alerts`,
        method: 'DELETE',
        body: { walletAddress: account },
      }),
      invalidatesTags: ['PriceAlerts', 'PriceAlertsStat'],
    }),
    deleteSingleAlert: builder.mutation<void, number>({
      query: alertId => ({
        url: `/v1/alerts/${alertId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PriceAlerts', 'PriceAlertsStat'],
    }),
    getListPriceAlertHistory: builder.query<
      GetListHistoricalAlertsResponseData,
      {
        account: string
        page: number
        pageSize?: number
      }
    >({
      query: ({ account, ...params }) => ({
        url: `${NOTIFICATION_API}/v1/users/${account}/notifications`,
        params: { ...params, templateIds: PRICE_ALERT_TEMPLATE_IDS },
      }),
      transformResponse: transformGetListHistoricalAlertsResponse,
      providesTags: ['PriceAlertsHistory'],
    }),
    clearSinglePriceAlertHistory: builder.mutation<
      Response,
      {
        account: string
        id: number
      }
    >({
      query: ({ account, id }) => ({
        url: `${NOTIFICATION_API}/v1/users/${account}/notifications/clear`,
        body: {
          ids: [id],
        },
        method: 'PUT',
      }),
      invalidatesTags: ['PriceAlertsHistory'],
    }),
    clearAllPriceAlertHistory: builder.mutation<
      Response,
      {
        account: string
      }
    >({
      query: ({ account }) => ({
        url: `${NOTIFICATION_API}/v1/users/${account}/notifications/clear-all`,
        body: {
          templateIds: PRICE_ALERT_TEMPLATE_IDS,
        },
        method: 'PUT',
      }),
      invalidatesTags: ['PriceAlertsHistory'],
    }),
  }),
})
export const {
  useCreatePriceAlertMutation,
  useUpdatePriceAlertMutation,
  useGetAlertStatsQuery,
  useGetListPriceAlertHistoryQuery,
  useLazyGetAlertStatsQuery,
  useGetListAlertsQuery,
  useDeleteAllAlertsMutation,
  useDeleteSingleAlertMutation,
  useClearSinglePriceAlertHistoryMutation,
  useClearAllPriceAlertHistoryMutation,
} = priceAlertApi
export default priceAlertApi
