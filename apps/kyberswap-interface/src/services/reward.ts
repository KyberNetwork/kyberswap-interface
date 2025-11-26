import { ChainId } from '@kyberswap/ks-sdk-core'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

interface BatchClaimEncodeParams {
  chainId: ChainId
  owner: string
  recipient: string
}

interface ClaimEncodeParams {
  chainId: ChainId
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
  vestingUSDValue: string
  waitingUSDValue: string

  claimedAmounts: { [tokenAddress: string]: string }
  merkleAmounts: { [tokenAddress: string]: string }
  pendingAmounts: { [tokenAddress: string]: string }
  vestingAmounts: { [tokenAddress: string]: string }
  waitingAmounts: { [tokenAddress: string]: string }
  claimableAmounts: { [tokenAddress: string]: string }

  claimableUSDValues: { [tokenAddress: string]: string }
}

interface ClaimResponse {
  calldata: string
  contractAddress: string
}

export enum RewardType {
  EG = 'EG',
  LM = 'LM',
}

export interface RewardData {
  [chainId: string]: {
    campaigns: {
      [campaignId: string]: {
        type: RewardType
        tokens: Array<TokenReward>
      }
    }
  }
}

const rewardServiceApi = createApi({
  reducerPath: 'rewardServiceApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_REWARD_SERVICE_API,
  }),
  keepUnusedDataFor: 1,
  endpoints: builder => ({
    batchClaimEncodeData: builder.mutation<ClaimResponse, BatchClaimEncodeParams>({
      query: params => ({
        url: `/kem/batch-claim/erc721`,
        params,
      }),
      transformResponse: (response: { data: ClaimResponse }) => response.data,
    }),
    claimEncodeData: builder.mutation<ClaimResponse, ClaimEncodeParams>({
      query: params => ({
        url: `/kem/claim/erc721`,
        params,
      }),
      transformResponse: (response: { data: ClaimResponse }) => response.data,
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
