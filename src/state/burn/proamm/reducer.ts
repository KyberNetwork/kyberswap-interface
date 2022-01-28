import { createReducer } from '@reduxjs/toolkit'

import { selectPercent } from './actions'

interface BurnProAmmState {
  readonly percent: number
}

const initialState: BurnProAmmState = {
  percent: 0
}

export default createReducer<BurnProAmmState>(initialState, builder =>
  builder.addCase(selectPercent, (state, { payload: { percent } }) => {
    return {
      ...state,
      percent
    }
  })
)
