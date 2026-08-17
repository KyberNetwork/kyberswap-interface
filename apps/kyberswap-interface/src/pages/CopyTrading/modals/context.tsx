import { type PropsWithChildren, createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { AdvisoryActionAvailability } from 'services/copyTrading/types/actionAvailability'
import type { CopyRunSummary } from 'services/copyTrading/types/copyRuns'
import type { PositionSummary } from 'services/copyTrading/types/positions'

import { useActiveWeb3React } from 'hooks'
import AddCapitalModal from 'pages/CopyTrading/modals/AddCapitalModal'
import ManagePositionModal, { type ManagePositionMode } from 'pages/CopyTrading/modals/ManagePositionModal'
import StartCopyModal from 'pages/CopyTrading/modals/StartCopyModal'
import type { StartCopyTarget } from 'pages/CopyTrading/modals/StartCopyModal/startCopy'
import StopCopyModal from 'pages/CopyTrading/modals/StopCopyModal'
import WithdrawQuoteModal from 'pages/CopyTrading/modals/WithdrawQuoteModal'

type ActiveModal =
  | { type: 'startCopy'; agent: StartCopyTarget }
  | { type: 'addCapital'; copyRun: CopyRunSummary; agentName?: string }
  | { type: 'stopCopy'; copyRun: CopyRunSummary; agentName?: string }
  | { type: 'withdrawQuote'; copyRun: CopyRunSummary; withdrawQuoteAvailability?: AdvisoryActionAvailability }
  | { type: 'managePosition'; position: PositionSummary; mode: ManagePositionMode }

type CopyTradingModalContextValue = {
  openStartCopy: (agent: StartCopyTarget) => void
  openAddCapital: (copyRun: CopyRunSummary, agentName?: string) => void
  openStopCopy: (copyRun: CopyRunSummary, agentName?: string) => void
  openWithdrawQuote: (copyRun: CopyRunSummary, availability?: AdvisoryActionAvailability) => void
  openManagePosition: (position: PositionSummary, mode: ManagePositionMode) => void
}

const CopyTradingModalContext = createContext<CopyTradingModalContextValue | undefined>(undefined)

export const CopyTradingModalProvider = ({ children }: PropsWithChildren) => {
  const { account } = useActiveWeb3React()
  const [active, setActive] = useState<ActiveModal | null>(null)
  const previousAccount = useRef(account)

  useEffect(() => {
    if (active && previousAccount.current && previousAccount.current !== account) {
      setActive(null)
    }

    previousAccount.current = account
  }, [account, active])

  const value = useMemo<CopyTradingModalContextValue>(
    () => ({
      openStartCopy: agent => setActive({ type: 'startCopy', agent }),
      openAddCapital: (copyRun, agentName) => setActive({ type: 'addCapital', copyRun, agentName }),
      openStopCopy: (copyRun, agentName) => setActive({ type: 'stopCopy', copyRun, agentName }),
      openWithdrawQuote: (copyRun, withdrawQuoteAvailability) =>
        setActive({ type: 'withdrawQuote', copyRun, withdrawQuoteAvailability }),
      openManagePosition: (position, mode) => setActive({ type: 'managePosition', position, mode }),
    }),
    [],
  )

  const close = () => setActive(null)

  return (
    <CopyTradingModalContext.Provider value={value}>
      {children}
      {active?.type === 'startCopy' && <StartCopyModal isOpen onDismiss={close} agent={active.agent} />}
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
    </CopyTradingModalContext.Provider>
  )
}

export const useCopyTradingModal = () => {
  const context = useContext(CopyTradingModalContext)
  if (!context) throw new Error('useCopyTradingModal must be used within CopyTradingModalProvider')
  return context
}
