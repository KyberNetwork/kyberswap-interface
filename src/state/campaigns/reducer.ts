import { createReducer } from '@reduxjs/toolkit'

import {
  CampaignData,
  CampaignLeaderboard,
  setCampaignData,
  setCampaignDataByPage,
  setClaimingCampaignRewardId,
  setLastTimeRefreshData,
  setLoadingCampaignData,
  setLoadingCampaignDataError,
  setLoadingSelectedCampaignLeaderboard,
  setRecaptchaCampaignId,
  setRecaptchaCampaignLoading,
  setSelectedCampaign,
  setSelectedCampaignLeaderboard,
  setSelectedCampaignLeaderboardLookupAddress,
  setSelectedCampaignLeaderboardPageNumber,
} from './actions'

interface CampaignsState {
  readonly data: CampaignData[]
  readonly loadingCampaignData: boolean
  readonly loadingCampaignDataError: boolean

  readonly selectedCampaign: CampaignData | undefined

  readonly selectedCampaignLeaderboard: CampaignLeaderboard | undefined
  readonly selectedCampaignLeaderboardPageNumber: number
  readonly selectedCampaignLeaderboardLookupAddress: string

  readonly claimingCampaignRewardId: number | null // id that is being claimed

  readonly recaptchaCampaign: {
    id: number | undefined
    loading: boolean
  }

  readonly lastTimeRefreshData: number
}

const initialState: CampaignsState = {
  data: [],
  loadingCampaignData: true,
  loadingCampaignDataError: false,

  selectedCampaign: undefined,

  selectedCampaignLeaderboard: undefined,
  selectedCampaignLeaderboardPageNumber: 0,
  selectedCampaignLeaderboardLookupAddress: '',

  claimingCampaignRewardId: null,

  recaptchaCampaign: {
    id: undefined,
    loading: false,
  },

  lastTimeRefreshData: Date.now(),
}

export default createReducer<CampaignsState>(initialState, builder =>
  builder
    .addCase(setCampaignData, (state, { payload: { campaigns } }) => {
      return {
        ...state,
        data: campaigns,
      }
    })
    .addCase(setCampaignDataByPage, (state, { payload: { campaigns, isReset } }) => {
      return {
        ...state,
        data: isReset ? campaigns : state.data.concat(campaigns),
      }
    })
    .addCase(setLoadingCampaignData, (state, { payload: loading }) => {
      return {
        ...state,
        loadingCampaignData: loading,
      }
    })
    .addCase(setClaimingCampaignRewardId, (state, { payload: claimingCampaignRewardId }) => {
      return {
        ...state,
        claimingCampaignRewardId,
      }
    })
    .addCase(setLoadingCampaignDataError, (state, { payload: error }) => {
      return {
        ...state,
        loadingCampaignDataError: error,
      }
    })
    .addCase(setSelectedCampaign, (state, { payload: { campaign } }) => {
      return { ...state, selectedCampaign: campaign }
    })
    .addCase(setSelectedCampaignLeaderboard, (state, { payload: { leaderboard } }) => {
      return {
        ...state,
        selectedCampaignLeaderboard: leaderboard,
      }
    })
    .addCase(setLoadingSelectedCampaignLeaderboard, (state, { payload: loading }) => {
      return {
        ...state,
        loadingCampaignLeaderboard: loading,
      }
    })
    .addCase(setSelectedCampaignLeaderboardPageNumber, (state, { payload: pageNumber }) => {
      return {
        ...state,
        selectedCampaignLeaderboardPageNumber: pageNumber,
      }
    })
    .addCase(setSelectedCampaignLeaderboardLookupAddress, (state, { payload: lookupAddress }) => {
      return {
        ...state,
        selectedCampaignLeaderboardLookupAddress: lookupAddress,
      }
    })

    .addCase(setRecaptchaCampaignId, (state, { payload: id }) => {
      return {
        ...state,
        recaptchaCampaign: {
          ...state.recaptchaCampaign,
          id,
        },
      }
    })
    .addCase(setRecaptchaCampaignLoading, (state, { payload: loading }) => {
      return {
        ...state,
        recaptchaCampaign: {
          ...state.recaptchaCampaign,
          loading,
        },
      }
    })
    .addCase(setLastTimeRefreshData, state => {
      return {
        ...state,
        lastTimeRefreshData: Date.now(),
      }
    }),
)
