import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import useSWR from 'swr'
import axios from 'axios'
import {
  CampaignData,
  CampaignLeaderboard,
  RewardDistribution,
  setCampaignData,
  setLoadingCampaignData,
  setLoadingSelectedCampaignLeaderboard,
  setSelectedCampaign,
  setSelectedCampaignLeaderboard,
} from 'state/campaigns/actions'
import { AppState } from 'state/index'
import { useActiveWeb3React } from 'hooks'
import { SWR_KEYS } from 'constants/index'

const MAXIMUM_ITEMS_PER_REQUEST = 10000

export default function CampaignsUpdater(): null {
  const dispatch = useDispatch()
  const { account } = useActiveWeb3React()

  const { data: campaignData, isValidating: isLoadingData } = useSWR<CampaignData[]>(
    SWR_KEYS.getListCampaign,
    async (url: string) => {
      const response = await axios({
        method: 'GET',
        url,
        params: {
          limit: MAXIMUM_ITEMS_PER_REQUEST,
          offset: 0,
        },
      })
      const now = Date.now()
      const campaigns: [] = response.data.data
        .map((item: any) => ({ ...item, startTime: item.startTime * 1000, endTime: item.endTime * 1000 }))
        .sort((a: any, b: any) => {
          const a_status = a.endTime <= now ? 'Ended' : a.startTime >= now ? 'Upcoming' : 'Ongoing'
          const b_status = b.endTime <= now ? 'Ended' : b.startTime >= now ? 'Upcoming' : 'Ongoing'
          const STATUS_PRIORITY = ['Ongoing', 'Upcoming', 'Ended']
          const a_status_index = STATUS_PRIORITY.indexOf(a_status)
          const b_status_index = STATUS_PRIORITY.indexOf(b_status)
          if (a_status_index !== b_status_index) return a_status_index - b_status_index
          if (a.startTime !== b.startTime) return b.startTime - a.startTime
          return b.endTime - a.endTime
        })
      const formattedCampaigns: CampaignData[] = campaigns.map((campaign: any) => {
        const rewardDistribution: RewardDistribution[] = []
        if (campaign.rewardDistribution.single) {
          campaign.rewardDistribution.single.forEach(
            ({ amount, rank, token }: { amount: number; rank: number; token: string }) => {
              rewardDistribution.push({
                type: 'Single',
                amount,
                rank,
                token,
              })
            },
          )
        }
        if (campaign.rewardDistribution.range) {
          campaign.rewardDistribution.range.forEach(
            ({ from, to, amount, token }: { from: number; to: number; amount: number; token: string }) => {
              rewardDistribution.push({
                type: 'Range',
                from,
                to,
                amount,
                token,
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
            }: {
              from: number
              to: number
              amount: number
              numberOfWinners: number
              token: string
            }) => {
              rewardDistribution.push({
                type: 'Random',
                from,
                to,
                amount,
                nWinners: numberOfWinners,
                token,
              })
            },
          )
        }
        const startTime = campaign.startTime
        const endTime = campaign.endTime
        return {
          id: campaign.id,
          name: campaign.name,
          startTime,
          endTime,
          desktopBanner: campaign.desktopBanner,
          mobileBanner: campaign.mobileBanner,
          status: endTime <= now ? 'Ended' : startTime >= now ? 'Upcoming' : 'Ongoing',
          rules: campaign.rules,
          termsAndConditions: campaign.termsAndConditions,
          otherDetails: campaign.otherDetails,
          rewardDetails: campaign.rewardDetails,
          isRewardShown: campaign.isRewardShown,
          enterNowUrl: campaign.enterNowUrl,
          rewardDistribution,
          rewardState: campaign.rewardState,
          chainIds: campaign.chainIds,
          rewardChainIds: campaign.rewardChainIds,
        }
      })
      return formattedCampaigns
    },
  )

  useEffect(() => {
    dispatch(setCampaignData({ campaigns: campaignData ?? [] }))
    if (campaignData && campaignData.length) {
      dispatch(setSelectedCampaign({ campaign: campaignData[0] }))
    }
  }, [campaignData])

  useEffect(() => {
    dispatch(setLoadingCampaignData(isLoadingData))
  }, [isLoadingData])

  const selectedCampaign = useSelector((state: AppState) => state.campaigns.selectedCampaign)
  const { data: leaderboard, isValidating: isLoadingLeaderboard } = useSWR(
    selectedCampaign ? SWR_KEYS.getLeaderboard(selectedCampaign.id) : null,
    async () => {
      if (selectedCampaign === undefined) return

      const response = await axios({
        method: 'GET',
        url: SWR_KEYS.getLeaderboard(selectedCampaign.id),
        params: {
          pageSize: MAXIMUM_ITEMS_PER_REQUEST,
          pageNumber: 0,
          userAddress: account ?? '',
        },
      })
      const data = response.data.data
      const leaderboard: CampaignLeaderboard = {
        numberOfParticipants: data.NoOfParticipants,
        userRank: data.UserRank,
        ranking: data.Rankings.map((item: any) => ({
          address: item.UserAddress,
          point: item.Point,
          rank: item.Rank,
          rewardAmount: 123456789, // TODO: mapping variables.........
          token: 'KNC', // TODO: mapping variables.........
        })),
      }
      return leaderboard
    },
    {
      refreshInterval: undefined,
    },
  )

  useEffect(() => {
    if (leaderboard) {
      dispatch(setSelectedCampaignLeaderboard({ leaderboard }))
    }
  }, [leaderboard])

  useEffect(() => {
    dispatch(setLoadingSelectedCampaignLeaderboard(isLoadingLeaderboard))
  }, [isLoadingLeaderboard])

  return null
}
