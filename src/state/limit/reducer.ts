import { Currency } from '@kyberswap/ks-sdk-core'
import { createReducer } from '@reduxjs/toolkit'

import { CreateOrderParam } from 'components/swapv2/LimitOrder/type'

import { removeCurrentOrderUpdate, setCurrentOrderUpdate, setLimitCurrency } from './actions'

export interface LimitState {
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  orderUpdating: CreateOrderParam[]
}

const initialState: LimitState = {
  currencyIn: undefined,
  currencyOut: undefined,
  orderUpdating: [],
}

export default createReducer<LimitState>(initialState, builder =>
  builder
    .addCase(setLimitCurrency, (state, { payload: { currencyIn, currencyOut } }) => {
      state.currencyIn = currencyIn
      state.currencyOut = currencyOut
    })
    .addCase(setCurrentOrderUpdate, (state, { payload }) => {
      state.orderUpdating = [...state.orderUpdating, payload]
    })
    .addCase(removeCurrentOrderUpdate, (state, { payload: orderId }) => {
      state.orderUpdating = state.orderUpdating.filter(e => e.orderId !== orderId)
    }),
)
