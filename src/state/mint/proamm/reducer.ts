import { createReducer } from '@reduxjs/toolkit'

import {
  addPosition,
  removePosition,
  resetMintState,
  setRange,
  typeInput,
  typeLeftRangeInput,
  typeRightRangeInput,
  typeStartPriceInput,
} from './actions'
import { Field, FullRange } from './type'

interface MintState {
  readonly startPriceTypedValue: string // for the case when there's no liquidity
  readonly positions: {
    readonly independentField: Field
    readonly typedValue: string
    readonly leftRangeTypedValue: string | FullRange
    readonly rightRangeTypedValue: string | FullRange
  }[]
  readonly positionCount: number
}

const initialState: MintState = {
  startPriceTypedValue: '',
  positions: [
    {
      independentField: Field.CURRENCY_A,
      typedValue: '',
      leftRangeTypedValue: '',
      rightRangeTypedValue: '',
    },
  ],
  positionCount: 1,
}

export default createReducer<MintState>(initialState, builder =>
  builder
    .addCase(resetMintState, () => initialState)
    .addCase(setRange, (state, { payload: { leftRangeTypedValue, rightRangeTypedValue, positionIndex } }) => {
      state.positions[positionIndex].leftRangeTypedValue = leftRangeTypedValue
      state.positions[positionIndex].rightRangeTypedValue = rightRangeTypedValue
      return state
    })
    .addCase(typeStartPriceInput, (state, { payload: { typedValue } }) => {
      return {
        ...state,
        startPriceTypedValue: typedValue,
      }
    })
    .addCase(typeLeftRangeInput, (state, { payload: { typedValue, positionIndex } }) => {
      state.positions[positionIndex].leftRangeTypedValue = typedValue
      return state
    })
    .addCase(typeRightRangeInput, (state, { payload: { typedValue, positionIndex } }) => {
      state.positions[positionIndex].rightRangeTypedValue = typedValue
      return state
    })
    .addCase(typeInput, (state, { payload: { field, typedValue, noLiquidity, positionIndex } }) => {
      if (noLiquidity) {
        // they're typing into the field they've last typed in
        if (field === state.positions[positionIndex].independentField) {
          state.positions[positionIndex].independentField = field
          state.positions[positionIndex].typedValue = typedValue
          return state
        }
        // they're typing into a new field, store the other value
        else {
          state.positions[positionIndex].independentField = field
          state.positions[positionIndex].typedValue = typedValue
          return state
        }
      } else {
        state.positions[positionIndex].independentField = field
        state.positions[positionIndex].typedValue = typedValue
        return state
      }
    })

    .addCase(addPosition, state => {
      state.positions[state.positionCount] = {
        independentField: Field.CURRENCY_A,
        typedValue: '',
        leftRangeTypedValue: '',
        rightRangeTypedValue: '',
      }
      state.positionCount++
      return state
    })
    .addCase(removePosition, (state, { payload: { positionIndex } }) => {
      state.positions.splice(positionIndex, 1)
      state.positionCount--
      return state
    }),
)
