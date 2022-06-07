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

const CAMPAIGN_BASE_URL = `${process.env.REACT_APP_CAMPAIGN_BASE_URL}/api/v1/campaigns/`
const MAXIMUM_ITEMS_PER_REQUEST = 10000
const LEADERBOARD_REFRESH_INTERVAL = 5000

export default function CampaignsUpdater(): null {
  const dispatch = useDispatch()

  const { data: campaignData, isValidating: isLoadingData } = useSWR<CampaignData[]>(
    CAMPAIGN_BASE_URL,
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
    selectedCampaign ? CAMPAIGN_BASE_URL + selectedCampaign.id + '/leaderboard' : null,
    async () => {
      if (selectedCampaign === undefined) return

      const response = await axios({
        method: 'GET',
        url: CAMPAIGN_BASE_URL + selectedCampaign.id + '/leaderboard',
        params: {
          limit: MAXIMUM_ITEMS_PER_REQUEST,
          offset: 0,
        },
      })
      const data = response.data.data
      const leaderboard: CampaignLeaderboard = {
        numberOfParticipants: data.NoOfParticipants,
        ranking: data.Rankings.map((item: any) => ({
          address: item.UserAddress, // TODO: mapping variables.........
          point: item.Point, // TODO: mapping variables.........
          rank: item.Rank, // TODO: mapping variables.........
          rewardAmount: 123456789, // TODO: mapping variables.........
          token: 'KNC', // TODO: mapping variables.........
        })),
      }
      return leaderboard
    },
    {
      refreshInterval: LEADERBOARD_REFRESH_INTERVAL,
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
