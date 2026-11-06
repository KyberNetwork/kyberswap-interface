import { useEffect, useState } from 'react'

import { matchesToken } from 'components/SwapTransactions/History/historySearch'
import { HISTORY_PAGE_SIZE, type HistoryTransaction } from 'components/SwapTransactions/history'
import { useHistoryTokens } from 'components/SwapTransactions/useHistoryTokens'

// Filter the merged candidate set using the same metadata owner as display rows.
type SearchHistory = {
  transactions: HistoryTransaction[]
  query: string
  hasMore: boolean
  loadingMore: boolean
  isError: boolean
  onLoadMore: () => unknown
}

export const useHistorySearch = ({ transactions, query, hasMore, loadingMore, isError, onLoadMore }: SearchHistory) => {
  const [page, setPage] = useState(1)
  const { resolve, loading, unresolved } = useHistoryTokens(
    transactions.flatMap(tx => [
      { chain: tx.sourceChain, token: tx.sourceToken },
      { chain: tx.targetChain, token: tx.targetToken },
    ]),
  )
  const matches = transactions.flatMap(tx => {
    const sourceToken = resolve(tx.sourceToken, tx.sourceChain)
    const targetToken = resolve(tx.targetToken, tx.targetChain)
    return [tx.sourceToken, tx.targetToken, sourceToken, targetToken].some(token => matchesToken(token, query))
      ? [{ ...tx, sourceToken, targetToken }]
      : []
  })
  const lastPage = Math.max(1, Math.ceil(matches.length / HISTORY_PAGE_SIZE))
  const needsMore = hasMore && matches.length < page * HISTORY_PAGE_SIZE
  const searching = loadingMore || loading || (needsMore && !isError)
  const currentPage = !hasMore && !searching ? Math.min(page, lastPage) : page

  useEffect(() => {
    if (!needsMore || loadingMore || loading || isError) return
    // Let typing settle; each request extends the cache shared with normal history.
    const timer = setTimeout(() => void onLoadMore(), 250)
    return () => clearTimeout(timer)
  }, [needsMore, loadingMore, loading, isError, onLoadMore, query, transactions])

  useEffect(() => {
    if (!hasMore && !searching) setPage(current => Math.min(current, lastPage))
  }, [hasMore, searching, lastPage])

  return {
    loading: searching,
    unresolved,
    transactions: matches.slice((currentPage - 1) * HISTORY_PAGE_SIZE, currentPage * HISTORY_PAGE_SIZE),
    currentPage,
    canGoPrevious: currentPage > 1,
    canGoNext: !searching && (matches.length > currentPage * HISTORY_PAGE_SIZE || (!isError && hasMore)),
    goPrevious: () => setPage(Math.max(1, currentPage - 1)),
    goNext: () => setPage(currentPage + 1),
  }
}
