import { createSlice } from '@reduxjs/toolkit'
import { useCallback } from 'react'

import type { NormalizedTxResponse } from 'pages/CrossChainSwap/adapters/types'
import { useAppDispatch, useAppSelector } from 'state/hooks'

const MAX_CROSS_CHAIN_TRANSACTIONS = 30

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

  const setTransactions = useCallback(
    (transactions: NormalizedTxResponse[]) => {
      dispatch(updateTransactions(transactions.slice(0, MAX_CROSS_CHAIN_TRANSACTIONS)))
    },
    [dispatch],
  )

  return [transactions, setTransactions]
}
