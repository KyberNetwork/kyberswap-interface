import { createReducer } from '@reduxjs/toolkit'

import {
  DustInput,
  DustToken,
  addInputToken,
  removeInputToken,
  replaceInputs,
  resetState,
  setInputAmount,
  setOutputToken,
  setRecipient,
  setSlippage,
} from './actions'

export interface DustLiquidationState {
  readonly inputs: DustInput[]
  readonly outputToken: DustToken | null
  // Slippage in bips. 100 = 1%. Default a bit higher than swap because dust = many small swaps.
  readonly slippage: number
  readonly recipient: string | null
}

const initialState: DustLiquidationState = {
  inputs: [],
  outputToken: null,
  slippage: 100,
  recipient: null,
}

const eq = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

export default createReducer<DustLiquidationState>(initialState, builder =>
  builder
    .addCase(addInputToken, (state, { payload: { token } }) => {
      if (state.inputs.some(i => eq(i.address, token.address))) return
      state.inputs.push({ ...token, amount: '' })
    })
    .addCase(removeInputToken, (state, { payload: { address } }) => {
      state.inputs = state.inputs.filter(i => !eq(i.address, address))
    })
    .addCase(setInputAmount, (state, { payload: { address, amount } }) => {
      const target = state.inputs.find(i => eq(i.address, address))
      if (target) target.amount = amount
    })
    .addCase(replaceInputs, (state, { payload: { inputs } }) => {
      state.inputs = inputs
    })
    .addCase(setOutputToken, (state, { payload: { token } }) => {
      state.outputToken = token
    })
    .addCase(setSlippage, (state, { payload: { slippage } }) => {
      state.slippage = slippage
    })
    .addCase(setRecipient, (state, { payload: { recipient } }) => {
      state.recipient = recipient
    })
    .addCase(resetState, () => initialState),
)
