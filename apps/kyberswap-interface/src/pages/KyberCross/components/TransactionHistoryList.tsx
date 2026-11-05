import { t } from '@lingui/macro'
import { type ReactNode, useEffect, useState } from 'react'
import { useMedia } from 'react-use'

import { ReactComponent as NoTransactionIcon } from 'assets/svg/no_transaction.svg'
import Pagination from 'components/Pagination'
import {
  TransactionHistoryItem,
  TransactionTableGrid,
} from 'components/SwapTransactions/History/TransactionHistoryItem'
import type { HistoryTransaction } from 'components/SwapTransactions/history'
import { localTransactionKey } from 'state/crossChainSwap/model'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'

const PAGE_SIZE = 6
const HeaderCell = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span className={cn('text-xs font-medium uppercase tracking-[0.04em] text-subText', className)}>{children}</span>
)

const TransactionHistoryList = ({ transactions }: { transactions: HistoryTransaction[] }) => {
  const [page, setPage] = useState(1)
  const mobile = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const lastPage = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE))
  useEffect(() => setPage(current => Math.min(current, lastPage)), [lastPage])
  const rows = transactions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
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
        {rows.map(tx => (
          <TransactionHistoryItem key={localTransactionKey(tx)} tx={tx} mobile={mobile} />
        ))}
      </div>
      <div className="hidden min-h-[220px] flex-col items-center justify-center gap-2 px-4 py-6 peer-empty:flex">
        <NoTransactionIcon className="size-20" />
        <span className="text-center text-sm font-medium text-subText">{t`No historical data available.`}</span>
      </div>
      {transactions.length > PAGE_SIZE && (
        <div className="flex items-center justify-center bg-background px-4 py-2">
          <Pagination
            onPageChange={setPage}
            totalCount={transactions.length}
            currentPage={page}
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
