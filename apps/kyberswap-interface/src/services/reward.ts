import { ChainId } from '@kyberswap/ks-sdk-core'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

interface BatchClaimEncodeParams {
  chainId: ChainId
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

interface RewardInfoParams {
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

export interface TokenRewardExtended extends TokenReward {
  campaignId: string
}

interface RewardData {
  [chainId: string]: {
    campaigns: {
      [campaignId: string]: {
        tokens: Array<TokenReward>
      }
    }
  }
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
    rewardInfo: builder.query<RewardData, RewardInfoParams>({
      query: params => ({
        url: `/kem/owner/claim-status`,
        params,
      }),
      transformResponse: (response: {
        data: {
          chains: RewardData
        }
      }) => response.data.chains,
    }),
  }),
})

export const { useRewardInfoQuery, useBatchClaimEncodeDataMutation, useClaimEncodeDataMutation } = rewardServiceApi

export default rewardServiceApi
