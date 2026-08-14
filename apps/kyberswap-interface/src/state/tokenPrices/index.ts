import { PayloadAction, createSlice } from '@reduxjs/toolkit'

/**
 * The canonical USD price per (chain, lowercased address) for the whole app.
 *
 *   undefined -> never attempted
 *   null      -> attempted, no trustworthy price (one-sided quote, omitted by the API, or a
 *                terminally failed fetch)
 *   number    -> mid of the buy/sell spread, per `getMidPrice` in services/tokenCatalog
 *
 * Leaf values stay primitive so immer's identity check makes a sweep that confirms unchanged prices
 * a genuine no-op; fetch bookkeeping lives in ./registry precisely so it cannot force a new slice
 * reference on every tick. Only the updater writes here, and it always lowercases addresses.
 */
export interface TokenPricesState {
  [chainId: number]: { [address: string]: number | null }
}

export type UpdatePricesPayload = { [chainId: number]: { [address: string]: number | null } }

const slice = createSlice({
  name: 'tokenPrices',
  initialState: {} as TokenPricesState,
  reducers: {
    updatePrices(state, { payload }: PayloadAction<UpdatePricesPayload>) {
      Object.entries(payload).forEach(([chainId, prices]) => {
        const bucket = (state[Number(chainId)] ||= {})
        Object.entries(prices).forEach(([address, price]) => {
          bucket[address] = price
        })
      })
    },
  },
})

export const { updatePrices } = slice.actions

export default slice.reducer
