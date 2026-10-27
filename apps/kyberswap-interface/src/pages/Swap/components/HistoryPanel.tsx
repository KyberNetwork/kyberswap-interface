import { t } from '@lingui/macro'
import { useWalletSelector } from '@near-wallet-selector/react-hook'
import { useWallet } from '@solana/wallet-adapter-react'
import { lazy, useState } from 'react'
import { ChevronLeft, Clock, Search, X } from 'react-feather'

import IconButton from 'components/Button/IconButton'
import Input from 'components/Input'
import { HStack, Stack } from 'components/Stack'
import { MouseoverTooltip } from 'components/Tooltip'
import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import { useActiveWeb3React } from 'hooks'
import { useUnifiedTransactionHistory } from 'pages/CrossChainSwap/transactions/useUnifiedTransactionHistory'

const TransactionHistoryList = lazy(() => import('pages/CrossChainSwap/components/TransactionHistoryList'))

/** Controlled trigger composed into the form header; SwapPage owns visibility and panel mounting. */
export const HistoryButton = ({ active, onClick }: { active: boolean; onClick: () => void }) => (
  <IconButton
    variant="action"
    active={active}
    aria-label="Cross-chain history"
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
  const history = useUnifiedTransactionHistory(sender)
  const { transactions } = history

  return (
    <TransactionHistoryList
      transactions={transactions}
      filter={filter}
      cursorPagination={{
        currentPage: history.currentPage,
        canGoPrevious: history.canGoPrevious,
        canGoNext: history.canGoNext,
        loading: history.loadingMore,
        onPrevious: history.goPrevious,
        onNext: history.goNext,
      }}
      emptyMessage={filter && transactions.length ? t`No transactions match this token.` : undefined}
    />
  )
}

/** Owns the search input; rows resolve token metadata and apply the filter.
 * Polling is mounted by SwapPage independently, so closing History must not stop status updates. */
// TODO: Add transaction details and single-chain history as separate product work.
const HistoryPanel = ({ onBack }: { onBack: () => void }) => {
  const { account } = useActiveWeb3React()
  const { publicKey } = useWallet()
  const { walletInfo } = useBitcoinWallet()
  const { signedAccountId } = useWalletSelector()
  const sender = account?.toLowerCase() || publicKey?.toString() || walletInfo?.address || signedAccountId || ''
  const [search, setSearch] = useState('')
  // Filtering stays within the current merged page; it does not search unloaded API cursors.
  const query = search.trim().toLowerCase()

  return (
    <Stack className="min-w-0 rounded-xl bg-background shadow-[0_8px_24px_rgba(0,0,0,0.10)]">
      <HStack as="header" className="flex-wrap items-center gap-4 px-4 py-2 max-sm:gap-2 max-sm:px-3">
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
      <div className="min-w-0 px-4 pb-4 pt-0 max-sm:px-3 max-sm:pb-3">
        <div className="min-w-0 overflow-x-auto">
          <div className="min-w-[800px] max-sm:min-w-0">
            <WalletHistory key={sender} sender={sender} filter={query} />
          </div>
        </div>
      </div>
    </Stack>
  )
}

export default HistoryPanel
