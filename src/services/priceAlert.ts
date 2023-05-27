import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { PRICE_ALERT_API } from 'constants/env'
import { RTK_QUERY_TAGS } from 'constants/index'
import { CreatePriceAlertPayload, PriceAlert, PriceAlertStat } from 'pages/NotificationCenter/const'

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

type GetListAlertsParams = {
  walletAddress: string
  page?: number
  pageSize?: number
  sort?: string
}

const priceAlertApi = createApi({
  reducerPath: 'priceAlertApi',
  baseQuery: fetchBaseQuery({ baseUrl: PRICE_ALERT_API }),
  tagTypes: [RTK_QUERY_TAGS.GET_ALERTS, RTK_QUERY_TAGS.GET_ALERTS_STAT],
  endpoints: builder => ({
    getListAlerts: builder.query<GetListAlertsResponseData, GetListAlertsParams>({
      query: params => ({
        url: `/v1/alerts`,
        params,
      }),
      transformResponse: (data: any) => {
        return data.data as GetListAlertsResponseData
      },
      providesTags: [RTK_QUERY_TAGS.GET_ALERTS],
    }),
    getAlertStats: builder.query<PriceAlertStat, string>({
      query: walletAddress => ({
        url: `/v1/alerts/statistics`,
        params: {
          walletAddress,
        },
      }),
      transformResponse: (data: any) => data?.data?.statistics,
      providesTags: [RTK_QUERY_TAGS.GET_ALERTS_STAT],
    }),
    createPriceAlert: builder.mutation<MetaResponse<{ id: number }>, CreatePriceAlertPayload>({
      query: body => ({
        url: `/v1/alerts`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [RTK_QUERY_TAGS.GET_ALERTS, RTK_QUERY_TAGS.GET_ALERTS_STAT],
    }),
    updatePriceAlert: builder.mutation<void, { isEnabled: boolean; id: number }>({
      query: ({ isEnabled, id }) => ({
        url: `/v1/alerts/${id}`,
        method: 'PATCH',
        body: { isEnabled },
      }),
      invalidatesTags: [RTK_QUERY_TAGS.GET_ALERTS, RTK_QUERY_TAGS.GET_ALERTS_STAT],
    }),
    deleteAllAlerts: builder.mutation<void, { account: string }>({
      query: ({ account }) => ({
        url: `/v1/alerts`,
        method: 'DELETE',
        body: { walletAddress: account },
      }),
      invalidatesTags: [RTK_QUERY_TAGS.GET_ALERTS, RTK_QUERY_TAGS.GET_ALERTS_STAT],
    }),
    deleteSingleAlert: builder.mutation<void, number>({
      query: alertId => ({
        url: `/v1/alerts/${alertId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [RTK_QUERY_TAGS.GET_ALERTS, RTK_QUERY_TAGS.GET_ALERTS_STAT],
    }),
  }),
})
export const {
  useCreatePriceAlertMutation,
  useUpdatePriceAlertMutation,
  useGetAlertStatsQuery,
  useGetListAlertsQuery,
  useDeleteAllAlertsMutation,
  useDeleteSingleAlertMutation,
} = priceAlertApi
export default priceAlertApi
