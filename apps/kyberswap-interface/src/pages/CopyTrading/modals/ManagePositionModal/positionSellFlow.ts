import type { PositionActionKind, PositionSummary } from 'services/copyTrading/types/positions'
import type { PositionSellContext } from 'services/copyTrading/types/preparedActions'
import type { CopyRunStatus } from 'services/copyTrading/types/primitives'

import { APP_PATHS } from 'constants/index'

export type ManagePositionFlow = 'manualSell' | 'activeClosePosition' | 'stopCopyClosePosition'

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
  preparation: PositionSellPreparation
  requireFullSell?: true
  sellContext: PositionSellContext
  successTitle: string
}

const ACTIVE_RECOVERY_CONFIG = {
  destination: APP_PATHS.COPY_TRADING + '/my-copies',
  destinationLabel: 'My Copies',
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
  stopCopyClosePosition: {
    ...CLOSE_POSITION_CONFIG,
    destination: APP_PATHS.COPY_TRADING + '/history',
    destinationLabel: 'View History',
    sellContext: 'POSITION_SELL_CONTEXT_STOP_COPY',
  },
}

export const hasPositionAction = (position: PositionSummary, action: PositionActionKind) =>
  position.actionKind === action || position.availableActionKinds.includes(action)

const POSITION_RECOVERY_FLOW_BY_ACTION: Partial<
  Record<PositionActionKind, (copyRunStatus: CopyRunStatus) => ManagePositionFlow>
> = {
  POSITION_ACTION_KIND_MANUAL_SELL: () => 'manualSell',
  POSITION_ACTION_KIND_CLOSE_POSITION: copyRunStatus =>
    copyRunStatus === 'closing' ? 'stopCopyClosePosition' : 'activeClosePosition',
}

export const getPositionRecoveryAction = (position: PositionSummary) =>
  position.actionKind && position.actionKind !== 'POSITION_ACTION_KIND_UNSPECIFIED'
    ? position.actionKind
    : position.availableActionKinds[0]

export const getPositionRecoveryFlow = (
  position: PositionSummary,
  copyRunStatus: CopyRunStatus,
): ManagePositionFlow | undefined => {
  const action = getPositionRecoveryAction(position)
  return action ? POSITION_RECOVERY_FLOW_BY_ACTION[action]?.(copyRunStatus) : undefined
}
