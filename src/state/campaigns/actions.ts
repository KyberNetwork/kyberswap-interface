import { createAction } from '@reduxjs/toolkit'
import { SerializedToken } from 'state/user/actions'

export type CampaignStatus = 'Upcoming' | 'Ongoing' | 'Ended'

export enum RewardState {
  RewardStateReady,
  RewardStateRewarded,
}

export type RewardSingle = {
  type: 'Single'
  rank?: number
  amount?: number
  token?: string
}

export type RewardRange = {
  type: 'Range'
  from?: number
  to?: number
  amount?: number
  token?: string
}

export type RewardRandom = {
  type: 'Random'
  from?: number
  to?: number
  nWinners?: number
  amount?: number
  token?: string
}

export type RewardDistribution = RewardSingle | RewardRange | RewardRandom

export interface CampaignData {
  id: number
  name: string
  startTime: number
  endTime: number
  desktopBanner: string
  mobileBanner: string
  status: CampaignStatus
  rules: string
  termsAndConditions: string
  otherDetails: string
  rewardDetails: string
  isRewardShown: boolean
  enterNowUrl: string
  rewardDistribution: RewardDistribution[]
  rewardState: RewardState
  chainIds: string
  rewardChainIds: string
}

export const setCampaignData = createAction<{ campaigns: CampaignData[] }>('campaigns/setCampaignData')
export const setLoading = createAction<boolean>('campaigns/setLoading')
export const setSelectedCampaign = createAction<{ campaign: CampaignData }>('campaigns/setSelectedCampaign')
