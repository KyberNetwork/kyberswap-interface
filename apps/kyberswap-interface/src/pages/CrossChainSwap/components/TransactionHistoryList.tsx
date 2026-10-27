import { t } from '@lingui/macro'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { useMedia } from 'react-use'

import { ReactComponent as NoTransactionIcon } from 'assets/svg/no_transaction.svg'
import HistoryPagination from 'components/HistoryPagination'
import Pagination from 'components/Pagination'
import { TransactionHistoryItem, TransactionTableGrid } from 'pages/CrossChainSwap/components/TransactionHistoryItem'
import type { HistoryTransaction } from 'pages/CrossChainSwap/transactions/history'
import { localTransactionKey } from 'pages/CrossChainSwap/transactions/model'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'

const PAGE_SIZE = 6

const TransactionTableHeaderCell = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span className={cn('text-xs font-medium uppercase tracking-[0.04em] text-subText', className)}>{children}</span>
)

type TransactionHistoryListProps = {
  transactions: HistoryTransaction[]
  filter?: string
  emptyMessage?: string
  cursorPagination?: {
    currentPage: number
    canGoPrevious: boolean
    canGoNext: boolean
    loading: boolean
    onPrevious: () => void
    onNext: () => void
  }
}

/** Owns layout and pagination; each item owns token lookup and filtering.
 * Status acquisition belongs to the page-mounted updater. */
const TransactionHistoryList = ({
  transactions,
  filter,
  emptyMessage = t`No historical data available.`,
  cursorPagination,
}: TransactionHistoryListProps) => {
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => setCurrentPage(1), [filter])

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const lastPage = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE))
  const visibleTransactions = useMemo(
    () =>
      cursorPagination ? transactions : transactions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentPage, transactions, cursorPagination],
  )
  const showPagination = !cursorPagination && transactions.length > PAGE_SIZE

  useEffect(() => {
    if (currentPage > lastPage) {
      setCurrentPage(lastPage)
    }
  }, [currentPage, lastPage])

  return (
    <div className="w-full overflow-hidden rounded-xl border border-darkBorder max-sm:rounded-lg">
      {upToSmall ? (
        <div className="cursor-default bg-background px-4 py-3">
          <TransactionTableHeaderCell>{t`History`}</TransactionTableHeaderCell>
        </div>
      ) : (
        <TransactionTableGrid className="cursor-default bg-background px-4 py-3">
          <TransactionTableHeaderCell>{t`Created`}</TransactionTableHeaderCell>
          <TransactionTableHeaderCell>{t`Status`}</TransactionTableHeaderCell>
          <TransactionTableHeaderCell>{t`Route`}</TransactionTableHeaderCell>
          <TransactionTableHeaderCell>{t`Amount`}</TransactionTableHeaderCell>
          <TransactionTableHeaderCell className="text-right">{t`Actions`}</TransactionTableHeaderCell>
        </TransactionTableGrid>
      )}

      {/* Empty state follows rendered rows, not unresolved token IDs. This avoids
          a second metadata map or child-to-parent result synchronization. */}
      <div className={cn('peer empty:hidden', upToSmall && 'flex flex-col gap-3 p-3')}>
        {visibleTransactions.map(tx => (
          <TransactionHistoryItem
            key={localTransactionKey(tx)}
            tx={tx}
            mobile={upToSmall}
            showPagination={showPagination}
            filter={filter}
          />
        ))}
      </div>
      <div className="hidden min-h-[220px] flex-col items-center justify-center gap-2 px-4 py-6 peer-empty:flex">
        <NoTransactionIcon className="size-20" />
        <span className="text-center text-sm font-medium text-subText">{emptyMessage}</span>
      </div>

      {cursorPagination && (cursorPagination.canGoPrevious || cursorPagination.canGoNext) && (
        <div className="flex justify-center bg-background px-4 py-3">
          <HistoryPagination
            currentPage={cursorPagination.currentPage}
            canGoPrevious={cursorPagination.canGoPrevious}
            canGoNext={!cursorPagination.loading && cursorPagination.canGoNext}
            onPrevious={cursorPagination.onPrevious}
            onNext={cursorPagination.onNext}
            ariaLabel="History pages"
          />
        </div>
      )}
      {showPagination && (
        <div className="flex items-center justify-center bg-background px-4 py-2">
          <Pagination
            onPageChange={setCurrentPage}
            totalCount={transactions.length}
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            haveBg={false}
            className="!p-0"
          />
        </div>
      )}
    </div>
  )
}

export default TransactionHistoryList
