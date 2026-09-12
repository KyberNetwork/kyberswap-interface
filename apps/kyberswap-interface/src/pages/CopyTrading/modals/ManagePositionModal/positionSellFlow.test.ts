import type { PositionSummary } from 'services/copyTrading/types/positions'
import { describe, expect, it } from 'vitest'

import { getPositionRecoveryFlow } from 'pages/CopyTrading/modals/ManagePositionModal/positionSellFlow'

const position = {
  actionKind: 'POSITION_ACTION_KIND_MANUAL_SELL',
  availableActionKinds: ['POSITION_ACTION_KIND_MANUAL_SELL', 'POSITION_ACTION_KIND_CLOSE_POSITION'],
} as PositionSummary

describe('getPositionRecoveryFlow', () => {
  it('uses only the API-recommended action when multiple actions are advertised', () => {
    expect(getPositionRecoveryFlow(position, 'active')).toBe('manualSell')
    expect(getPositionRecoveryFlow({ ...position, actionKind: 'POSITION_ACTION_KIND_CLOSE_POSITION' }, 'active')).toBe(
      'activeClosePosition',
    )
  })

  it('falls back to the first advertised action when the API has no recommendation', () => {
    expect(
      getPositionRecoveryFlow(
        {
          ...position,
          actionKind: 'POSITION_ACTION_KIND_UNSPECIFIED',
          availableActionKinds: ['POSITION_ACTION_KIND_CLOSE_POSITION', 'POSITION_ACTION_KIND_MANUAL_SELL'],
        },
        'active',
      ),
    ).toBe('activeClosePosition')
  })

  it('uses the stopped-Copy close flow while the Copy Run is closing', () => {
    expect(getPositionRecoveryFlow({ ...position, actionKind: 'POSITION_ACTION_KIND_CLOSE_POSITION' }, 'closing')).toBe(
      'stopCopyClosePosition',
    )
  })
})
