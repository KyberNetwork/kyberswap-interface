import { ChainId } from '@kyberswap/ks-sdk-core'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

interface BatchClaimEncodeParams {
  chainId: ChainId
  campaignId: string
  owner: string
  recipient: string
}

interface ClaimEncodeParams {
  chainId: ChainId
  campaignId: string
  erc721Addr: string
  erc721Id: string
  recipient: string
}

interface RewardCampaignParams {
  chainId: ChainId
}

interface RewardInfoParams {
  chainId: ChainId
  campaignId: string
  owner: string
}

interface TokenReward {
  erc721Address: string
  erc721TokenId: string

  totalUSDValue: string
  pendingUSDValue: string
  claimedUSDValue: string
  claimableUSDValue: string

  claimedAmounts: { [tokenAddress: string]: string }
  merkleAmounts: { [tokenAddress: string]: string }
  pendingAmounts: { [tokenAddress: string]: string }
  claimableUSDValues: { [tokenAddress: string]: string }
}

const rewardServiceApi = createApi({
  reducerPath: 'rewardServiceApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_REWARD_API,
  }),
  keepUnusedDataFor: 1,
  endpoints: builder => ({
    batchClaimEncodeData: builder.mutation<string, BatchClaimEncodeParams>({
      query: params => ({
        url: `/kem/batch-claim/owner`,
        params,
      }),
      transformResponse: (response: { data: string }) => response.data,
    }),
    claimEncodeData: builder.mutation<string, ClaimEncodeParams>({
      query: params => ({
        url: `/kem/claim/erc721`,
        params,
      }),
      transformResponse: (response: { data: string }) => response.data,
    }),
    rewardCampaign: builder.query<string | null, RewardCampaignParams>({
      query: params => ({
        url: `/kem/campaigns`,
        params,
      }),
      transformResponse: (response: {
        data: Array<{
          campaignId: string
        }>
      }) => (response.data.length > 0 ? response.data[0].campaignId : null),
    }),
    rewardInfo: builder.query<Array<TokenReward>, RewardInfoParams>({
      query: params => ({
        url: `/kem/owner/claim-status`,
        params,
      }),
      transformResponse: (response: {
        data: {
          tokens: Array<TokenReward>
        }
      }) => response.data.tokens,
    }),
  }),
})

export const {
  useRewardCampaignQuery,
  useRewardInfoQuery,
  useBatchClaimEncodeDataMutation,
  useClaimEncodeDataMutation,
} = rewardServiceApi

export default rewardServiceApi
