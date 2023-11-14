import { ZERO } from '@kyberswap/ks-sdk-classic'
import { Fraction } from '@kyberswap/ks-sdk-core'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { parseUnits } from 'ethers/lib/utils'
import JSBI from 'jsbi'

import { CAMPAIGN_BASE_URL } from 'constants/env'
import { RESERVE_USD_DECIMALS } from 'constants/index'
import {
  CampaignData,
  CampaignLeaderboard,
  CampaignLeaderboardRanking,
  CampaignLeaderboardReward,
  CampaignLuckyWinner,
  CampaignProofData,
  CampaignStatus,
  RewardDistribution,
} from 'state/campaigns/actions'
import { SerializedToken } from 'state/user/actions'

const getCampaignStatus = ({ endTime, startTime }: CampaignData) => {
  const now = Date.now()
  return endTime <= now ? CampaignStatus.ENDED : startTime >= now ? CampaignStatus.UPCOMING : CampaignStatus.ONGOING
}

const formatRewards = (rewards: CampaignLeaderboardReward[]) =>
  rewards?.map(
    (item: any): CampaignLeaderboardReward => ({
      rewardAmount: new Fraction(
        item.RewardAmount,
        JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(item?.Token?.decimals ?? 18)),
      ),
      ref: item.Ref,
      claimed: item.Claimed,
      token: item.Token,
    }),
  ) || []

const formatListCampaign = (data: CampaignData[]) => {
  if (!data) return []
  const response = Array.isArray(data) ? data : [data]
  const campaigns: CampaignData[] = response.map((item: CampaignData) => ({
    ...item,
    startTime: item.startTime * 1000,
    endTime: item.endTime * 1000,
  }))
  const formattedCampaigns: CampaignData[] = campaigns.map((campaign: any) => {
    const rewardDistribution: RewardDistribution[] = []
    if (campaign.rewardDistribution.single) {
      campaign.rewardDistribution.single.forEach(
        ({
          amount,
          rank,
          token,
          rewardInUSD,
        }: {
          amount: string
          rank: number
          token: SerializedToken
          rewardInUSD: boolean
        }) => {
          rewardDistribution.push({
            type: 'Single',
            amount,
            rank,
            token,
            rewardInUSD,
          })
        },
      )
    }
    if (campaign.rewardDistribution.range) {
      campaign.rewardDistribution.range.forEach(
        ({
          from,
          to,
          amount,
          token,
          rewardInUSD,
        }: {
          from: number
          to: number
          amount: string
          token: SerializedToken
          rewardInUSD: boolean
        }) => {
          rewardDistribution.push({
            type: 'Range',
            from,
            to,
            amount,
            token,
            rewardInUSD,
          })
        },
      )
    }
    if (campaign.rewardDistribution.random) {
      campaign.rewardDistribution.random.forEach(
        ({
          from,
          to,
          amount,
          numberOfWinners,
          token,
          rewardInUSD,
        }: {
          from: number
          to: number
          amount: string
          numberOfWinners: number
          token: SerializedToken
          rewardInUSD: boolean
        }) => {
          rewardDistribution.push({
            type: 'Random',
            from,
            to,
            amount,
            nWinners: numberOfWinners,
            token,
            rewardInUSD,
          })
        },
      )
    }
    if (campaign?.userInfo?.tradingVolume) campaign.userInfo.tradingVolume = Number(campaign.userInfo.tradingVolume)
    if (campaign.userInfo) campaign.userInfo.rewards = formatRewards(campaign.userInfo.rewards)
    return {
      ...campaign,
      rewardDistribution,
      status: getCampaignStatus(campaign),
      eligibleTokens: campaign.eligibleTokens.map(
        ({ chainId, name, symbol, address, logoURI, decimals }: SerializedToken) => {
          return {
            chainId,
            name,
            symbol,
            address,
            logoURI,
            decimals,
          }
        },
      ),
    }
  })
  return formattedCampaigns
}

const formatLeaderboardData = (data: CampaignLeaderboard) => {
  const leaderboard: CampaignLeaderboard = {
    ...data,
    rankings: data.rankings
      ? data.rankings.map(
          (item: any): CampaignLeaderboardRanking => ({
            userAddress: item.userAddress,
            totalPoint: item.totalPoint,
            rankNo: item.rankNo,
            rewardAmount: new Fraction(
              item.rewardAmount || ZERO,
              JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(item?.token?.decimals ?? 18)),
            ),
            rewardAmountUsd: new Fraction(
              parseUnits(item?.rewardAmountUSD?.toString() || '0', RESERVE_USD_DECIMALS).toString(),
              JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(RESERVE_USD_DECIMALS)),
            ),
            rewardInUSD: item.rewardInUSD,
            token: item.token,
          }),
        )
      : [],
    rewards: formatRewards(data.rewards),
  }
  return leaderboard
}

const formatLuckyWinners = (data: any[]) => {
  const luckyWinners: CampaignLuckyWinner[] = data.map(
    (item: any): CampaignLuckyWinner => ({
      userAddress: item.userAddress,
      rewardAmount: new Fraction(
        item.rewardAmount,
        JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(item?.token?.decimals ?? 18)),
      ),
      token: item.token,
    }),
  )
  return luckyWinners
}

const formatTxs = (data: any[]) => {
  return data.map(
    (item: any): CampaignProofData => ({
      id: item.id,
      chainId: parseInt(item.chainId),
      utcTimestamp: new Date(item.time).getTime(),
      txPoint: item.txPoint,
      txHash: item.tx,
    }),
  )
}

const campaignApi = createApi({
  reducerPath: 'campaignApi',
  baseQuery: fetchBaseQuery({ baseUrl: `${CAMPAIGN_BASE_URL}/api/v1/campaigns` }),
  endpoints: builder => ({
    getCampaigns: builder.query<any, { campaignName: string; userAddress?: string; offset: number; limit: number }>({
      query: params => ({
        params,
        url: '',
      }),
      transformResponse: (data: any) => formatListCampaign(data?.data || []),
    }),
    getCampaignById: builder.query<any, string>({
      query: campaignId => ({
        url: `/${campaignId}`,
      }),
      transformResponse: (data: any) => formatListCampaign(data?.data)?.[0],
    }),
    getLeaderboard: builder.query<
      any,
      { pageSize: number; pageNumber: number; userAddress: string; lookupAddress: string; campaignId: number }
    >({
      query: ({ campaignId, ...params }) => ({
        params,
        url: `/${campaignId}/leaderboard`,
      }),
      transformResponse: (data: any) => formatLeaderboardData(data?.data),
    }),
    getLuckyWinners: builder.query<
      CampaignLuckyWinner[],
      { pageSize: number; pageNumber: number; lookupAddress: string; campaignId: number }
    >({
      query: ({ campaignId, ...params }) => ({
        params,
        url: `/${campaignId}/lucky-winners`,
      }),
      transformResponse: (data: any) => formatLuckyWinners(data?.data || []),
    }),
    getTxsCampaign: builder.query<
      CampaignProofData[],
      { limit: number; offset: number; userAddress: string; campaignId: number }
    >({
      query: ({ campaignId, ...params }) => ({
        params,
        url: `/${campaignId}/proofs`,
      }),
      transformResponse: (data: any) => formatTxs(data?.data || []),
    }),
    joinCampaign: builder.mutation<any, { token: string | null; address: string; recaptchaId: number }>({
      query: ({ recaptchaId, ...body }) => ({
        body,
        method: 'POST',
        url: `/${recaptchaId}/participants`,
      }),
    }),
  }),
})

export const {
  useGetCampaignsQuery,
  useGetLeaderboardQuery,
  useGetLuckyWinnersQuery,
  useJoinCampaignMutation,
  useGetTxsCampaignQuery,
  useLazyGetCampaignByIdQuery,
} = campaignApi

export default campaignApi
