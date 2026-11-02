import { t } from '@lingui/macro'
import { type ReactNode } from 'react'
import { useMedia } from 'react-use'

import { ReactComponent as NoTransactionIcon } from 'assets/svg/no_transaction.svg'
import HistoryPagination from 'components/HistoryPagination'
import { TransactionHistoryItem, TransactionTableGrid } from 'pages/Swap/crossChain/components/TransactionHistoryItem'
import type { HistoryTransaction } from 'pages/Swap/crossChain/transactions/history'
import { localTransactionKey } from 'pages/Swap/crossChain/transactions/model'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'

type Props = {
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
const HeaderCell = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span className={cn('text-xs font-medium uppercase tracking-[0.04em] text-subText', className)}>{children}</span>
)

/** Unified Swap history list. Cursor state belongs to useUnifiedTransactionHistory. */
const TransactionHistoryList = ({
  transactions,
  filter,
  emptyMessage = t`No historical data available.`,
  cursorPagination,
}: Props) => {
  const mobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  return (
    <div className="w-full overflow-hidden rounded-xl border border-darkBorder max-sm:rounded-lg">
      {mobile ? (
        <div className="cursor-default bg-background px-4 py-3">
          <HeaderCell>{t`History`}</HeaderCell>
        </div>
      ) : (
        <TransactionTableGrid className="cursor-default bg-background px-4 py-3">
          <HeaderCell>{t`Created`}</HeaderCell>
          <HeaderCell>{t`Status`}</HeaderCell>
          <HeaderCell>{t`Route`}</HeaderCell>
          <HeaderCell>{t`Amount`}</HeaderCell>
          <HeaderCell className="text-right">{t`Actions`}</HeaderCell>
        </TransactionTableGrid>
      )}
      <div className={cn('peer empty:hidden', mobile && 'flex flex-col gap-3 p-3')}>
        {transactions.map(tx => (
          <TransactionHistoryItem
            key={localTransactionKey(tx)}
            tx={tx}
            mobile={mobile}
            showPagination={false}
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
    </div>
  )
}
export default TransactionHistoryList
