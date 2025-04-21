import { createSlice } from '@reduxjs/toolkit'
import { NormalizedTxResponse } from 'pages/CrossChainSwap/adapters'
import { useEffect, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'

export interface NearToken {
  assetId: string
  decimals: number
  blockchain: string
  symbol: string
  price: number
  priceUpdatedAt: number
  contractAddress: string
  logo: string
}

const slice = createSlice({
  name: 'crossChainSwap',
  initialState: { transactions: [] as NormalizedTxResponse[], nearTokens: [] as NearToken[] },
  reducers: {
    updateTransactions: (state, { payload }: { payload: NormalizedTxResponse[] }) => {
      state.transactions = payload
    },
    updateNearTokens: (state, { payload }: { payload: NearToken[] }) => {
      state.nearTokens = payload
    },
  },
})

export const { updateTransactions, updateNearTokens } = slice.actions

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

export const useNearTokens = () => {
  const nearTokens = useAppSelector(state => state.crossChainSwap.nearTokens || []) || []
  const dispatch = useAppDispatch()

  const hasTokens = useMemo(() => nearTokens.length > 0, [nearTokens.length])

  useEffect(() => {
    if (hasTokens) return

    fetch(`https://1click.chaindefuser.com/v0/tokens`)
      .then(res => res.json())
      .then(res => {
        dispatch(updateNearTokens(res))
      })
  }, [hasTokens, dispatch])

  return {
    nearTokens,
  }
}
