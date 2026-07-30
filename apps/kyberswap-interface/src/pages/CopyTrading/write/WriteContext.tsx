import { type PropsWithChildren, createContext, useContext, useMemo, useState } from 'react'
import type { CopyRunSummary, PositionSummary } from 'services/copyTrading/types'

import AddCapitalModal from 'pages/CopyTrading/modals/AddCapitalModal'
import ManagePositionModal, { type ManagePositionMode } from 'pages/CopyTrading/modals/ManagePositionModal'
import StopCopyModal from 'pages/CopyTrading/modals/StopCopyModal'
import SubscribeModal, { type SubscribeTarget } from 'pages/CopyTrading/modals/SubscribeModal'

type ActiveModal =
  | { type: 'subscribe'; target: SubscribeTarget }
  | { type: 'addCapital'; run: CopyRunSummary; agentName?: string }
  | { type: 'stopCopy'; run: CopyRunSummary; agentName?: string }
  | { type: 'managePosition'; position: PositionSummary; mode: ManagePositionMode }

type CopyTradeWriteContextValue = {
  openSubscribe: (target: SubscribeTarget) => void
  openAddCapital: (run: CopyRunSummary, agentName?: string) => void
  openStopCopy: (run: CopyRunSummary, agentName?: string) => void
  openManagePosition: (position: PositionSummary, mode: ManagePositionMode) => void
}

const CopyTradeWriteContext = createContext<CopyTradeWriteContextValue | undefined>(undefined)

export const CopyTradeWriteProvider = ({ children }: PropsWithChildren) => {
  const [active, setActive] = useState<ActiveModal | null>(null)

  const value = useMemo<CopyTradeWriteContextValue>(
    () => ({
      openSubscribe: target => setActive({ type: 'subscribe', target }),
      openAddCapital: (run, agentName) => setActive({ type: 'addCapital', run, agentName }),
      openStopCopy: (run, agentName) => setActive({ type: 'stopCopy', run, agentName }),
      openManagePosition: (position, mode) => setActive({ type: 'managePosition', position, mode }),
    }),
    [],
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
