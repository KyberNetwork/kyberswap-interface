import { createReducer } from '@reduxjs/toolkit'

import { Aggregator } from 'utils/aggregator'

import {
  Field,
  permitError,
  permitUpdate,
  replaceSwapState,
  resetSelectCurrency,
  revokePermit,
  setRecipient,
  setTrade,
  switchCurrencies,
  switchCurrenciesV2,
  typeInput,
} from './actions'

export interface SwapState {
  readonly independentField: Field // TODO: remove since unused anymore
  readonly typedValue: string
  readonly recipient: string | null
  readonly trade?: Aggregator

  readonly showConfirm: boolean
  readonly tradeToConfirm: Aggregator | undefined
  readonly attemptingTxn: boolean
  readonly swapErrorMessage: string | undefined
  readonly txHash: string | undefined

  readonly isSelectTokenManually: boolean

  permitData?: {
    [account: string]: {
      [chainId: number]: {
        [address: string]: {
          rawSignature?: string
          deadline?: number
          value?: string
          errorCount?: number
        } | null
      }
    }
  }
}

const initialState: SwapState = {
  independentField: Field.INPUT,
  permitData: {},
  typedValue: '1',
  recipient: null,
  trade: undefined,

  showConfirm: false,
  tradeToConfirm: undefined,
  attemptingTxn: false,
  swapErrorMessage: undefined,
  txHash: undefined,

  isSelectTokenManually: false,
}

export default createReducer<SwapState>(initialState, builder =>
  builder
    .addCase(replaceSwapState, (state, { payload: { typedValue, recipient, field } }) => {
      return {
        ...state,
        independentField: field,
        typedValue: typedValue || state.typedValue || '1',
        recipient,
      }
    })
    .addCase(resetSelectCurrency, (state, { payload: { field } }) => {
      return {
        ...state,
        [field]: { currencyId: '' },
      }
    })
    .addCase(switchCurrencies, state => {
      return {
        ...state,
        isSelectTokenManually: true,
        independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
      }
    })
    .addCase(switchCurrenciesV2, state => {
      return {
        ...state,
        independentField: Field.INPUT,
        isSelectTokenManually: true,
      }
    })
    .addCase(typeInput, (state, { payload: { field, typedValue } }) => {
      state.independentField = field
      state.typedValue = typedValue
    })
    .addCase(setRecipient, (state, { payload: { recipient } }) => {
      state.recipient = recipient
    })
    .addCase(setTrade, (state, { payload: { trade } }) => {
      state.trade = trade
    })
    .addCase(permitUpdate, (state, { payload: { chainId, address, rawSignature, deadline, value, account } }) => {
      if (!state.permitData) state.permitData = {}
      if (!state.permitData[account]) state.permitData[account] = {}
      if (!state.permitData[account][chainId]) state.permitData[account][chainId] = {}

      state.permitData[account][chainId][address] = {
        rawSignature,
        deadline,
        value,
        errorCount: state.permitData[account][chainId][address]?.errorCount || 0,
      }
    })
    .addCase(revokePermit, (state, { payload: { chainId, address, account } }) => {
      if (
        !state.permitData ||
        !state.permitData[account] ||
        !state.permitData[account][chainId] ||
        !state.permitData[account][chainId][address]
      )
        return

      state.permitData[account][chainId][address] = null
    })
    .addCase(permitError, (state, { payload: { chainId, address, account } }) => {
      if (!state.permitData?.[account]?.[chainId]?.[address]) return
      const { errorCount } = state.permitData[account][chainId][address] || {}
      state.permitData[account][chainId][address] = {
        rawSignature: undefined,
        deadline: undefined,
        value: undefined,
        errorCount: (errorCount || 0) + 1,
      }
    }),
)
