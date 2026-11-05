import { t } from '@lingui/macro'
import { useState } from 'react'

import { ButtonOutlined } from 'components/Button'
import Loader from 'components/Loader'
import TransactionHistoryList from 'pages/Swap/transactions/TransactionHistoryList'
import { HISTORY_PAGE_SIZE, type HistoryTransaction } from 'pages/Swap/transactions/history'
import { useHistorySearch } from 'pages/Swap/transactions/useHistorySearch'

type Props = {
  transactions: HistoryTransaction[]
  query: string
  hasMore: boolean
  loadingMore: boolean
  isError: boolean
  onLoadMore: () => unknown
  onRetry: () => unknown
}

// Keyed by query inside the wallet owner: only filtered-result navigation resets.
export const HistorySearchResults = ({
  transactions,
  query,
  hasMore,
  loadingMore,
  isError,
  onLoadMore,
  onRetry,
}: Props) => {
  const result = useHistorySearch(transactions, query)
  const [page, setPage] = useState(1)
  const lastPage = Math.max(1, Math.ceil(result.transactions.length / HISTORY_PAGE_SIZE))
  const currentPage = Math.min(page, lastPage)
  const loading = loadingMore || result.loading
  const emptyMessage = loading ? t`Loading` : t`No transactions found`

  return (
    <>
      <TransactionHistoryList
        transactions={result.transactions.slice((currentPage - 1) * HISTORY_PAGE_SIZE, currentPage * HISTORY_PAGE_SIZE)}
        emptyMessage={emptyMessage}
        cursorPagination={{
          currentPage,
          canGoPrevious: currentPage > 1,
          canGoNext: currentPage < lastPage,
          loading: false,
          onPrevious: () => setPage(currentPage - 1),
          onNext: () => setPage(currentPage + 1),
        }}
      />
      <div className="flex flex-col items-center gap-2 py-3 text-center text-sm text-subText">
        {loading && result.transactions.length > 0 && (
          <span className="inline-flex items-center gap-2" role="status">
            <Loader size="14px" />
            {t`Loading`}
          </span>
        )}
        {isError && <span>{t`Could not load history. Please try again.`}</span>}
        {result.unresolved && <span>{t`Some token details are unavailable. Results may be incomplete.`}</span>}
        {isError ? (
          <ButtonOutlined disabled={loadingMore} onClick={onRetry}>{t`Retry history`}</ButtonOutlined>
        ) : hasMore ? (
          <ButtonOutlined disabled={loadingMore} onClick={onLoadMore}>
            {t`Search older transactions`}
          </ButtonOutlined>
        ) : null}
      </div>
    </>
  )
}
