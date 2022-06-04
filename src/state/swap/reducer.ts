import { createReducer } from '@reduxjs/toolkit'
import { FeeConfig } from 'hooks/useSwapV2Callback'
import {
  chooseToSaveGas,
  Field,
  replaceSwapState,
  selectCurrency,
  setRecipient,
  switchCurrencies,
  switchCurrenciesV2,
  typeInput,
  setFeeConfig,
} from './actions'

export interface SwapState {
  readonly independentField: Field
  readonly typedValue: string
  readonly [Field.INPUT]: {
    readonly currencyId: string | undefined
  }
  readonly [Field.OUTPUT]: {
    readonly currencyId: string | undefined
  }
  // the typed recipient address or ENS name, or null if swap should go to sender
  readonly recipient: string | null
  readonly saveGas: boolean
  readonly feeConfig: FeeConfig | undefined
}

const initialState: SwapState = {
  independentField: Field.INPUT,
  typedValue: '',
  [Field.INPUT]: {
    currencyId: '',
  },
  [Field.OUTPUT]: {
    currencyId: '',
  },
  recipient: null,
  saveGas: false,
  feeConfig:
    // window.prompt('<<Type 1 or 0>> Use feeConfig? (default: 0)') === '1'
    //   ? {
    //       chargeFeeBy:
    //         window.prompt('<<Type currency_in or currency_out>> chargeFeeBy (default: currency_in)') === 'currency_out'
    //           ? 'currency_out'
    //           : 'currency_in',
    //       feeAmount: window.prompt('<<Integer from 1 to 10000>> feeAmount (default: 10)') || '10',
    //       isInBps: window.prompt('<<Type true or false>> isInBps (default: true)') !== 'false',
    //       feeReceiver:
    //         window.prompt('<<Type address>> feeReceiver (default: 0xDa0D8fF1bE1F78c5d349722A5800622EA31CD5dd)') ||
    //         '0xDa0D8fF1bE1F78c5d349722A5800622EA31CD5dd',
    //     }
    // :
    undefined,
}

export default createReducer<SwapState>(initialState, builder =>
  builder
    .addCase(
      replaceSwapState,
      (state, { payload: { typedValue, recipient, field, inputCurrencyId, outputCurrencyId, feeConfig } }) => {
        return {
          [Field.INPUT]: {
            currencyId: inputCurrencyId,
          },
          [Field.OUTPUT]: {
            currencyId: outputCurrencyId,
          },
          independentField: field,
          typedValue: typedValue,
          recipient,
          saveGas: state.saveGas,
          feeConfig,
        }
      },
    )
    .addCase(selectCurrency, (state, { payload: { currencyId, field } }) => {
      const otherField = field === Field.INPUT ? Field.OUTPUT : Field.INPUT
      if (currencyId === state[otherField].currencyId) {
        // the case where we have to swap the order
        return {
          ...state,
          typedValue: '',
          independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
          [field]: { currencyId: currencyId },
          [otherField]: { currencyId: state[field].currencyId },
        }
      } else {
        // the normal case
        return {
          ...state,
          [field]: { currencyId: currencyId },
        }
      }
    })
    .addCase(switchCurrencies, state => {
      return {
        ...state,
        independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
        [Field.INPUT]: { currencyId: state[Field.OUTPUT].currencyId },
        [Field.OUTPUT]: { currencyId: state[Field.INPUT].currencyId },
      }
    })
    .addCase(switchCurrenciesV2, state => {
      return {
        ...state,
        // independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
        independentField: Field.INPUT,
        // typedValue: '',
        [Field.INPUT]: { currencyId: state[Field.OUTPUT].currencyId },
        [Field.OUTPUT]: { currencyId: state[Field.INPUT].currencyId },
      }
    })
    .addCase(typeInput, (state, { payload: { field, typedValue } }) => {
      return {
        ...state,
        independentField: field,
        typedValue,
      }
    })
    .addCase(setRecipient, (state, { payload: { recipient } }) => {
      state.recipient = recipient
    })
    .addCase(chooseToSaveGas, (state, { payload: { saveGas } }) => {
      state.saveGas = saveGas
    })
    .addCase(setFeeConfig, (state, { payload: { feeConfig } }) => {
      state.feeConfig = feeConfig
    }),
)
