import { createSlice } from '@reduxjs/toolkit'
import { NormalizedTxResponse } from 'pages/CrossChainSwap/adapters'
import { useAppDispatch, useAppSelector } from 'state/hooks'

const slice = createSlice({
  name: 'crossChainTransactions',
  initialState: [] as NormalizedTxResponse[],
  reducers: {
    updateTransactions: (_state, { payload }: { payload: NormalizedTxResponse[] }) => {
      return payload
    },
  },
})

export const { updateTransactions } = slice.actions

export default slice.reducer

export const useCrossChainTransactions = (): [
  NormalizedTxResponse[],
  (transactions: NormalizedTxResponse[]) => void,
] => {
  const transactions = useAppSelector(state => state.crossChainTransactions) || []
  const dispatch = useAppDispatch()

  const setTransactions = (transactions: NormalizedTxResponse[]) => {
    dispatch(updateTransactions(transactions))
  }

  return [transactions, setTransactions]
}
