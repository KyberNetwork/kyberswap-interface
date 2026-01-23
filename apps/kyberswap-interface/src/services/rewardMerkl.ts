import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

interface MerklRewardBreakdown {
  root: string
  distributionChainId: number
  reason: string
  amount: string
  claimed: string
  pending: string
  campaignId: string
}

interface MerklRewardToken {
  address: string
  chainId: number
  symbol: string
  decimals: number
  price: number
}

interface MerklRewardItem {
  distributionChainId: number
  root: string
  recipient: string
  amount: string
  claimed: string
  pending: string
  proofs: string[]
  token: MerklRewardToken
  breakdowns: MerklRewardBreakdown[]
}

interface MerklChainExplorer {
  chainId: number
  id: string
  type: string
  url: string
}

interface MerklChainInfo {
  Explorer: MerklChainExplorer[]
  endOfDisputePeriod: number
  icon: string
  id: number
  liveCampaigns: number
  name: string
}

interface MerklRewardsResponse {
  chain: MerklChainInfo
  rewards: MerklRewardItem[]
}

interface MerklRewardsParams {
  address: string
  chainId: string
}

const rewardMerklApi = createApi({
  reducerPath: 'rewardMerklApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://api.merkl.xyz/v4',
  }),
  keepUnusedDataFor: 1,
  endpoints: builder => ({
    merklRewards: builder.query<MerklRewardsResponse[], MerklRewardsParams>({
      query: ({ address, chainId }) => ({
        url: `/users/${address}/rewards`,
        params: { chainId },
      }),
    }),
  }),
})

export const { useMerklRewardsQuery } = rewardMerklApi

export default rewardMerklApi
