import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { KYBER_DAO_STATS_API } from 'constants/env'

type GasRefundTierInfoResponse = {
  data: {
    refundInfo: GasRefundTierInfo
  }
}

export interface GasRefundTierInfo {
  userTier: number
  gasRefundPercentage: number
}

type GasRefundNextCycleInfoResponse = {
  data: {
    startEpoch: number
    startTime: number
  }
}

type GasRefundProgramInfoResponse = {
  data: {
    status: 'running' | 'finished'
  }
}

type GasRefundRewardResponse = {
  data: {
    total: {
      knc: string
      usd: string
    }
  }
}

interface TransactionInfo {
  tx: string
  timestamp: number
  gasRefundInKNC: string
  gasRefundInUSD: string
  gasFeeInUSD: string
  gasFeeInNativeToken: string
  epoch: number
  userTier: number
  gasRefundPerCentage: string
  userWallet: string
}

export type GasRefundEligibleTxsResponse = {
  data: {
    transactions: TransactionInfo[]
    pagination: {
      totalOfPages: number
      currentPage: number
      pageSize: number
      hasMore: boolean
    }
  }
}

export interface RewardInfo {
  knc: number
  usd: number
}

export interface GasRefundEligibleTxsParams {
  account: string
  pageSize: number
  page: number
}

export type GasRefundRewardParams = {
  account: string
  rewardStatus: 'claimable' | 'pending' | 'claimed'
}

const kyberDAOApi = createApi({
  reducerPath: 'kyberDAO',
  baseQuery: fetchBaseQuery({
    baseUrl: `${KYBER_DAO_STATS_API}/api/v1`,
  }),
  endpoints: builder => ({
    getGasRefundRewardInfo: builder.query<RewardInfo, GasRefundRewardParams>({
      query: ({ account, rewardStatus }) => ({
        url: `/stakers/${account}/refunds/total`,
        params: { rewardStatus },
      }),
      transformResponse: (response: GasRefundRewardResponse) => ({
        knc: parseFloat(response?.data?.total?.knc || '0'),
        usd: parseFloat(response?.data?.total?.usd || '0'),
      }),
    }),
    getGasRefundEligibleTxsInfo: builder.query<GasRefundEligibleTxsResponse, GasRefundEligibleTxsParams>({
      query: ({ account, pageSize, page }) => ({
        url: `/stakers/${account}/refunds/eligible-transactions`,
        params: { pageSize, page },
      }),
    }),
    getGasRefundTierInfo: builder.query<GasRefundTierInfo, string>({
      query: (account: string) => ({
        url: `/stakers/${account}/refund-info`,
      }),
      transformResponse: (response: GasRefundTierInfoResponse): GasRefundTierInfo => ({
        userTier: response?.data?.refundInfo?.userTier || 0,
        gasRefundPercentage: response?.data?.refundInfo?.gasRefundPercentage || 0,
      }),
    }),
    getGasRefundNextCycleInfo: builder.query<GasRefundNextCycleInfoResponse, void>({
      query: () => ({
        url: '/gas-refund/program/next-cycle-info',
      }),
    }),
    getGasRefundProgramInfo: builder.query<GasRefundProgramInfoResponse, void>({
      query: () => ({
        url: '/gas-refund/program/info',
      }),
    }),
  }),
})

export const {
  useGetGasRefundRewardInfoQuery,
  useGetGasRefundEligibleTxsInfoQuery,
  useGetGasRefundTierInfoQuery,
  useGetGasRefundNextCycleInfoQuery,
  useGetGasRefundProgramInfoQuery,
} = kyberDAOApi

export default kyberDAOApi
