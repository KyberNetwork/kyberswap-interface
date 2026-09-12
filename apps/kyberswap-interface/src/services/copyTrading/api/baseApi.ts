import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const copyTradingBaseApi = createApi({
  reducerPath: 'copyTradingApi',
  tagTypes: ['CopyTrading'],
  refetchOnMountOrArgChange: true,
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_COPY_TRADING_API_URL,
    prepareHeaders: headers => {
      headers.set('Accept', 'application/json')
      return headers
    },
  }),
  endpoints: () => ({}),
})

export default copyTradingBaseApi
