import type { PositionSummary } from 'services/copyTrading/types/positions'
import { describe, expect, it, vi } from 'vitest'

import {
  getPositionRecoveryFlow,
  retryPositionSell,
} from 'pages/CopyTrading/modals/ManagePositionModal/positionSellFlow'
import type { PreparedActionFlowState } from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'

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

describe('position sell retry', () => {
  const changedAction = {
    generationId: 'original',
    displayEnrichment: { status: 'ACTION_DISPLAY_ENRICHMENT_STATUS_NOT_APPLICABLE' as const },
    status: 'PREPARED_ACTION_STATUS_UNAVAILABLE' as const,
    reason: 'PREPARED_ACTION_REASON_SELL_OBLIGATION_CHANGED' as const,
  }

  it('resets to the form before reloading obligations without preparing or submitting', async () => {
    let state: PreparedActionFlowState = { phase: 'unavailable', action: changedAction }
    const reset = vi.fn(() => {
      state = { phase: 'idle' }
    })
    const reloadObligations = vi.fn(async () => {
      expect(state).toEqual({ phase: 'idle' })
    })
    const retry = vi.fn()

    await retryPositionSell({ state, reset, reloadObligations, retry })

    expect(state).toEqual({ phase: 'idle' })
    expect(reloadObligations).toHaveBeenCalledOnce()
    expect(retry).not.toHaveBeenCalled()
  })

  it('preserves status retry after submission even if the preparation reason changed', async () => {
    const reset = vi.fn()
    const reloadObligations = vi.fn()
    const retry = vi.fn()
    await retryPositionSell({ state: { phase: 'sync_error', action: changedAction }, reset, reloadObligations, retry })
    expect(retry).toHaveBeenCalledOnce()
    expect(reset).not.toHaveBeenCalled()
    expect(reloadObligations).not.toHaveBeenCalled()
  })

  it('keeps other unavailable reasons on the normal preparation path', async () => {
    const reset = vi.fn()
    const reloadObligations = vi.fn()
    const retry = vi.fn()
    await retryPositionSell({
      state: {
        phase: 'unavailable',
        action: { ...changedAction, reason: 'PREPARED_ACTION_REASON_NO_EXECUTABLE_ROUTE' },
      },
      reset,
      reloadObligations,
      retry,
    })
    expect(retry).toHaveBeenCalledOnce()
    expect(reloadObligations).not.toHaveBeenCalled()
  })
})
