import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { COMMON_SERVICE_API } from 'constants/env'

type Banner = {
  id: number
  url: string
  ctaUrl: string
  isActive: boolean
}

type BannersResponse = {
  data: {
    banners: Banner[]
  }
}

const commonApi = createApi({
  reducerPath: 'commonApi',
  baseQuery: fetchBaseQuery({
    baseUrl: COMMON_SERVICE_API,
  }),
  endpoints: builder => ({
    getPromoteBanners: builder.query<Banner[], void>({
      query: () => ({
        url: '/v1/banners',
      }),
      transformResponse: (res: BannersResponse) => res.data.banners,
    }),
  }),
})

export const { useGetPromoteBannersQuery } = commonApi

export default commonApi
