import { ChainId } from '@kyberswap/ks-sdk-core'
import { createReducer } from '@reduxjs/toolkit'

import { SUPPORTED_NETWORKS_FOR_MY_EARNINGS } from 'constants/networks'
import { VERSION } from 'constants/v2'

import {
  collapseAllPools,
  expandAllPools,
  selectChains,
  setActiveTab,
  setAttemptingTxn,
  setCollectFeeError,
  setSearchText,
  setShowPendingModal,
  setTxnHash,
  showEarningView,
  toggleShowClosedPositions,
} from './actions'

export interface MyEarningsState {
  readonly selectedChains: ChainId[]
  readonly shouldShowClosedPositions: boolean
  readonly shouldShowEarningView: number
  readonly searchText: string
  readonly shouldExpandAllPools: boolean
  readonly activeTab: VERSION | undefined

  readonly txnHash: string
  readonly attemptingTxn: boolean
  readonly showPendingModal: boolean
  readonly collectFeeError: string
}

const initialState: MyEarningsState = {
  selectedChains: SUPPORTED_NETWORKS_FOR_MY_EARNINGS,
  shouldShowClosedPositions: false,
  shouldExpandAllPools: false,
  shouldShowEarningView: 0,
  searchText: '',
  activeTab: undefined,

  txnHash: '',
  attemptingTxn: false,
  showPendingModal: false,
  collectFeeError: '',
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
    .addCase(showEarningView, state => {
      state.shouldShowEarningView += 1
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
    })
    .addCase(setCollectFeeError, (state, action) => {
      state.collectFeeError = action.payload
    })
    .addCase(setAttemptingTxn, (state, action) => {
      state.attemptingTxn = action.payload
    })
    .addCase(setTxnHash, (state, action) => {
      state.txnHash = action.payload
    })
    .addCase(setShowPendingModal, (state, action) => {
      state.showPendingModal = action.payload
    }),
)
