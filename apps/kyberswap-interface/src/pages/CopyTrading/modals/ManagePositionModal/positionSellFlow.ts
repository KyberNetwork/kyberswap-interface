import type { PositionActionKind, PositionSummary } from 'services/copyTrading/types/positions'
import type { PositionSellContext } from 'services/copyTrading/types/preparedActions'

import { APP_PATHS } from 'constants/index'

export type PositionRecoveryContext = 'active' | 'leftover'
export type ManagePositionFlow = 'manualSell' | 'activeClosePosition' | 'stoppedClosePosition'

export const POSITION_SELL_PREPARATION_CONFIG = {
  manualSell: {
    actionKind: 'POSITION_ACTION_KIND_MANUAL_SELL',
    callKinds: ['PREPARED_CALL_KIND_MANUAL_SELL'],
    preview: 'manualSell',
  },
  closePosition: {
    actionKind: 'POSITION_ACTION_KIND_CLOSE_POSITION',
    callKinds: ['PREPARED_CALL_KIND_CLOSE_POSITION'],
    preview: 'closePosition',
  },
} as const

type PositionSellPreparation = keyof typeof POSITION_SELL_PREPARATION_CONFIG

type PositionSellFlowConfig = {
  actionLabel: string
  destination: string
  destinationLabel: string
  positionContext: PositionRecoveryContext
  preparation: PositionSellPreparation
  requireFullSell?: true
  sellContext: PositionSellContext
  successTitle: string
}

const ACTIVE_RECOVERY_CONFIG = {
  destination: APP_PATHS.COPY_TRADING + '/my-copies',
  destinationLabel: 'My Copies',
  positionContext: 'active',
  sellContext: 'POSITION_SELL_CONTEXT_ALIGN_SKIP',
} as const

const CLOSE_POSITION_CONFIG = {
  actionLabel: 'Close Position',
  preparation: 'closePosition',
  successTitle: 'Position closed',
} as const

export const POSITION_SELL_FLOW_CONFIG: Record<ManagePositionFlow, PositionSellFlowConfig> = {
  manualSell: {
    ...ACTIVE_RECOVERY_CONFIG,
    actionLabel: 'Manual Sell',
    preparation: 'manualSell',
    successTitle: 'Manual sell completed',
  },
  activeClosePosition: {
    ...ACTIVE_RECOVERY_CONFIG,
    ...CLOSE_POSITION_CONFIG,
    requireFullSell: true,
  },
  stoppedClosePosition: {
    ...CLOSE_POSITION_CONFIG,
    destination: APP_PATHS.COPY_TRADING + '/history',
    destinationLabel: 'View History',
    positionContext: 'leftover',
    sellContext: 'POSITION_SELL_CONTEXT_STOP_COPY',
  },
}

export const hasPositionAction = (position: PositionSummary, action: PositionActionKind) =>
  position.actionKind === action || position.availableActionKinds.includes(action)

export const getPositionRecoveryAction = (position: PositionSummary, context: PositionRecoveryContext) => {
  const advertisedActions = [position.actionKind, ...position.availableActionKinds]
  if (context === 'leftover') {
    return advertisedActions.find(action => action === 'POSITION_ACTION_KIND_CLOSE_POSITION')
  }

  return advertisedActions.find(
    action => action === 'POSITION_ACTION_KIND_MANUAL_SELL' || action === 'POSITION_ACTION_KIND_CLOSE_POSITION',
  )
}

export const getPositionRecoveryFlow = (
  position: PositionSummary,
  context: PositionRecoveryContext,
): ManagePositionFlow | undefined => {
  const action = getPositionRecoveryAction(position, context)
  if (!action) return undefined
  if (context === 'leftover') return 'stoppedClosePosition'

  return action === 'POSITION_ACTION_KIND_CLOSE_POSITION' ? 'activeClosePosition' : 'manualSell'
}
