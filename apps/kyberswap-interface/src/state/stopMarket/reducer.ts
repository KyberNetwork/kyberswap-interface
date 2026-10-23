import { type PayloadAction, createSlice } from '@reduxjs/toolkit'

import { STOP_MARKET_DEFAULT_EXPIRE } from 'components/StopMarket/constants'

/**
 * The stop market order card's own inputs. The pair and the sell amount are not here — those live in the swap
 * state, which is what carries them between Swap, Limit and Stop Market.
 *
 * Held in the store rather than the form because the card unmounts on every product switch: the
 * right-panel tabs move between `/limit` and `/stop-market`, so a component-local draft is destroyed by
 * something the UI presents as a tab. It is also how Recreate hands a past order back to the form.
 */
export type StopMarketFormState = {
  triggerPrice: string
  /**
   * The pair `triggerPrice` was set for (`getStopMarketPairKey`). The pair lives in the swap state and
   * changes through routes this card never sees — a network switch, a link from another page, a token
   * picked on Swap — so the form reads the trigger only while this still names the pair on screen.
   */
  triggerPair: string | undefined
  /**
   * Basis points staged by Recreate for the order it reproduces. It stands in for the user's own pick
   * (`user.stopMarketSlippage`) on that order only, and goes with the rest of the draft once the order
   * is placed or the user picks a slippage.
   */
  slippage: number | undefined
  /** Seconds from now, used whenever `customDateExpire` is unset. */
  expire: number
  /** Unix ms. A timestamp rather than a Date so the store stays serialisable. */
  customDateExpire: number | undefined
}

export const DEFAULT_STOP_MARKET_FORM_STATE: StopMarketFormState = {
  triggerPrice: '',
  triggerPair: undefined,
  slippage: undefined,
  expire: STOP_MARKET_DEFAULT_EXPIRE,
  customDateExpire: undefined,
}

const stopMarketSlice = createSlice({
  name: 'stopMarket',
  initialState: DEFAULT_STOP_MARKET_FORM_STATE,
  reducers: {
    updateStopMarketForm: (state, { payload }: PayloadAction<Partial<StopMarketFormState>>) => ({
      ...state,
      ...payload,
    }),
    resetStopMarketForm: () => DEFAULT_STOP_MARKET_FORM_STATE,
  },
})

export const { updateStopMarketForm, resetStopMarketForm } = stopMarketSlice.actions

export default stopMarketSlice.reducer
