import { t } from '@lingui/macro'
import { useQueryClient } from '@tanstack/react-query'
import {
  type ComponentType,
  type HTMLAttributes,
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Eye } from 'react-feather'
import { normalizeAdapterName } from 'services/crossChain/utils'

import IconButton from 'components/Button/IconButton'
import Loader from 'components/Loader'
import Modal from 'components/Modal'
import { HStack, Stack } from 'components/Stack'
import type { HistoryTransaction } from 'components/SwapTransactions/history'
import { getKyberCrossDetailQueryOptions } from 'components/SwapTransactions/kyberCrossExecutionQuery'
import { ButtonText, CloseIcon } from 'theme'

const getTransactionDetailKey = (tx: HistoryTransaction) => `${tx.sourceChain}:${tx.sourceTxHash.toLowerCase()}`
const TransactionDetailContext = createContext<
  { open: (tx: HistoryTransaction) => Promise<void>; loadingKey?: string } | undefined
>(undefined)

/** One selection owner for history, search results and processing orders. */
export const TransactionDetailProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient()
  const [Detail, setDetail] = useState<ComponentType<{ tx: HistoryTransaction }>>()
  const [selected, setSelected] = useState<HistoryTransaction>()
  const [loadingKey, setLoadingKey] = useState<string>()
  const pendingOpenRequest = useRef<{ key: string } | undefined>(undefined)

  const open = async (tx: HistoryTransaction) => {
    const key = getTransactionDetailKey(tx)
    if (pendingOpenRequest.current?.key === key) return

    const queryOptions = getKyberCrossDetailQueryOptions(tx)
    const cachedQuery = queryClient.getQueryState(queryOptions.queryKey)
    // A previous failed request already has a usable FE fallback; retry inside the modal.
    const hasLoadedDetail = !!cachedQuery && (cachedQuery.data !== undefined || cachedQuery.errorUpdatedAt > 0)
    if (Detail && hasLoadedDetail) {
      pendingOpenRequest.current = undefined
      setLoadingKey(undefined)
      setSelected(tx)
      return
    }

    const request = { key }
    pendingOpenRequest.current = request
    setLoadingKey(hasLoadedDetail ? undefined : key)

    // Load the chunk and first execution together. A failed API request opens the FE fallback.
    const [detailModule] = await Promise.allSettled([
      import('components/SwapTransactions/TransactionDetail/KyberCrossTransactionDetail'),
      hasLoadedDetail ? undefined : queryClient.ensureQueryData(queryOptions),
    ])
    if (pendingOpenRequest.current !== request) return

    pendingOpenRequest.current = undefined
    setLoadingKey(undefined)
    if (detailModule.status !== 'fulfilled') return

    setDetail(() => detailModule.value.default)
    setSelected(tx)
  }

  const dismiss = () => {
    pendingOpenRequest.current = undefined
    setLoadingKey(undefined)
    setSelected(undefined)
  }

  useEffect(
    () => () => {
      pendingOpenRequest.current = undefined
    },
    [],
  )

  return (
    <TransactionDetailContext.Provider value={{ open, loadingKey }}>
      {children}
      {selected && Detail && (
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
              <Detail key={getTransactionDetailKey(selected)} tx={selected} />
            </div>
          </Stack>
        </Modal>
      )}
    </TransactionDetailContext.Provider>
  )
}

const useOpenTransactionDetail = (tx: HistoryTransaction) => {
  const context = useContext(TransactionDetailContext)
  return {
    open: context && normalizeAdapterName(tx.adapter) === 'kybercross' ? () => void context.open(tx) : undefined,
    loading: context?.loadingKey === getTransactionDetailKey(tx),
  }
}

export const TransactionDetailButton = ({ tx }: { tx: HistoryTransaction }) => {
  const { open, loading } = useOpenTransactionDetail(tx)
  if (!open) return null

  return (
    <IconButton
      className="size-6 rounded-md text-primary hover:bg-primary/25 focus-visible:bg-primary/25 focus-visible:ring-1 focus-visible:ring-primary"
      aria-label={t`View KyberCross transaction details`}
      title={t`View KyberCross transaction details`}
      aria-haspopup="dialog"
      aria-busy={loading}
      disabled={loading}
      onClick={open}
    >
      {loading ? <Loader size="14px" aria-hidden /> : <Eye size={14} strokeWidth={2} aria-hidden />}
    </IconButton>
  )
}

export const useTransactionDetailTrigger = (tx: HistoryTransaction): HTMLAttributes<HTMLElement> => {
  const { open, loading } = useOpenTransactionDetail(tx)
  if (!open) return {}

  return {
    role: 'button',
    tabIndex: 0,
    'aria-label': t`View KyberCross transaction details`,
    'aria-haspopup': 'dialog',
    'aria-busy': loading,
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
