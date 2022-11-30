import { Currency } from '@kyberswap/ks-sdk-core'
import { createReducer } from '@reduxjs/toolkit'

import { setLimitCurrency } from './actions'

export interface LimitState {
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
}

const initialState: LimitState = {
  currencyIn: undefined,
  currencyOut: undefined,
}

export default createReducer<LimitState>(initialState, builder =>
  builder.addCase(setLimitCurrency, (state, { payload: { currencyIn, currencyOut } }) => {
    state.currencyIn = currencyIn
    state.currencyOut = currencyOut
  }),
)
