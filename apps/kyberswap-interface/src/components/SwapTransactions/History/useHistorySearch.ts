import { matchesToken } from 'components/SwapTransactions/History/historySearch'
import type { HistoryTransaction } from 'components/SwapTransactions/history'
import { useHistoryTokens } from 'components/SwapTransactions/useHistoryTokens'

// Filter the merged candidate set using the same metadata owner as display rows.
export const useHistorySearch = (transactions: HistoryTransaction[], query: string) => {
  const { resolve, loading, unresolved } = useHistoryTokens(
    transactions.flatMap(tx => [
      { chain: tx.sourceChain, token: tx.sourceToken },
      { chain: tx.targetChain, token: tx.targetToken },
    ]),
  )
  return {
    loading,
    unresolved,
    transactions: transactions.flatMap(tx => {
      const sourceToken = resolve(tx.sourceToken, tx.sourceChain)
      const targetToken = resolve(tx.targetToken, tx.targetChain)
      return [tx.sourceToken, tx.targetToken, sourceToken, targetToken].some(token => matchesToken(token, query))
        ? [{ ...tx, sourceToken, targetToken }]
        : []
    }),
  }
}
