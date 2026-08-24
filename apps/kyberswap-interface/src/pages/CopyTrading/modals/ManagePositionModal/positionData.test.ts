import type { PendingSellObligation } from 'services/copyTrading/types/copyRuns'
import type { PositionSummary } from 'services/copyTrading/types/positions'
import type { PendingSellObligationsQuery } from 'services/copyTrading/types/queries'
import type { CopyAccountPositionsResponse, PendingSellObligationsResponse } from 'services/copyTrading/types/responses'
import { describe, expect, it, vi } from 'vitest'

import {
  getPositionRecoveryAction,
  isFullWadRatio,
  loadCurrentCopyAccountPosition,
  loadPendingSellObligations,
} from 'pages/CopyTrading/modals/ManagePositionModal/positionData'

const copyAccount = '0x1111111111111111111111111111111111111111'

const position = (userPositionId: string): PositionSummary =>
  ({
    userPositionId,
  } as PositionSummary)

const page = (
  data: PositionSummary[],
  pagination: CopyAccountPositionsResponse['pagination'],
): CopyAccountPositionsResponse => ({ data, pagination })

describe('loadCurrentCopyAccountPosition', () => {
  it('refreshes cursor pages until it finds the selected position', async () => {
    const getPositions = vi
      .fn()
      .mockReturnValueOnce({
        unwrap: () => Promise.resolve(page([position('other')], { hasMore: true, limit: 100, nextCursor: 'page-2' })),
      })
      .mockReturnValueOnce({
        unwrap: () => Promise.resolve(page([position('selected')], { hasMore: false, limit: 100 })),
      })

    await expect(
      loadCurrentCopyAccountPosition(getPositions, {
        chainId: 8453,
        copyAccount,
        userPositionId: 'selected',
      }),
    ).resolves.toMatchObject({ userPositionId: 'selected' })
    expect(getPositions).toHaveBeenNthCalledWith(2, {
      chainId: 8453,
      copyAccount,
      cursor: 'page-2',
      limit: 100,
    })
  })

  it('rejects an incomplete cursor chain instead of trusting a stale position snapshot', async () => {
    const getPositions = vi.fn().mockReturnValue({
      unwrap: () => Promise.resolve(page([], { hasMore: true, limit: 100, nextCursor: 'same-cursor' })),
    })

    await expect(
      loadCurrentCopyAccountPosition(getPositions, {
        chainId: 8453,
        copyAccount,
        userPositionId: 'selected',
      }),
    ).rejects.toThrow('invalid pagination cursor')
  })

  it('keeps the requested position view while following the cursor chain', async () => {
    const getPositions = vi.fn().mockReturnValue({
      unwrap: () => Promise.resolve(page([position('selected')], { hasMore: false, limit: 100 })),
    })

    await loadCurrentCopyAccountPosition(getPositions, {
      chainId: 8453,
      copyAccount,
      status: 'leftover',
      userPositionId: 'selected',
    })

    expect(getPositions).toHaveBeenCalledWith({
      chainId: 8453,
      copyAccount,
      cursor: undefined,
      limit: 100,
      status: 'leftover',
    })
  })
})

describe('getPositionRecoveryAction', () => {
  const recoveryPosition = (
    actionKind: PositionSummary['actionKind'],
    availableActionKinds: PositionSummary['availableActionKinds'] = [],
  ) => ({ actionKind, availableActionKinds } as PositionSummary)

  it('selects Manual Sell for an active partial Agent sell recovery', () => {
    expect(getPositionRecoveryAction(recoveryPosition('POSITION_ACTION_KIND_MANUAL_SELL'), 'active')).toBe(
      'POSITION_ACTION_KIND_MANUAL_SELL',
    )
  })

  it('selects the internal Close Position preparation for the active Manual Sell 100% case', () => {
    expect(getPositionRecoveryAction(recoveryPosition('POSITION_ACTION_KIND_CLOSE_POSITION'), 'active')).toBe(
      'POSITION_ACTION_KIND_CLOSE_POSITION',
    )
  })

  it('only exposes Close Position as a product flow for a stopped Copy leftover', () => {
    expect(
      getPositionRecoveryAction(
        recoveryPosition('POSITION_ACTION_KIND_MANUAL_SELL', ['POSITION_ACTION_KIND_CLOSE_POSITION']),
        'leftover',
      ),
    ).toBe('POSITION_ACTION_KIND_CLOSE_POSITION')
    expect(getPositionRecoveryAction(recoveryPosition('POSITION_ACTION_KIND_MANUAL_SELL'), 'leftover')).toBeUndefined()
  })
})

describe('isFullWadRatio', () => {
  it('accepts only an exact 100% WAD ratio', () => {
    expect(isFullWadRatio('1000000000000000000')).toBe(true)
    expect(isFullWadRatio('999999999999999999')).toBe(false)
    expect(isFullWadRatio(undefined)).toBe(false)
  })
})

const obligation = (leaderPositionEventId: string): PendingSellObligation => ({
  leaderPositionEventId,
  currentRatioRaw: '1000000000000000000',
})

const obligationPage = (
  data: PendingSellObligation[],
  pagination: PendingSellObligationsResponse['pagination'],
): PendingSellObligationsResponse => ({ data, pagination })

const obligationQuery = {
  chainId: 8453,
  copyAccount,
  userPositionId: 'selected',
}

describe('loadPendingSellObligations', () => {
  it('loads every FIFO cursor page in order', async () => {
    const getObligations = vi.fn((query: PendingSellObligationsQuery) => ({
      unwrap: async () =>
        query.cursor
          ? obligationPage([obligation('event-2')], { hasMore: false, limit: 100 })
          : obligationPage([obligation('event-1')], { hasMore: true, limit: 100, nextCursor: 'page-2' }),
    }))

    await expect(loadPendingSellObligations(getObligations, obligationQuery)).resolves.toEqual([
      obligation('event-1'),
      obligation('event-2'),
    ])
    expect(getObligations).toHaveBeenNthCalledWith(2, {
      ...obligationQuery,
      cursor: 'page-2',
      limit: 100,
    })
  })

  it('rejects a cursor cycle instead of looping forever', async () => {
    const getObligations = vi.fn((query: PendingSellObligationsQuery) => ({
      unwrap: async () =>
        obligationPage([], {
          hasMore: true,
          limit: 100,
          nextCursor: query.cursor === 'page-2' ? 'page-1' : query.cursor ? 'page-2' : 'page-1',
        }),
    }))

    await expect(loadPendingSellObligations(getObligations, obligationQuery)).rejects.toThrow(
      'invalid pagination cursor',
    )
  })
})
