import { createApi } from '@reduxjs/toolkit/query/react'
import baseQueryOauth from 'services/baseQueryOauth'

import { BFF_API } from 'constants/env'

export enum SHARE_TYPE {
  MY_EARNINGS = 'MY_EARNINGS',
}

const SocialApi = createApi({
  reducerPath: 'socialApi',
  baseQuery: baseQueryOauth({ baseUrl: BFF_API }),
  endpoints: builder => ({
    uploadImage: builder.mutation({
      query: body => ({
        url: '/v1/ks-setting/buckets/signed-url-put',
        method: 'POST',
        body,
      }),
    }),
    createShareLink: builder.mutation<string, { metaImageURL?: string; redirectURL: string; type: SHARE_TYPE }>({
      query: body => ({
        url: '/v1/referral/shared-links',
        method: 'POST',
        body,
      }),
      transformResponse: (data: any) => data?.data?.link,
    }),
    patchShareLink: builder.mutation<{ metaImageURL: string }, { metaImageURL: string; id: string }>({
      query: ({ metaImageURL, id }) => ({
        url: `/v1/referral/shared-links/${id}`,
        method: 'PATCH',
        body: { metaImageURL: metaImageURL },
      }),
    }),
  }),
})

export const { useUploadImageMutation, useCreateShareLinkMutation, usePatchShareLinkMutation } = SocialApi

export default SocialApi
