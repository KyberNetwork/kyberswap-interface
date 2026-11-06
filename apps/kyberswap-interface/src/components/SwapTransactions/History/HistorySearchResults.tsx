import { t } from '@lingui/macro'

import { ButtonOutlined } from 'components/Button'
import Loader from 'components/Loader'
import TransactionHistoryList from 'components/SwapTransactions/History/TransactionHistoryList'
import { useHistorySearch } from 'components/SwapTransactions/History/useHistorySearch'
import type { HistoryTransaction } from 'components/SwapTransactions/history'

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
  const result = useHistorySearch({ transactions, query, hasMore, loadingMore, isError, onLoadMore })
  const loading = result.loading
  const emptyMessage = loading ? t`Loading` : t`No transactions found`

  return (
    <>
      <TransactionHistoryList
        transactions={result.transactions}
        emptyMessage={emptyMessage}
        cursorPagination={{
          currentPage: result.currentPage,
          canGoPrevious: result.canGoPrevious,
          canGoNext: result.canGoNext,
          loading,
          onPrevious: result.goPrevious,
          onNext: result.goNext,
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
        {isError ? <ButtonOutlined disabled={loadingMore} onClick={onRetry}>{t`Retry history`}</ButtonOutlined> : null}
      </div>
    </>
  )
}
