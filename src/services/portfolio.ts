import { createApi } from '@reduxjs/toolkit/query/react'
import baseQueryOauth from 'services/baseQueryOauth'

import { BFF_API } from 'constants/env'
import { Portfolio } from 'pages/NotificationCenter/Portfolio/type'

const portfolioApi = createApi({
  reducerPath: 'portfolioApi',
  baseQuery: baseQueryOauth({ baseUrl: BFF_API }),
  endpoints: builder => ({
    getPortfolio: builder.query<Portfolio, void>({
      query: () => ({
        url: '/v1/profile/me',
      }),
      transformResponse: (data: any) => data?.data?.profile,
    }),
  }),
})

export const { useGetPortfolioQuery } = portfolioApi

export default portfolioApi
