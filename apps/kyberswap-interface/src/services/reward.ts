import { ChainId } from '@kyberswap/ks-sdk-core'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

interface BatchClaimEncodeParams {
  chainId: ChainId
  owner: string
  recipient: string
  tokenIds?: Array<string | number>
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

export interface ClaimTransaction {
  contractAddress: string
  // The distributor this claim is sent to. A `deprecated` contract no longer accrues new rewards
  // but stays claimable while a user still has an unclaimed balance on it.
  distributorStatus?: 'active' | 'deprecated'
  calldata: string
  rewardTokens?: Array<string>
  rewardAmounts?: Array<string>
}

interface ClaimResponse {
  // `calldata` and `contractAddress` mirror exactly one entry of `transactions` (the active
  // distributor's), never an aggregate of all of them. Rewards may be spread across several
  // distributor contracts, and a claim is bound to `msg.sender` on-chain, so they cannot be
  // collapsed into one call — read `transactions` and submit one tx per entry.
  calldata: string
  contractAddress: string
  transactions?: Array<ClaimTransaction>
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
      query: params => {
        const searchParams = new URLSearchParams()
        searchParams.set('chainId', params.chainId.toString())
        searchParams.set('owner', params.owner)
        searchParams.set('recipient', params.recipient)
        params.tokenIds?.forEach(tokenId => searchParams.append('tokenIds', tokenId.toString()))

        return {
          url: `/kem/batch-claim/erc721?${searchParams.toString()}`,
        }
      },
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
