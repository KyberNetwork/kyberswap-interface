import { t } from '@lingui/macro'
import { useMedia } from 'react-use'

import { ReactComponent as NoTransactionIcon } from 'assets/svg/no_transaction.svg'
import HistoryPagination from 'components/HistoryPagination'
import { TransactionHistoryItem } from 'pages/Swap/transactions/TransactionHistoryItem'
import type { HistoryTransaction } from 'pages/Swap/transactions/history'
import { localTransactionKey } from 'state/crossChainSwap/model'
import { MEDIA_WIDTHS } from 'theme'

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
      <div className="peer flex flex-col gap-1 empty:hidden max-sm:gap-2">
        {transactions.map(tx => (
          <TransactionHistoryItem key={localTransactionKey(tx)} tx={tx} mobile={mobile} />
        ))}
      </div>
      <div className="hidden min-h-[220px] flex-col items-center justify-center gap-2 px-4 py-6 peer-empty:flex max-sm:rounded-lg max-sm:bg-background">
        <NoTransactionIcon className="size-20" />
        <span className="text-center text-sm font-medium text-subText">{emptyMessage}</span>
      </div>
      {cursorPagination && (cursorPagination.canGoPrevious || cursorPagination.canGoNext) && (
        <div className="flex justify-center bg-background px-4 py-3 max-sm:mt-2 max-sm:rounded-lg">
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
