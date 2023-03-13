import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { NOTIFICATION_IGNORE_TEMPLATE_IDS, PRICE_ALERT_API } from 'constants/env'
import { PriceAlert, PriceAlertStat } from 'pages/NotificationCenter/const'

type Params = {
  page: number
  account?: string
}

const priceAlertApi = createApi({
  reducerPath: 'priceAlertApi',
  baseQuery: fetchBaseQuery({ baseUrl: PRICE_ALERT_API }),
  endpoints: builder => ({
    getAllAlert: builder.query<void, Params>({
      query: ({ account, ...params }) => ({
        url: `/v1/users/${account}/notifications`,
        params: { ...params, excludedTemplateIds: NOTIFICATION_IGNORE_TEMPLATE_IDS },
      }),
    }),
    getAlertStats: builder.query<PriceAlertStat, { walletAddress: string }>({
      query: params => ({
        url: `/v1/alerts/statistics`,
        params,
      }),
      transformResponse: (data: any) => data?.data?.statistics,
    }),
    createPriceAlert: builder.mutation<void, PriceAlert>({
      query: body => ({
        url: `/v1/alerts`,
        method: 'post',
        body,
      }),
    }),
    updatePriceAlert: builder.mutation<void, { isEnabled: boolean; id: number }>({
      query: ({ isEnabled, id }) => ({
        url: `/v1/alerts/${id}`,
        method: 'PATCH',
        body: { isEnabled },
      }),
    }),
  }),
})
export const {
  useCreatePriceAlertMutation,
  useUpdatePriceAlertMutation,
  useGetAlertStatsQuery,
  useLazyGetAlertStatsQuery,
} = priceAlertApi
export default priceAlertApi
