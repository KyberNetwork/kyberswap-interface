import { type PropsWithChildren, createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { CopyRunListItem } from 'services/copyTrading/types/copyRuns'
import type { PositionSummary } from 'services/copyTrading/types/positions'

import { useActiveWeb3React } from 'hooks'
import AddCapitalModal from 'pages/CopyTrading/modals/AddCapitalModal'
import ManagePositionModal from 'pages/CopyTrading/modals/ManagePositionModal'
import type { ManagePositionFlow } from 'pages/CopyTrading/modals/ManagePositionModal/positionSellFlow'
import StartCopyModal from 'pages/CopyTrading/modals/StartCopyModal'
import type { StartCopyTarget } from 'pages/CopyTrading/modals/StartCopyModal/startCopy'
import StopCopyModal from 'pages/CopyTrading/modals/StopCopyModal'
import WithdrawModal from 'pages/CopyTrading/modals/WithdrawModal'

type ActiveModal =
  | { type: 'startCopy'; agent: StartCopyTarget }
  | { type: 'withdraw'; copyRun: CopyRunListItem }
  | { type: 'addCapital'; copyRun: CopyRunListItem }
  | { type: 'stopCopy'; copyRun: CopyRunListItem }
  | { type: 'managePosition'; position: PositionSummary; flow: ManagePositionFlow }

type CopyTradingModalContextValue = {
  openStartCopy: (agent: StartCopyTarget) => void
  openWithdraw: (copyRun: CopyRunListItem) => void
  openAddCapital: (copyRun: CopyRunListItem) => void
  openStopCopy: (copyRun: CopyRunListItem) => void
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
      openWithdraw: copyRun => setActive({ type: 'withdraw', copyRun }),
      openAddCapital: copyRun => setActive({ type: 'addCapital', copyRun }),
      openStopCopy: copyRun => setActive({ type: 'stopCopy', copyRun }),
      openManagePosition: (position, flow) => setActive({ type: 'managePosition', position, flow }),
    }),
    [],
  )

  const close = () => setActive(null)

  return (
    <CopyTradingModalContext.Provider value={value}>
      {children}
      {active?.type === 'startCopy' && <StartCopyModal isOpen onDismiss={close} agent={active.agent} />}
      {active?.type === 'withdraw' && <WithdrawModal isOpen onDismiss={close} copyRun={active.copyRun} />}
      {active?.type === 'addCapital' && <AddCapitalModal isOpen onDismiss={close} copyRun={active.copyRun} />}
      {active?.type === 'stopCopy' && <StopCopyModal isOpen onDismiss={close} copyRun={active.copyRun} />}
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
