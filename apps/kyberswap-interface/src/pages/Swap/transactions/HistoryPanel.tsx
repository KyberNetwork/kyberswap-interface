import { t } from '@lingui/macro'
import { Suspense, lazy, useState } from 'react'
import { ChevronLeft, Clock, Search, X } from 'react-feather'

import IconButton from 'components/Button/IconButton'
import Input from 'components/Input'
import Loader from 'components/Loader'
import { HStack, Stack } from 'components/Stack'
import { MouseoverTooltip } from 'components/Tooltip'
import { useSwapWallets } from 'pages/Swap/SwapWalletContext'
import { useHistoryPagination } from 'pages/Swap/transactions/useHistoryPagination'
import { Chain } from 'types/crossChain'

const TransactionHistoryList = lazy(() => import('pages/Swap/transactions/TransactionHistoryList'))
const HistorySearchResults = lazy(() =>
  import('pages/Swap/transactions/HistorySearchResults').then(module => ({ default: module.HistorySearchResults })),
)

/** Controlled trigger composed into the form header; SwapPage owns visibility and panel mounting. */
export const HistoryButton = ({ active, onClick }: { active: boolean; onClick: () => void }) => (
  <IconButton
    variant="action"
    active={active}
    aria-label="Swap history"
    aria-expanded={active}
    aria-controls="swap-right-panel"
    onClick={onClick}
  >
    <MouseoverTooltip text={t`History`} placement="top" width="fit-content">
      <Clock size={20} className="text-subText" />
    </MouseoverTooltip>
  </IconButton>
)

// Remount only wallet-owned history state; keep the search input and focus stable.
const WalletHistory = ({ sender, filter }: { sender: string; filter: string }) => {
  const history = useHistoryPagination(sender)
  const { transactions } = history

  if (filter)
    return (
      <HistorySearchResults
        key={filter}
        transactions={history.searchTransactions}
        query={filter}
        hasMore={history.hasMore}
        loadingMore={history.loadingMore}
        isError={history.isError}
        onLoadMore={history.loadMore}
        onRetry={history.retryHistory}
      />
    )

  return (
    <TransactionHistoryList
      transactions={transactions}
      emptyMessage={history.loadingMore ? t`Loading` : t`No transactions found`}
      cursorPagination={{
        currentPage: history.currentPage,
        canGoPrevious: history.canGoPrevious,
        canGoNext: history.canGoNext,
        loading: history.loadingMore,
        onPrevious: history.goPrevious,
        onNext: history.goNext,
      }}
    />
  )
}

export const useHistoryWallet = (inputChain: Chain) => {
  const wallets = useSwapWallets()

  // History follows the current input signer after reverse; it never includes the receiver slot.
  const sender = wallets?.inputAddress || ''

  return typeof inputChain === 'number' ? sender.toLowerCase() : sender
}

/** Owns the search input; search results resolve metadata before pagination.
 * Cross-chain status polling is mounted independently by SwapPage. */
// TODO: Add transaction details as separate product work.
const HistoryPanel = ({ inputChain, onBack }: { inputChain: Chain; onBack: () => void }) => {
  const sender = useHistoryWallet(inputChain)
  const [search, setSearch] = useState('')

  // Search has its own result pages and can explicitly extend the loaded API history.
  const query = search.trim().toLowerCase()

  return (
    <Stack className="min-w-0 rounded-xl bg-background shadow-[0_8px_24px_rgba(0,0,0,0.10)] max-sm:gap-2 max-sm:bg-transparent max-sm:shadow-none">
      <HStack
        as="header"
        className="flex-wrap items-center gap-4 px-4 py-2 max-sm:gap-2 max-sm:rounded-xl max-sm:bg-background max-sm:p-3"
      >
        <HStack className="shrink-0 items-center gap-1">
          <IconButton aria-label="Back to chart and route" onClick={onBack}>
            <ChevronLeft size={26} className="text-subText" aria-hidden />
          </IconButton>
          <span className="text-xl font-medium text-text">{t`History`}</span>
        </HStack>
        <HStack className="h-10 min-w-0 max-w-[400px] flex-1 items-center gap-1 rounded-xl bg-black/20 pl-3 pr-2 transition-shadow duration-150 focus-within:ring-1 focus-within:ring-subText/20 max-sm:max-w-none max-sm:basis-full">
          <Search size={20} className="shrink-0 text-subText" aria-hidden />
          <Input
            aria-label="Filter history by token"
            placeholder={t`Search token or address`}
            value={search}
            onChange={event => setSearch(event.target.value)}
            className="h-full min-w-0 flex-1 rounded-none border-0 bg-transparent p-0 text-sm text-text placeholder:text-sm placeholder:text-subText"
          />
          {search && (
            <IconButton variant="action" aria-label="Clear token filter" onClick={() => setSearch('')}>
              <X size={20} className="text-subText transition-colors hover:text-text" aria-hidden />
            </IconButton>
          )}
        </HStack>
      </HStack>
      <div className="min-w-0 px-4 pb-2 pt-0 max-sm:p-0">
        <div className="min-w-0 overflow-x-auto">
          <div className="min-w-[800px] max-sm:min-w-0">
            <Suspense
              fallback={
                <div
                  className="flex min-h-[220px] items-center justify-center max-sm:rounded-lg max-sm:bg-background"
                  role="status"
                >
                  <Loader />
                </div>
              }
            >
              <WalletHistory key={sender} sender={sender} filter={query} />
            </Suspense>
          </div>
        </div>
      </div>
    </Stack>
  )
}

export default HistoryPanel
