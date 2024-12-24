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
  setTrendingSoonShowed,
  switchCurrencies,
  switchCurrenciesV2,
  typeInput,
} from './actions'

export interface SwapState {
  readonly independentField: Field // TODO: remove since unused anymore
  readonly typedValue: string
  // readonly [Field.INPUT]: {
  //   readonly currencyId: string | undefined
  // }
  // readonly [Field.OUTPUT]: {
  //   readonly currencyId: string | undefined
  // }
  // the typed recipient address or ENS name, or null if swap should go to sender
  readonly recipient: string | null
  readonly trendingSoonShowed?: boolean
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

// const { search, pathname } = window.location
// const { inputCurrency = '', outputCurrency = '' } = pathname.startsWith(APP_PATHS.SWAP)
//   ? queryStringToObject(search)
//   : {}

const initialState: SwapState = {
  independentField: Field.INPUT,
  permitData: {},
  typedValue: '1',
  // [Field.INPUT]: {
  //   currencyId: inputCurrency?.toString() || '',
  // },
  // [Field.OUTPUT]: {
  //   currencyId: outputCurrency?.toString() || '',
  // },
  recipient: null,
  // Flag to only show animation of trending soon banner 1 time
  trendingSoonShowed: false,
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
        // [Field.INPUT]: {
        //   currencyId: inputCurrencyId,
        // },
        // [Field.OUTPUT]: {
        //   currencyId: outputCurrencyId,
        // },
        independentField: field,
        typedValue: typedValue || state.typedValue || '1',
        recipient,
      }
    })
    // .addCase(selectCurrency, (state, { payload: { currencyId, field } }) => {
    //   const otherField = field === Field.INPUT ? Field.OUTPUT : Field.INPUT
    //   if (currencyId === state[otherField].currencyId) {
    //     // the case where we have to swap the order
    //     return {
    //       ...state,
    //       isSelectTokenManually: true,
    //       independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
    //       [field]: { currencyId },
    //       [otherField]: { currencyId: state[field].currencyId },
    //     }
    //   } else {
    //     // the normal case
    //     return {
    //       ...state,
    //       isSelectTokenManually: true,
    //       [field]: { currencyId },
    //     }
    //   }
    // })
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
        // [Field.INPUT]: { currencyId: state[Field.OUTPUT].currencyId },
        // [Field.OUTPUT]: { currencyId: state[Field.INPUT].currencyId },
      }
    })
    .addCase(switchCurrenciesV2, state => {
      return {
        ...state,
        independentField: Field.INPUT,
        isSelectTokenManually: true,
        // [Field.INPUT]: { currencyId: state[Field.OUTPUT].currencyId },
        // [Field.OUTPUT]: { currencyId: state[Field.INPUT].currencyId },
      }
    })
    .addCase(typeInput, (state, { payload: { field, typedValue } }) => {
      state.independentField = field
      state.typedValue = typedValue
    })
    .addCase(setRecipient, (state, { payload: { recipient } }) => {
      state.recipient = recipient
    })
    .addCase(setTrendingSoonShowed, state => {
      state.trendingSoonShowed = true
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
