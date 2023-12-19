import { createReducer } from '@reduxjs/toolkit'

import { CreateOrderParam } from 'components/swapv2/LimitOrder/type'

import { pushOrderNeedCreated, removeOrderNeedCreated, setOrderEditing } from './actions'

export interface LimitState {
  ordersNeedCreated: CreateOrderParam[]
  orderEditing: CreateOrderParam | undefined
}

const initialState: LimitState = {
  ordersNeedCreated: [], // orders need to be created when cancel is completed
  orderEditing: undefined, // order is editing
}

export default createReducer<LimitState>(initialState, builder =>
  builder
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
