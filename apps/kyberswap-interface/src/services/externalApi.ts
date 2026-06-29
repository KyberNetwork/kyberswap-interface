import { ChainId } from '@kyberswap/ks-sdk-core'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const CLAIM_REWARDS_DATA_URL: Partial<Record<ChainId, string>> = {
  [ChainId.AVAXMAINNET]:
    'https://raw.githubusercontent.com/KyberNetwork/avax-trading-contest-reward-distribution/develop/results/reward_proof.json',
  [ChainId.MATIC]:
    'https://raw.githubusercontent.com/KyberNetwork/zkyber-reward-distribution/main/results/latest_merkle_data.json',
}

export type ClaimReward = {
  index: number
  amounts: string[]
  proof: string[]
}

export type ClaimRewardPhaseData = {
  phaseId: number
  merkleRoot: string
  tokens: string[]
  userRewards: { [address: string]: ClaimReward }
}

const externalApi = createApi({
  reducerPath: 'externalApi',
  baseQuery: fetchBaseQuery({ baseUrl: '' }),
  endpoints: builder => ({
    getClaimRewards: builder.query<ClaimRewardPhaseData[], ChainId>({
      queryFn: async (chainId, _api, _extraOptions, fetchWithBaseQuery) => {
        const url = CLAIM_REWARDS_DATA_URL[chainId]
        if (!url) return { data: [] }

        const result = await fetchWithBaseQuery(url)
        if (result.error) return { error: result.error }

        return { data: result.data as ClaimRewardPhaseData[] }
      },
    }),
  }),
})

export default externalApi
