import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { PRICE_ALERT_API } from 'constants/env'
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

  // TODO: check this
  sort?: string
}

const priceAlertApi = createApi({
  reducerPath: 'priceAlertApi',
  baseQuery: fetchBaseQuery({ baseUrl: PRICE_ALERT_API }),
  // TODO: check here
  tagTypes: ['PriceAlerts'],
  endpoints: builder => ({
    getListAlerts: builder.query<GetListAlertsResponseData, GetListAlertsParams>({
      query: params => ({
        url: `/v1/alerts`,
        params,
      }),
      transformResponse: (data: any) => {
        return data.data as GetListAlertsResponseData
      },
      // TODO: check here
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
    }),
    createPriceAlert: builder.mutation<MetaResponse<{ id: number }>, CreatePriceAlertPayload>({
      query: body => ({
        url: `/v1/alerts`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PriceAlerts'],
    }),
    updatePriceAlert: builder.mutation<void, { isEnabled: boolean; id: number }>({
      query: ({ isEnabled, id }) => ({
        url: `/v1/alerts/${id}`,
        method: 'PATCH',
        body: { isEnabled },
      }),
      invalidatesTags: ['PriceAlerts'],
    }),
    deleteAllAlerts: builder.mutation<void, string>({
      query: account => ({
        url: `/v1/alerts`,
        method: 'DELETE',
        body: { walletAddress: account },
      }),
      invalidatesTags: ['PriceAlerts'],
    }),
    deleteSingleAlert: builder.mutation<void, number>({
      query: alertId => ({
        url: `/v1/alerts/${alertId}`,
        method: 'DELETE',
      }),
      // TODO: check here
      invalidatesTags: ['PriceAlerts'],
    }),
  }),
})
export const {
  useCreatePriceAlertMutation,
  useUpdatePriceAlertMutation,
  useGetAlertStatsQuery,
  useLazyGetAlertStatsQuery,
  useGetListAlertsQuery,
  useDeleteAllAlertsMutation,
  useDeleteSingleAlertMutation,
} = priceAlertApi
export default priceAlertApi
