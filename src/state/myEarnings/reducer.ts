import { ChainId } from '@kyberswap/ks-sdk-core'
import { createReducer } from '@reduxjs/toolkit'

import { selectChains } from './actions'

export interface MyEarningsState {
  readonly selectedChains: ChainId[]
}

const initialState: MyEarningsState = {
  selectedChains: [ChainId.MAINNET],
}

export default createReducer(initialState, builder =>
  builder.addCase(selectChains, (state, action) => {
    const chains = action.payload
    state.selectedChains = chains
  }),
)
