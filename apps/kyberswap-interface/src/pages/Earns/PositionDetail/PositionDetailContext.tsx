import { ShareOption } from '@kyber/ui'
import { createContext, useContext } from 'react'

import { CheckClosedPositionParams } from 'pages/Earns/hooks/useClosedPositions'
import { ZapMigrationInfo } from 'pages/Earns/hooks/useZapMigrationWidget'
import { ParsedPosition } from 'pages/Earns/types'

export type PositionDetailContextType = {
  position?: ParsedPosition
  initialLoading: boolean
  isNotAccountOwner: boolean
  positionOwnerAddress: string | null
  hasActiveSmartExitOrder: boolean
  aprInterval: '24h' | '7d'
  setAprInterval: (value: '24h' | '7d') => void
  isUnfinalized?: boolean
  isWaitingForRewards?: boolean
  loadingInterval: boolean

  // Handlers
  onOpenZapMigration: (props: ZapMigrationInfo) => void
  onRefreshPosition: (props: CheckClosedPositionParams) => void
  onReposition: (e: React.MouseEvent, position: ParsedPosition) => void
  handleFetchUnclaimedFee: () => void
  refetchPositions: () => void

  // Zap migration widget
  triggerClose: boolean
  setTriggerClose: (value: boolean) => void
  setReduceFetchInterval: (value: boolean) => void

  // Share
  shareBtn: (size?: number, defaultOptions?: ShareOption[]) => React.ReactNode
}

const PositionDetailContext = createContext<PositionDetailContextType | null>(null)

export const PositionDetailProvider = PositionDetailContext.Provider

export const usePositionDetailContext = () => {
  const context = useContext(PositionDetailContext)
  if (!context) {
    throw new Error('usePositionDetailContext must be used within PositionDetailProvider')
  }
  return context
}
