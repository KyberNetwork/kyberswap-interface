import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { REWARD_SERVICE_API } from 'constants/env'

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
  endpoints: builder => ({
    checkAirdrop: builder.query<AirdropData, { address: string }>({
      query: params => ({
        params,
        url: '/airdrop/6th-anniversary',
      }),
      transformResponse: (data: any) => data?.data,
    }),
  }),
})

export const { useCheckAirdropQuery } = rewardApi

export default rewardApi
