import { createApi } from '@reduxjs/toolkit/query/react'
import axios from 'axios'
import baseQueryOauth from 'services/baseQueryOauth'

import { BFF_API, BUCKET_NAME } from 'constants/env'

interface ApiResponse<T> {
  data: T
}

export interface TipLinkThumbnailSignedUrlRequest {
  fileName: string
}

export interface TipLinkThumbnailSignedUrl {
  signedURL: string
  fileName: string
}

export interface CreateTipLinkRequest {
  code?: string
  chainId: string
  inputCurrency: string
  outputCurrency: string
  tipReceiver: string
  thumbnailURL?: string
  backgroundColor?: string
  creatorName?: string
}

export interface TipLink extends CreateTipLinkRequest {
  id: string
  code: string
  createdAt: number
}

export const buildTipLinkThumbnailURL = (fileName: string) =>
  `https://storage.googleapis.com/${BUCKET_NAME}/${fileName}`

export const uploadTipLinkThumbnailToSignedURL = (signedURL: string, file: File | Blob) =>
  axios({
    url: signedURL,
    method: 'PUT',
    data: file,
    headers: {
      'Content-Type': file.type,
    },
  })

const tipLinkApi = createApi({
  reducerPath: 'tipLinkApi',
  baseQuery: baseQueryOauth({ baseUrl: BFF_API }),
  endpoints: builder => ({
    getTipLinkThumbnailSignedUrl: builder.mutation<TipLinkThumbnailSignedUrl, TipLinkThumbnailSignedUrlRequest>({
      query: body => ({
        url: '/v1/tip-links/thumbnails/signed-url-put',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<TipLinkThumbnailSignedUrl>) => response.data,
    }),
    createTipLink: builder.mutation<TipLink, CreateTipLinkRequest>({
      query: body => ({
        url: '/v1/tip-links',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<TipLink>) => response.data,
    }),
    getTipLink: builder.query<TipLink, string>({
      query: idOrCode => ({
        url: `/v1/tip-links/${encodeURIComponent(idOrCode)}`,
      }),
      transformResponse: (response: ApiResponse<TipLink>) => response.data,
    }),
  }),
})

export const {
  useCreateTipLinkMutation,
  useGetTipLinkQuery,
  useGetTipLinkThumbnailSignedUrlMutation,
  useLazyGetTipLinkQuery,
} = tipLinkApi

export default tipLinkApi
