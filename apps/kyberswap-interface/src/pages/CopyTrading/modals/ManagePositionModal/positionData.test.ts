import type { PendingSellObligation } from 'services/copyTrading/types/copyRuns'
import type { PendingSellObligationsQuery } from 'services/copyTrading/types/queries'
import type { PendingSellObligationsResponse } from 'services/copyTrading/types/responses'
import { describe, expect, it, vi } from 'vitest'

import { isFullWadRatio, loadPendingSellObligations } from 'pages/CopyTrading/modals/ManagePositionModal/positionData'

const copyAccount = '0x1111111111111111111111111111111111111111'

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
