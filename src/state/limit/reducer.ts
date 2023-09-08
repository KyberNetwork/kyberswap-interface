import { Currency } from '@kyberswap/ks-sdk-core'
import { createReducer } from '@reduxjs/toolkit'

import { CreateOrderParam } from 'components/swapv2/LimitOrder/type'

import {
  pushOrderNeedCreated,
  removeOrderNeedCreated,
  setInputAmount,
  setLimitCurrency,
  setOrderEditing,
} from './actions'

export interface LimitState {
  inputAmount: string
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  ordersUpdating: CreateOrderParam[]
  orderEditing: CreateOrderParam | undefined
}

const initialState: LimitState = {
  inputAmount: '',
  currencyIn: undefined,
  currencyOut: undefined,
  ordersUpdating: [], // orders need to be created when cancel is completed
  orderEditing: undefined, // order is editing
}

export default createReducer<LimitState>(initialState, builder =>
  builder
    .addCase(setInputAmount, (state, { payload: inputAmount }) => {
      state.inputAmount = inputAmount
    })
    .addCase(setLimitCurrency, (state, { payload: { currencyIn, currencyOut } }) => {
      state.currencyIn = currencyIn
      state.currencyOut = currencyOut
    })
    .addCase(pushOrderNeedCreated, (state, { payload }) => {
      state.ordersUpdating = [...state.ordersUpdating, payload]
    })
    .addCase(removeOrderNeedCreated, (state, { payload: orderId }) => {
      state.ordersUpdating = state.ordersUpdating.filter(e => e.orderId !== orderId)
    })
    .addCase(setOrderEditing, (state, { payload: orderEditing }) => {
      state.orderEditing = orderEditing
    }),
)
