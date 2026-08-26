import { type PropsWithChildren, createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { AdvisoryActionAvailability } from 'services/copyTrading/types/actionAvailability'
import type { CopyRunSummary } from 'services/copyTrading/types/copyRuns'
import type { PositionSummary } from 'services/copyTrading/types/positions'

import { useActiveWeb3React } from 'hooks'
import AddCapitalModal from 'pages/CopyTrading/modals/AddCapitalModal'
import ManagePositionModal, { type ManagePositionFlow } from 'pages/CopyTrading/modals/ManagePositionModal'
import StartCopyModal from 'pages/CopyTrading/modals/StartCopyModal'
import type { StartCopyTarget } from 'pages/CopyTrading/modals/StartCopyModal/startCopy'
import StopCopyModal from 'pages/CopyTrading/modals/StopCopyModal'
import WithdrawQuoteModal from 'pages/CopyTrading/modals/WithdrawQuoteModal'

type ActiveModal =
  | { type: 'startCopy'; agent: StartCopyTarget }
  | { type: 'addCapital'; copyRun: CopyRunSummary }
  | { type: 'stopCopy'; copyRun: CopyRunSummary }
  | { type: 'withdrawQuote'; copyRun: CopyRunSummary; withdrawQuoteAvailability?: AdvisoryActionAvailability }
  | { type: 'managePosition'; position: PositionSummary; flow: ManagePositionFlow }

type CopyTradingModalContextValue = {
  openStartCopy: (agent: StartCopyTarget) => void
  openAddCapital: (copyRun: CopyRunSummary) => void
  openStopCopy: (copyRun: CopyRunSummary) => void
  openWithdrawQuote: (copyRun: CopyRunSummary, availability?: AdvisoryActionAvailability) => void
  openManagePosition: (position: PositionSummary, flow: ManagePositionFlow) => void
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
      openAddCapital: copyRun => setActive({ type: 'addCapital', copyRun }),
      openStopCopy: copyRun => setActive({ type: 'stopCopy', copyRun }),
      openWithdrawQuote: (copyRun, withdrawQuoteAvailability) =>
        setActive({ type: 'withdrawQuote', copyRun, withdrawQuoteAvailability }),
      openManagePosition: (position, flow) => setActive({ type: 'managePosition', position, flow }),
    }),
    [],
  )

  const close = () => setActive(null)

  return (
    <CopyTradingModalContext.Provider value={value}>
      {children}
      {active?.type === 'startCopy' && <StartCopyModal isOpen onDismiss={close} agent={active.agent} />}
      {active?.type === 'addCapital' && <AddCapitalModal isOpen onDismiss={close} copyRun={active.copyRun} />}
      {active?.type === 'stopCopy' && <StopCopyModal isOpen onDismiss={close} copyRun={active.copyRun} />}
      {active?.type === 'withdrawQuote' && (
        <WithdrawQuoteModal
          isOpen
          onDismiss={close}
          copyRun={active.copyRun}
          withdrawQuoteAvailability={active.withdrawQuoteAvailability}
        />
      )}
      {active?.type === 'managePosition' && (
        <ManagePositionModal isOpen onDismiss={close} position={active.position} flow={active.flow} />
      )}
    </CopyTradingModalContext.Provider>
  )
}

export const useCopyTradingModal = () => {
  const context = useContext(CopyTradingModalContext)
  if (!context) throw new Error('useCopyTradingModal must be used within CopyTradingModalProvider')
  return context
}
