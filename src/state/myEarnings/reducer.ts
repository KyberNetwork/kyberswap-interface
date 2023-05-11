import { ChainId } from '@kyberswap/ks-sdk-core'
import { createReducer } from '@reduxjs/toolkit'

import { selectChains, setSearchText, toggleShowClosedPositions } from './actions'

export interface MyEarningsState {
  readonly selectedChains: ChainId[]
  readonly shouldShowClosedPositions: boolean
  readonly searchText: string
}

const initialState: MyEarningsState = {
  selectedChains: [ChainId.MAINNET],
  shouldShowClosedPositions: false,
  searchText: '',
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
    }),
)
