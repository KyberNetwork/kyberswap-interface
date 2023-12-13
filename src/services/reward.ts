import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { REWARD_SERVICE_API } from 'constants/env'
import { RTK_QUERY_TAGS } from 'constants/index'

export type AirdropData = {
  totalRewards: string
  details: {
    aggregator: {
      level: number
      Rewards: number
    }
    kyberAI: {
      level: number
      Rewards: number
    }
    limitOrder: {
      level: number
      Rewards: number
    }
    liquidity: {
      level: number
      Rewards: number
    }
  }
}
const rewardApi = createApi({
  reducerPath: 'rewardApi',
  baseQuery: fetchBaseQuery({ baseUrl: `${REWARD_SERVICE_API}` }),
  tagTypes: [RTK_QUERY_TAGS.GET_AIRDROP_INFO],
  endpoints: builder => ({
    checkAirdrop: builder.query<AirdropData, { address: string }>({
      query: params => ({
        params,
        url: '/airdrop/6th-anniversary',
      }),
      transformResponse: (data: any) => data?.data,
      providesTags: [RTK_QUERY_TAGS.GET_AIRDROP_INFO],
    }),
    claimReward: builder.mutation<void, { wallet: string; chainId: string; clientCode: string; ref: string }>({
      query: params => ({
        params,
        url: '/rewards/claim',
        method: 'POST',
      }),
      invalidatesTags: [RTK_QUERY_TAGS.GET_AIRDROP_INFO],
    }),
  }),
})

export const { useCheckAirdropQuery, useClaimRewardMutation } = rewardApi

export default rewardApi
