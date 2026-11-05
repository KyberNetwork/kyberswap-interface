import { t } from '@lingui/macro'
import { type HTMLAttributes, type ReactNode, Suspense, createContext, lazy, useContext, useState } from 'react'
import { Search } from 'react-feather'
import { normalizeAdapterName } from 'services/crossChain/utils'

import IconButton from 'components/Button/IconButton'
import Modal from 'components/Modal'
import { HStack, Stack } from 'components/Stack'
import TransactionDetailSkeleton from 'components/SwapTransactions/TransactionDetail/TransactionDetailSkeleton'
import type { HistoryTransaction } from 'components/SwapTransactions/history'
import { ButtonText, CloseIcon } from 'theme'

const KyberCrossTransactionDetail = lazy(
  () => import('components/SwapTransactions/TransactionDetail/KyberCrossTransactionDetail'),
)
const TransactionDetailContext = createContext<((tx: HistoryTransaction) => void) | undefined>(undefined)

/** One selection owner for history, search results and processing orders. */
export const TransactionDetailProvider = ({ children }: { children: ReactNode }) => {
  const [selected, setSelected] = useState<HistoryTransaction>()
  const dismiss = () => setSelected(undefined)

  return (
    <TransactionDetailContext.Provider value={setSelected}>
      {children}
      {selected && (
        <Modal isOpen onDismiss={dismiss} maxWidth={720} maxHeight="85dvh">
          <Stack className="max-h-[85dvh] w-full min-w-0 gap-4 p-4 text-text sm:p-5">
            <Stack className="shrink-0 gap-1">
              <HStack className="items-center justify-between gap-3">
                <h2 className="text-xl font-medium">{t`Transaction details`}</h2>
                <ButtonText aria-label={t`Close`} onClick={dismiss}>
                  <CloseIcon />
                </ButtonText>
              </HStack>
              <span className="text-xs text-subText">{t`Track your KyberCross swap progress`}</span>
            </Stack>
            <div className="min-h-0 flex-auto overflow-y-auto [scrollbar-gutter:stable]">
              <Suspense fallback={<TransactionDetailSkeleton />}>
                <KyberCrossTransactionDetail key={`${selected.sourceChain}:${selected.sourceTxHash}`} tx={selected} />
              </Suspense>
            </div>
          </Stack>
        </Modal>
      )}
    </TransactionDetailContext.Provider>
  )
}

const useOpenTransactionDetail = (tx: HistoryTransaction) => {
  const open = useContext(TransactionDetailContext)
  return open && normalizeAdapterName(tx.adapter) === 'kybercross' ? () => open(tx) : undefined
}

export const TransactionDetailButton = ({ tx }: { tx: HistoryTransaction }) => {
  const open = useOpenTransactionDetail(tx)
  if (!open) return null

  return (
    <IconButton
      className="size-6 rounded-md bg-primary/10 text-primary hover:bg-primary/25 focus-visible:bg-primary/25 focus-visible:ring-1 focus-visible:ring-primary"
      aria-label={t`View KyberCross transaction details`}
      title={t`View KyberCross transaction details`}
      aria-haspopup="dialog"
      onClick={open}
    >
      <Search size={14} strokeWidth={2} aria-hidden />
    </IconButton>
  )
}

export const useTransactionDetailTrigger = (tx: HistoryTransaction): HTMLAttributes<HTMLElement> => {
  const open = useOpenTransactionDetail(tx)
  if (!open) return {}

  return {
    role: 'button',
    tabIndex: 0,
    'aria-label': t`View KyberCross transaction details`,
    'aria-haspopup': 'dialog',
    onClick: event => {
      if ((event.target as HTMLElement).closest('a, button')) return
      open()
    },
    onKeyDown: event => {
      if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) return
      event.preventDefault()
      open()
    },
  }
}
