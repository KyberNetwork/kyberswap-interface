import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import useSWR from 'swr'
import axios from 'axios'
import {
  CampaignData,
  RewardDistribution,
  setCampaignData,
  setLoading,
  setSelectedCampaign,
} from 'state/campaigns/actions'
import { AppState } from 'state/index'

const url = `${process.env.REACT_APP_CAMPAIGN_BASE_URL}/api/v1/campaigns/`
const MAXIMUM_ITEMS_PER_REQUEST = 10000

export default function CampaignsUpdater(): null {
  const dispatch = useDispatch()

  const { data, isValidating } = useSWR<CampaignData[]>(url, async (url: string) => {
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
        // const a_startTime = formatSingaporeToDate(new Date(a.startTime)).getTime()
        // const a_endTime = formatSingaporeToDate(new Date(a.endTime)).getTime()
        // const b_startTime = formatSingaporeToDate(new Date(b.startTime)).getTime()
        // const b_endTime = formatSingaporeToDate(new Date(b.endTime)).getTime()
        const a_startTime = a.startTime
        const a_endTime = a.endTime
        const b_startTime = b.startTime
        const b_endTime = b.endTime
        const a_status = a_endTime <= now ? 'Ended' : a_startTime >= now ? 'Upcoming' : 'Ongoing'
        const b_status = b_endTime <= now ? 'Ended' : b_startTime >= now ? 'Upcoming' : 'Ongoing'
        const STATUS_PRIORITY = ['Ongoing', 'Upcoming', 'Ended']
        const a_status_index = STATUS_PRIORITY.indexOf(a_status)
        const b_status_index = STATUS_PRIORITY.indexOf(b_status)
        if (a_status_index !== b_status_index) return a_status_index - b_status_index
        if (a_startTime !== b_startTime) return b_startTime - a_startTime
        return b_endTime - a_endTime
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
      // const startTime = formatSingaporeToDate(new Date(campaigns.startTime)).getTime()
      // const endTime = formatSingaporeToDate(new Date(campaigns.endTime)).getTime()
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
  })

  useEffect(() => {
    dispatch(setCampaignData({ campaigns: data ?? [] }))
    if (data && data.length) {
      dispatch(setSelectedCampaign({ campaign: data[0] }))
    }
  }, [data])

  useEffect(() => {
    dispatch(setLoading(isValidating))
  }, [isValidating])

  return null
}
