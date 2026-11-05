import { t } from '@lingui/macro'
import { useMedia } from 'react-use'

import { ReactComponent as NoTransactionIcon } from 'assets/svg/no_transaction.svg'
import HistoryPagination from 'components/HistoryPagination'
import { TransactionHistoryItem } from 'pages/Swap/transactions/TransactionHistoryItem'
import type { HistoryTransaction } from 'pages/Swap/transactions/history'
import { localTransactionKey } from 'state/crossChainSwap/model'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'

type Props = {
  transactions: HistoryTransaction[]
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
/** Unified Swap history list. Cursor state belongs to useHistoryPagination. */
const TransactionHistoryList = ({ transactions, emptyMessage = t`No transactions found`, cursorPagination }: Props) => {
  const mobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  return (
    <div className="w-full overflow-hidden">
      <div className={cn('peer empty:hidden', mobile && 'flex flex-col')}>
        {transactions.map(tx => (
          <TransactionHistoryItem key={localTransactionKey(tx)} tx={tx} mobile={mobile} />
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
