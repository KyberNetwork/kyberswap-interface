import { createSelector } from '@reduxjs/toolkit'

import { localTransactionToHistory } from 'components/SwapTransactions/history'
import { sameChainTransactionToHistory } from 'components/SwapTransactions/sameChainHistory'
import type { AppState } from 'state'
import { selectLocalTransactions } from 'state/transactions/selectors'

const selectCrossChainTransactions = (state: Pick<AppState, 'crossChainSwap'>) => state.crossChainSwap.transactions

// Stores own persistence and execution. These selectors only project their current
// values for readers; cross-chain execution takes precedence over a source-only row.
export const selectLocalSwapHistory = createSelector(
  [selectLocalTransactions, selectCrossChainTransactions],
  (sameChain, crossChain) => [
    ...sameChain.flatMap(tx => {
      const row = sameChainTransactionToHistory(tx)
      return row ? [row] : []
    }),
    ...crossChain.map(localTransactionToHistory),
  ],
)
