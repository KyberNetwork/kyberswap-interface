import { PayloadAction, createSlice } from '@reduxjs/toolkit'

/**
 * The canonical USD price per (chain, lowercased address) for the whole app. `undefined` means never
 * attempted, `null` means attempted without a trustworthy price, a number is the buy/sell mid.
 *
 * Leaf values stay primitive so immer's identity check makes a sweep that confirms unchanged prices a
 * genuine no-op — which is also why fetch bookkeeping lives in ./registry rather than here.
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
