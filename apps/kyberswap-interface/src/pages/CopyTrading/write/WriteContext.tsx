import { useQueryClient } from '@tanstack/react-query'
import { type PropsWithChildren, createContext, useCallback, useContext, useMemo, useState } from 'react'
import copyTradingApi from 'services/copyTrading'
import type { AdvisoryActionAvailability, CopyRunSummary, PositionSummary } from 'services/copyTrading/types'

import AddCapitalModal from 'pages/CopyTrading/modals/AddCapitalModal'
import ManagePositionModal, { type ManagePositionMode } from 'pages/CopyTrading/modals/ManagePositionModal'
import StopCopyModal from 'pages/CopyTrading/modals/StopCopyModal'
import SubscribeModal, { type SubscribeTarget } from 'pages/CopyTrading/modals/SubscribeModal'
import WithdrawQuoteModal from 'pages/CopyTrading/modals/WithdrawQuoteModal'
import { useAppDispatch } from 'state/hooks'

type ActiveModal =
  | { type: 'subscribe'; agent: SubscribeTarget }
  | { type: 'addCapital'; copyRun: CopyRunSummary; agentName?: string }
  | { type: 'stopCopy'; copyRun: CopyRunSummary; agentName?: string }
  | { type: 'withdrawQuote'; copyRun: CopyRunSummary; withdrawQuoteAvailability?: AdvisoryActionAvailability }
  | { type: 'managePosition'; position: PositionSummary; mode: ManagePositionMode }

type CopyTradeWriteContextValue = {
  openSubscribe: (agent: SubscribeTarget) => void
  openAddCapital: (copyRun: CopyRunSummary, agentName?: string) => void
  openStopCopy: (copyRun: CopyRunSummary, agentName?: string) => void
  openWithdrawQuote: (copyRun: CopyRunSummary, availability?: AdvisoryActionAvailability) => void
  openManagePosition: (position: PositionSummary, mode: ManagePositionMode) => void
  refreshCopyTrading: () => Promise<void>
}

const CopyTradeWriteContext = createContext<CopyTradeWriteContextValue | undefined>(undefined)

export const CopyTradeWriteProvider = ({ children }: PropsWithChildren) => {
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()
  const [active, setActive] = useState<ActiveModal | null>(null)

  const refreshCopyTrading = useCallback(async () => {
    dispatch(copyTradingApi.util.invalidateTags(['CopyTrading']))
    await queryClient.invalidateQueries({ queryKey: ['copy-trading'] })
  }, [dispatch, queryClient])

  const value = useMemo<CopyTradeWriteContextValue>(
    () => ({
      openSubscribe: agent => setActive({ type: 'subscribe', agent }),
      openAddCapital: (copyRun, agentName) => setActive({ type: 'addCapital', copyRun, agentName }),
      openStopCopy: (copyRun, agentName) => setActive({ type: 'stopCopy', copyRun, agentName }),
      openWithdrawQuote: (copyRun, withdrawQuoteAvailability) =>
        setActive({ type: 'withdrawQuote', copyRun, withdrawQuoteAvailability }),
      openManagePosition: (position, mode) => setActive({ type: 'managePosition', position, mode }),
      refreshCopyTrading,
    }),
    [refreshCopyTrading],
  )

  const close = () => setActive(null)

  return (
    <CopyTradeWriteContext.Provider value={value}>
      {children}
      {active?.type === 'subscribe' && <SubscribeModal isOpen onDismiss={close} agent={active.agent} />}
      {active?.type === 'addCapital' && (
        <AddCapitalModal isOpen onDismiss={close} copyRun={active.copyRun} agentName={active.agentName} />
      )}
      {active?.type === 'stopCopy' && (
        <StopCopyModal isOpen onDismiss={close} copyRun={active.copyRun} agentName={active.agentName} />
      )}
      {active?.type === 'withdrawQuote' && (
        <WithdrawQuoteModal
          isOpen
          onDismiss={close}
          copyRun={active.copyRun}
          withdrawQuoteAvailability={active.withdrawQuoteAvailability}
        />
      )}
      {active?.type === 'managePosition' && (
        <ManagePositionModal isOpen onDismiss={close} position={active.position} mode={active.mode} />
      )}
    </CopyTradeWriteContext.Provider>
  )
}

export const useCopyTradeWrite = () => {
  const context = useContext(CopyTradeWriteContext)
  if (!context) throw new Error('useCopyTradeWrite must be used within CopyTradeWriteProvider')
  return context
}
