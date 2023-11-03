import { createApi } from '@reduxjs/toolkit/query/react'
import baseQueryOauth from 'services/baseQueryOauth'

import { BFF_API } from 'constants/env'
import { RTK_QUERY_TAGS } from 'constants/index'
import { Portfolio } from 'pages/NotificationCenter/Portfolio/type'

const portfolioApi = createApi({
  reducerPath: 'portfolioApi',
  baseQuery: baseQueryOauth({ baseUrl: BFF_API }),
  tagTypes: [RTK_QUERY_TAGS.GET_LIST_PORTFOLIO],
  endpoints: builder => ({
    getPortfolios: builder.query<Portfolio, void>({
      query: () => ({
        url: '/v1/profile/me',
      }),
      transformResponse: (data: any) => data?.data?.profile,
      providesTags: [RTK_QUERY_TAGS.GET_LIST_PORTFOLIO],
    }),
    createPortfolio: builder.mutation<Portfolio, void>({
      query: () => ({
        url: '/v1/profile/me',
        method: 'POST',
      }),
      transformResponse: (data: any) => data?.data?.profile,
      invalidatesTags: [RTK_QUERY_TAGS.GET_LIST_PORTFOLIO],
    }),
    updatePortfolio: builder.mutation<Portfolio, void>({
      query: () => ({
        url: '/v1/profile/me',
        method: 'POST',
      }),
      transformResponse: (data: any) => data?.data?.profile,
      invalidatesTags: [RTK_QUERY_TAGS.GET_LIST_PORTFOLIO],
    }),
  }),
})

export const { useGetPortfoliosQuery, useCreatePortfolioMutation, useUpdatePortfolioMutation } = portfolioApi

export default portfolioApi
