import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

interface CycleConfigParams {
  poolAddress: string
}

interface CycleConfigResponse {
  poolAddress: string
  rewardCfg: Array<{
    tokenAddress: string
    amountReward: number
    weightFee: number
    weightAt: number
    weightAtFee3: number
    weightAt3Fee: number
    weightFeeEg: number
  }>
  startTime: number
  endTime: number
  egSharingPercentage: number
}

const kyberdataServiceApi = createApi({
  reducerPath: 'kyberdataServiceApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_KYBERDATA_API,
  }),
  keepUnusedDataFor: 1,
  endpoints: builder => ({
    cycleConfig: builder.query<CycleConfigResponse, CycleConfigParams>({
      query: params => ({
        url: `/reward-config/${params.poolAddress}`,
      }),
    }),
  }),
})

export const { useCycleConfigQuery } = kyberdataServiceApi

export default kyberdataServiceApi
