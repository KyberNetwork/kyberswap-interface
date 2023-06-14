import { ChainId } from '@kyberswap/ks-sdk-core'
import { createReducer } from '@reduxjs/toolkit'

import { SUPPORTED_NETWORKS_FOR_MY_EARNINGS } from 'constants/networks'
import { VERSION } from 'constants/v2'

import {
  collapseAllPools,
  expandAllPools,
  selectChains,
  setActiveTab,
  setSearchText,
  toggleShowClosedPositions,
} from './actions'

export interface MyEarningsState {
  readonly selectedChains: ChainId[]
  readonly shouldShowClosedPositions: boolean
  readonly searchText: string
  readonly shouldExpandAllPools: boolean
  readonly activeTab: VERSION | undefined
}

const initialState: MyEarningsState = {
  selectedChains: SUPPORTED_NETWORKS_FOR_MY_EARNINGS,
  shouldShowClosedPositions: false,
  shouldExpandAllPools: false,
  searchText: '',
  activeTab: undefined,
}

export default createReducer(initialState, builder =>
  builder
    .addCase(selectChains, (state, action) => {
      const chains = action.payload
      state.selectedChains = chains
    })
    .addCase(toggleShowClosedPositions, state => {
      state.shouldShowClosedPositions = !state.shouldShowClosedPositions
    })
    .addCase(setSearchText, (state, action) => {
      state.searchText = action.payload
    })
    .addCase(expandAllPools, state => {
      state.shouldExpandAllPools = true
    })
    .addCase(collapseAllPools, state => {
      state.shouldExpandAllPools = false
    })
    .addCase(setActiveTab, (state, action) => {
      state.activeTab = action.payload
    }),
)
