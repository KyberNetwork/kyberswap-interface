import { createReducer } from '@reduxjs/toolkit'

import { CampaignData, CampaignStatus, setCampaignData, setLoading, setSelectedCampaign } from './actions'

export interface CampaignsState {
  readonly data: CampaignData[]
  readonly selectedCampaign: CampaignData | undefined
  readonly loading: boolean
}

const initialState: CampaignsState = {
  data: [],
  selectedCampaign: undefined,
  loading: false,
}

export default createReducer<CampaignsState>(initialState, builder =>
  builder
    .addCase(setCampaignData, (state, { payload: { campaigns } }) => {
      return {
        ...state,
        data: campaigns,
      }
    })
    .addCase(setLoading, (state, { payload: loading }) => {
      return {
        ...state,
        loading,
      }
    })
    .addCase(setSelectedCampaign, (state, { payload: { campaign } }) => {
      return { ...state, selectedCampaign: campaign }
    }),
)
