import { createReducer } from '@reduxjs/toolkit'

import { CreateOrderParam } from 'components/swapv2/LimitOrder/type'

import { pushOrderNeedCreated, removeOrderNeedCreated, setInputAmount, setOrderEditing } from './actions'

export interface LimitState {
  inputAmount: string
  ordersNeedCreated: CreateOrderParam[]
  orderEditing: CreateOrderParam | undefined
}

const initialState: LimitState = {
  inputAmount: '',
  ordersNeedCreated: [], // orders need to be created when cancel is completed
  orderEditing: undefined, // order is editing
}

export default createReducer<LimitState>(initialState, builder =>
  builder
    .addCase(setInputAmount, (state, { payload: inputAmount }) => {
      state.inputAmount = inputAmount
    })
    .addCase(pushOrderNeedCreated, (state, { payload }) => {
      state.ordersNeedCreated = [...state.ordersNeedCreated, payload]
    })
    .addCase(removeOrderNeedCreated, (state, { payload: orderId }) => {
      state.ordersNeedCreated = state.ordersNeedCreated.filter(e => e.orderId !== orderId)
    })
    .addCase(setOrderEditing, (state, { payload: orderEditing }) => {
      state.orderEditing = orderEditing
    }),
)
