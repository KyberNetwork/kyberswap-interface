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

export interface MerklRewardsResponse {
  chain: MerklChainInfo
  rewards: MerklRewardItem[]
}

interface MerklRewardsParams {
  address: string
  chainId: string
}

const MERKL_API_BASE = 'https://api.merkl.xyz/v4'

const rewardMerklApi = createApi({
  reducerPath: 'rewardMerklApi',
  baseQuery: fetchBaseQuery({
    baseUrl: MERKL_API_BASE,
  }),
  keepUnusedDataFor: 1,
  endpoints: builder => ({
    merklRewards: builder.query<MerklRewardsResponse[], MerklRewardsParams>({
      async queryFn({ address, chainId }) {
        const chainIds = chainId
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)

        if (!chainIds.length) {
          return { data: [] }
        }

        // Fetch each chain individually to avoid a single unsupported chain failing the entire request
        const results = await Promise.all(
          chainIds.map(async cId => {
            try {
              const res = await fetch(`${MERKL_API_BASE}/users/${address}/rewards?chainId=${cId}`)
              if (!res.ok) return null
              const data: MerklRewardsResponse[] = await res.json()
              return data
            } catch {
              return null
            }
          }),
        )

        const merged = results.filter(Boolean).flat() as MerklRewardsResponse[]
        return { data: merged }
      },
    }),
  }),
})

export const { useMerklRewardsQuery, useLazyMerklRewardsQuery } = rewardMerklApi

export default rewardMerklApi
