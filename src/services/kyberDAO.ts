import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { KYBER_DAO_STATS_API } from 'constants/env'
import {
  DaoInfo,
  ProposalDetail,
  ProposalStatus,
  RewardStats,
  StakerAction,
  StakerInfo,
  VoteInfo,
} from 'hooks/kyberdao/types'

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
  gasRefundPercentage: string
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
    baseUrl: `${KYBER_DAO_STATS_API}`,
  }),
  endpoints: builder => ({
    getGasRefundRewardInfo: builder.query<RewardInfo, GasRefundRewardParams>({
      query: ({ account, rewardStatus }) => ({
        url: `/api/v1/stakers/${account}/refunds/total`,
        params: { rewardStatus },
      }),
      transformResponse: (response: GasRefundRewardResponse) => ({
        knc: parseFloat(response?.data?.total?.knc || '0'),
        usd: parseFloat(response?.data?.total?.usd || '0'),
      }),
    }),
    getGasRefundEligibleTxsInfo: builder.query<GasRefundEligibleTxsResponse, GasRefundEligibleTxsParams>({
      query: ({ account, pageSize, page }) => ({
        url: `/api/v1/stakers/${account}/refunds/eligible-transactions`,
        params: { pageSize, page },
      }),
    }),
    getGasRefundTierInfo: builder.query<GasRefundTierInfo, string>({
      query: (account: string) => ({
        url: `/api/v1/stakers/${account}/refund-info`,
      }),
      transformResponse: (response: GasRefundTierInfoResponse): GasRefundTierInfo => ({
        userTier: response?.data?.refundInfo?.userTier || 0,
        gasRefundPercentage: response?.data?.refundInfo?.gasRefundPercentage || 0,
      }),
    }),
    getGasRefundNextCycleInfo: builder.query<GasRefundNextCycleInfoResponse, void>({
      query: () => ({
        url: '/api/v1/gas-refund/program/next-cycle-info',
      }),
    }),
    getGasRefundProgramInfo: builder.query<GasRefundProgramInfoResponse, void>({
      query: () => ({
        url: '/api/v1/gas-refund/program/info',
      }),
    }),
    getRewardStats: builder.query<RewardStats, unknown>({
      query: () => ({
        url: `/api/v1/reward-stats`,
      }),
      transformResponse: (res: CommonRes<{ rewardStats: RewardStats }>) => res.data.rewardStats,
    }),
    getUserRewards: builder.query<any, { url: string; account?: string }>({
      query: ({ url }) => ({
        url,
      }),
      transformResponse: (res: any, _meta, { account }) => {
        if (account) {
          res.userReward = res.userRewards[account]
        }
        delete res.userRewards
        return res
      },
    }),
    getDaoInfo: builder.query<DaoInfo, unknown>({
      query: () => ({
        url: '/dao-info',
      }),
      transformResponse: (res: CommonRes<DaoInfo>) => res.data,
    }),
    getProposals: builder.query<ProposalDetail[], unknown>({
      query: () => ({
        url: '/proposals',
      }),
      transformResponse: (res: CommonRes<ProposalDetail[]>) =>
        res.data.map(proposal => {
          let status = proposal.status
          if (['Succeeded', 'Queued', 'Finalized'].includes(proposal.status)) status = ProposalStatus.Approved
          if (['Expired'].includes(proposal.status)) status = ProposalStatus.Failed
          return { ...proposal, status }
        }),
    }),
    getProposalById: builder.query<ProposalDetail, { id?: number }>({
      query: ({ id }) => ({
        url: `/proposals/${id}`,
      }),
      transformResponse: (res: CommonRes<ProposalDetail>) => res.data,
    }),
    getStakerInfo: builder.query<StakerInfo, { account?: string; epoch?: number }>({
      query: ({ account, epoch }) => ({
        url: `/stakers/${account}`,
        params: { epoch },
      }),
      transformResponse: (res: CommonRes<StakerInfo>) => res.data,
    }),
    getStakerVotes: builder.query<VoteInfo[], { account?: string }>({
      query: ({ account }) => ({
        url: `/stakers/${account}/votes`,
      }),
      transformResponse: (res: CommonRes<VoteInfo[]>) => res.data,
    }),
    getStakerActions: builder.query<StakerAction[], { account?: string }>({
      query: ({ account }) => ({
        url: `/stakers/${account}/actions`,
      }),
      transformResponse: (res: CommonRes<StakerAction[]>) => res.data,
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
