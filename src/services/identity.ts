import { createApi } from '@reduxjs/toolkit/query/react'
import baseQueryOauth from 'services/baseQueryOauth'

import { BFF_API } from 'constants/env'
import { RTK_QUERY_TAGS } from 'constants/index'

import { GetRouteResponse } from './route/types/getRoute'

const identityApi = createApi({
  reducerPath: 'identityApi',
  tagTypes: [RTK_QUERY_TAGS.GET_PROFILE],
  baseQuery: baseQueryOauth({ baseUrl: BFF_API }),
  endpoints: builder => ({
    getOrCreateProfile: builder.query<GetRouteResponse, { referralProgramId: number }>({
      // todo move to another file
      query: params => ({
        url: '/v1/referral/participants',
        params,
        authentication: true, // todo
      }),
      providesTags: [RTK_QUERY_TAGS.GET_PROFILE],
    }),
    connectWalletToProfile: builder.mutation<GetRouteResponse, { referralProgramId: number }>({
      query: params => ({
        url: '/v1/referral/participants',
        params,
        authentication: true, // todo
      }),
      invalidatesTags: [RTK_QUERY_TAGS.GET_PROFILE],
    }),
    sendOtp: builder.mutation<GetRouteResponse, any>({
      query: params => ({
        url: '/v1/referral/participants',
        params,
        authentication: true, // todo
      }),
    }),
    verifyOtp: builder.mutation<GetRouteResponse, any>({
      query: params => ({
        url: '/v1/referral/participants',
        params,
        authentication: true, // todo
      }),
    }),
  }),
})

export const {
  useConnectWalletToProfileMutation,
  useGetOrCreateProfileQuery,
  useSendOtpMutation,
  useVerifyOtpMutation,
} = identityApi

export default identityApi
