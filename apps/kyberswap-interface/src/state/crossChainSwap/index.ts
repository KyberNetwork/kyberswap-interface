import { createSlice } from '@reduxjs/toolkit'

import type { NormalizedTxResponse } from 'pages/CrossChainSwap/adapters/types'
import { useAppDispatch, useAppSelector } from 'state/hooks'

export interface CrossChainSwapState {
  transactions: NormalizedTxResponse[]
  excludedSources: string[]
}

const slice = createSlice({
  name: 'crossChainSwap',
  initialState: {
    transactions: [] as NormalizedTxResponse[],
    excludedSources: [] as string[],
  } as CrossChainSwapState,
  reducers: {
    updateTransactions: (state, { payload }: { payload: NormalizedTxResponse[] }) => {
      state.transactions = payload
    },
    updateExcludedSources: (state, { payload }: { payload: string[] }) => {
      state.excludedSources = payload
    },
  },
})

export const { updateTransactions, updateExcludedSources } = slice.actions
export default slice.reducer

export const useCrossChainTransactions = (): [
  NormalizedTxResponse[],
  (transactions: NormalizedTxResponse[]) => void,
] => {
  const transactions = useAppSelector(state => state.crossChainSwap.transactions || []) || []
  const dispatch = useAppDispatch()
  const setTransactions = (transactions: NormalizedTxResponse[]) => {
    dispatch(updateTransactions(transactions))
  }
  return [transactions, setTransactions]
}
