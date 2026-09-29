import { createSlice } from '@reduxjs/toolkit'
import { useCallback } from 'react'

import type { NormalizedTxResponse, SwapStatus } from 'pages/CrossChainSwap/adapters/types'
import { useAppDispatch, useAppSelector } from 'state/hooks'

const MAX_CROSS_CHAIN_TRANSACTIONS = 120

export type CrossChainQuoteMode = 'direct' | 'stream'

export interface CrossChainSwapState {
  quoteMode: CrossChainQuoteMode
  transactions: NormalizedTxResponse[]
  excludedSources: string[]
}

const slice = createSlice({
  name: 'crossChainSwap',
  initialState: {
    quoteMode: 'direct',
    transactions: [] as NormalizedTxResponse[],
    excludedSources: [] as string[],
  } as CrossChainSwapState,
  reducers: {
    updateQuoteMode: (state, { payload }: { payload: CrossChainQuoteMode }) => {
      if (state.quoteMode === payload) return
      state.quoteMode = payload
      // Direct filters bridge providers; stream filters aggregator sources.
      state.excludedSources = []
    },
    updateTransactions: (state, { payload }: { payload: NormalizedTxResponse[] }) => {
      state.transactions = payload
    },
    updateTransactionStatus: (state, { payload }: { payload: { id: string; result: SwapStatus } }) => {
      const transaction = state.transactions.find(tx => tx.id === payload.id)
      if (!transaction) return

      const { txHash, status, amountOut } = payload.result

      transaction.status = status
      if (txHash) transaction.targetTxHash = txHash

      if (amountOut && amountOut !== '0' && amountOut !== transaction.outputAmount) {
        transaction.estimatedAmountOut = transaction.estimatedAmountOut || transaction.outputAmount
        transaction.outputAmount = amountOut
      }
    },
    updateExcludedSources: (state, { payload }: { payload: string[] }) => {
      state.excludedSources = payload
    },
  },
})

export const { updateTransactions, updateTransactionStatus, updateExcludedSources, updateQuoteMode } = slice.actions

export const useCrossChainQuoteMode = () => useAppSelector(state => state.crossChainSwap.quoteMode || 'direct')
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
