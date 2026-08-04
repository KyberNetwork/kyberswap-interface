import { useQueryClient } from '@tanstack/react-query'
import { type PropsWithChildren, createContext, useCallback, useContext, useMemo, useState } from 'react'
import copyTradingApi from 'services/copyTrading'
import type { Address, CopyRunSummary, PositionSummary } from 'services/copyTrading/types'

import AddCapitalModal from 'pages/CopyTrading/modals/AddCapitalModal'
import ManagePositionModal, { type ManagePositionMode } from 'pages/CopyTrading/modals/ManagePositionModal'
import StopCopyModal from 'pages/CopyTrading/modals/StopCopyModal'
import SubscribeModal, { type SubscribeTarget } from 'pages/CopyTrading/modals/SubscribeModal'
import WithdrawQuoteModal from 'pages/CopyTrading/modals/WithdrawQuoteModal'
import { useCopyTradingWalletSession } from 'pages/CopyTrading/write/usePreparedAction'
import { useAppDispatch } from 'state/hooks'

type ActiveModal =
  | { type: 'subscribe'; target: SubscribeTarget }
  | { type: 'addCapital'; run: CopyRunSummary; agentName?: string }
  | { type: 'stopCopy'; run: CopyRunSummary; agentName?: string }
  | { type: 'withdrawQuote'; run: CopyRunSummary }
  | { type: 'managePosition'; position: PositionSummary; mode: ManagePositionMode }

type WithWalletSession = <T>(
  ownerAddress: Address,
  chainId: number,
  request: (accessToken: string) => Promise<T>,
) => Promise<T>

type CopyTradeWriteContextValue = {
  openSubscribe: (target: SubscribeTarget) => void
  openAddCapital: (run: CopyRunSummary, agentName?: string) => void
  openStopCopy: (run: CopyRunSummary, agentName?: string) => void
  openWithdrawQuote: (run: CopyRunSummary) => void
  openManagePosition: (position: PositionSummary, mode: ManagePositionMode) => void
  refreshCopyTrading: () => Promise<void>
  withWalletSession: WithWalletSession
}

const CopyTradeWriteContext = createContext<CopyTradeWriteContextValue | undefined>(undefined)

export const CopyTradeWriteProvider = ({ children }: PropsWithChildren) => {
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()
  const [active, setActive] = useState<ActiveModal | null>(null)
  const { withAccessToken } = useCopyTradingWalletSession()

  const refreshCopyTrading = useCallback(async () => {
    dispatch(copyTradingApi.util.invalidateTags(['CopyTrading']))
    await queryClient.invalidateQueries({ queryKey: ['copy-trading'] })
  }, [dispatch, queryClient])

  const value = useMemo<CopyTradeWriteContextValue>(
    () => ({
      openSubscribe: target => setActive({ type: 'subscribe', target }),
      openAddCapital: (run, agentName) => setActive({ type: 'addCapital', run, agentName }),
      openStopCopy: (run, agentName) => setActive({ type: 'stopCopy', run, agentName }),
      openWithdrawQuote: run => setActive({ type: 'withdrawQuote', run }),
      openManagePosition: (position, mode) => setActive({ type: 'managePosition', position, mode }),
      refreshCopyTrading,
      withWalletSession: withAccessToken,
    }),
    [refreshCopyTrading, withAccessToken],
  )

  const close = () => setActive(null)

  return (
    <CopyTradeWriteContext.Provider value={value}>
      {children}
      {active?.type === 'subscribe' && <SubscribeModal isOpen onDismiss={close} target={active.target} />}
      {active?.type === 'addCapital' && (
        <AddCapitalModal isOpen onDismiss={close} run={active.run} agentName={active.agentName} />
      )}
      {active?.type === 'stopCopy' && (
        <StopCopyModal isOpen onDismiss={close} run={active.run} agentName={active.agentName} />
      )}
      {active?.type === 'withdrawQuote' && <WithdrawQuoteModal isOpen onDismiss={close} run={active.run} />}
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
