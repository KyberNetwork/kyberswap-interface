import { ChainId } from '@kyberswap/ks-sdk-core'
import { createReducer } from '@reduxjs/toolkit'

import { selectChains, selectTimePeriod } from './actions'

export const timePeriods = ['1D', '7D', '1M', '6M', '1Y'] as const
export type TimePeriod = typeof timePeriods[number]

export interface MyEarningsState {
  readonly selectedChains: ChainId[]
  readonly selectedTimePeriod: TimePeriod
}

const initialState: MyEarningsState = {
  selectedChains: [ChainId.MAINNET],
  selectedTimePeriod: '7D',
}

export default createReducer(initialState, builder =>
  builder
    .addCase(selectChains, (state, action) => {
      const chains = action.payload
      state.selectedChains = chains
    })
    .addCase(selectTimePeriod, (state, action) => {
      const timePeriod = action.payload
      state.selectedTimePeriod = timePeriod
    }),
)
