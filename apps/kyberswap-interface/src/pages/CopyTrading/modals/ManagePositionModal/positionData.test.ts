import type { PendingSellObligation } from 'services/copyTrading/types/copyRuns'
import type { PositionSummary } from 'services/copyTrading/types/positions'
import type { PendingSellObligationsQuery } from 'services/copyTrading/types/queries'
import type { CopyAccountPositionsResponse, PendingSellObligationsResponse } from 'services/copyTrading/types/responses'
import { describe, expect, it, vi } from 'vitest'

import {
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
        unwrap: () => Promise.resolve(page([position('other')], { hasMore: true, limit: 200, nextCursor: 'page-2' })),
      })
      .mockReturnValueOnce({
        unwrap: () => Promise.resolve(page([position('selected')], { hasMore: false, limit: 200 })),
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
      limit: 200,
    })
  })

  it('rejects an incomplete cursor chain instead of trusting a stale position snapshot', async () => {
    const getPositions = vi.fn().mockReturnValue({
      unwrap: () => Promise.resolve(page([], { hasMore: true, limit: 200, nextCursor: 'same-cursor' })),
    })

    await expect(
      loadCurrentCopyAccountPosition(getPositions, {
        chainId: 8453,
        copyAccount,
        userPositionId: 'selected',
      }),
    ).rejects.toThrow('invalid pagination cursor')
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
          ? obligationPage([obligation('event-2')], { hasMore: false, limit: 200 })
          : obligationPage([obligation('event-1')], { hasMore: true, limit: 200, nextCursor: 'page-2' }),
    }))

    await expect(loadPendingSellObligations(getObligations, obligationQuery)).resolves.toEqual([
      obligation('event-1'),
      obligation('event-2'),
    ])
    expect(getObligations).toHaveBeenNthCalledWith(2, {
      ...obligationQuery,
      cursor: 'page-2',
      limit: 200,
    })
  })

  it('rejects a cursor cycle instead of looping forever', async () => {
    const getObligations = vi.fn((query: PendingSellObligationsQuery) => ({
      unwrap: async () =>
        obligationPage([], {
          hasMore: true,
          limit: 200,
          nextCursor: query.cursor === 'page-2' ? 'page-1' : query.cursor ? 'page-2' : 'page-1',
        }),
    }))

    await expect(loadPendingSellObligations(getObligations, obligationQuery)).rejects.toThrow(
      'invalid pagination cursor',
    )
  })
})
