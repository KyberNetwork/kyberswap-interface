import { createApi } from '@reduxjs/toolkit/dist/query/react'
import baseQueryOauth from 'services/baseQueryOauth'

import { BFF_API, KYBER_AI_REFERRAL_ID } from 'constants/env'
import { RTK_QUERY_TAGS } from 'constants/index'

import { ParticipantInfo } from '../pages/TrueSightV2/types'

const kyberAIApi = createApi({
  reducerPath: 'kyberAIApiV2',
  tagTypes: [RTK_QUERY_TAGS.GET_PARTICIPANT_INFO_KYBER_AI],
  baseQuery: baseQueryOauth({
    baseUrl: BFF_API,
  }),
  endpoints: builder => ({
    getParticipantInfo: builder.query<ParticipantInfo, void>({
      query: () => ({
        url: '/v1/referral/participants',
        params: { referralProgramId: KYBER_AI_REFERRAL_ID },
      }),
      providesTags: [RTK_QUERY_TAGS.GET_PARTICIPANT_INFO_KYBER_AI],
      transformResponse: (data: any) => data?.data?.participant,
    }),
    requestWhiteList: builder.mutation<any, { referredByCode: string }>({
      query: body => ({
        url: '/v1/referral/participants',
        method: 'POST',
        body: { ...body, referralProgramId: Number(KYBER_AI_REFERRAL_ID) },
      }),
      invalidatesTags: [RTK_QUERY_TAGS.GET_PARTICIPANT_INFO_KYBER_AI],
    }),
  }),
})

export const { useGetParticipantInfoQuery, useRequestWhiteListMutation } = kyberAIApi
export default kyberAIApi
