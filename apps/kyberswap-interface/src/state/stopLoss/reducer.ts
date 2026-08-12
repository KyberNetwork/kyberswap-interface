import { type PayloadAction, createSlice } from '@reduxjs/toolkit'

import { DEFAULT_STOP_LOSS_SLIPPAGE, STOP_LOSS_DEFAULT_EXPIRE } from 'components/StopLoss/constants'

/**
 * The stop-loss card's own inputs. The pair and the sell amount are not here — those live in the swap
 * state, which is what carries them between Swap, Limit and Stop Loss.
 *
 * Held in the store rather than the form because the card unmounts on every product switch: the
 * right-panel tabs move between `/limit` and `/stop-loss`, so a component-local draft is destroyed by
 * something the UI presents as a tab. It is also how Recreate hands a past order back to the form.
 */
export type StopLossFormState = {
  triggerPrice: string
  /** Basis points. */
  slippage: number
  /** Seconds from now, used whenever `customDateExpire` is unset. */
  expire: number
  /** Unix ms. A timestamp rather than a Date so the store stays serialisable. */
  customDateExpire: number | undefined
}

export const DEFAULT_STOP_LOSS_FORM_STATE: StopLossFormState = {
  triggerPrice: '',
  slippage: DEFAULT_STOP_LOSS_SLIPPAGE,
  expire: STOP_LOSS_DEFAULT_EXPIRE,
  customDateExpire: undefined,
}

const stopLossSlice = createSlice({
  name: 'stopLoss',
  initialState: DEFAULT_STOP_LOSS_FORM_STATE,
  reducers: {
    updateStopLossForm: (state, { payload }: PayloadAction<Partial<StopLossFormState>>) => ({ ...state, ...payload }),
    resetStopLossForm: () => DEFAULT_STOP_LOSS_FORM_STATE,
  },
})

export const { updateStopLossForm, resetStopLossForm } = stopLossSlice.actions

export default stopLossSlice.reducer
