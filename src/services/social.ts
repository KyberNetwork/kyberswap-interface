import { createApi } from '@reduxjs/toolkit/query/react'
import baseQueryOauth from 'services/baseQueryOauth'

import { BFF_API } from 'constants/env'

export enum SHARE_TYPE {
  KYBER_AI = 'KYBER_AI',
  MY_EARNINGS = 'MY_EARNINGS',
}

const SocialApi = createApi({
  reducerPath: 'socialApi',
  baseQuery: baseQueryOauth({ baseUrl: BFF_API }),
  endpoints: builder => ({
    uploadImage: builder.mutation({
      query: body => ({
        url: '/v1/buckets/signed-url-put',
        method: 'POST',
        body,
      }),
    }),
    createShareLink: builder.mutation<string, { metaImageUrl: string; redirectURL: string; type: SHARE_TYPE }>({
      query: body => ({
        url: '/v1/referral/shared-links',
        method: 'POST',
        body,
      }),
      transformResponse: (data: any) => data?.data?.link,
    }),
  }),
})

export const { useUploadImageMutation, useCreateShareLinkMutation } = SocialApi

export default SocialApi
