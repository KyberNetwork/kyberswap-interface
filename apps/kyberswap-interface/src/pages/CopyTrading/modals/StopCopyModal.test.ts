import type { CopyRunPositionsQuery, CopyRunPositionsResponse, PositionSummary } from 'services/copyTrading/types'
import { describe, expect, it, vi } from 'vitest'

import { getSelectedStopCopyPositionIds, loadAllOpenCopyRunPositions } from './StopCopyModal'

const position = (id: string): PositionSummary =>
  ({
    positionId: id,
    userPositionId: id,
  } as PositionSummary)

const response = (
  data: PositionSummary[],
  pagination: CopyRunPositionsResponse['pagination'],
): CopyRunPositionsResponse => ({ data, pagination })

describe('Stop Copy position loading', () => {
  it('loads every cursor page and deduplicates positions', async () => {
    const getPositions = vi.fn((query: CopyRunPositionsQuery) => ({
      unwrap: async () =>
        query.cursor
          ? response([position('position-2'), position('position-3')], { hasMore: false, limit: 100 })
          : response([position('position-1'), position('position-2')], {
              hasMore: true,
              limit: 100,
              nextCursor: 'next-page',
            }),
    }))

    const positions = await loadAllOpenCopyRunPositions(getPositions, {
      ownerAddress: '0x1111111111111111111111111111111111111111',
      copyRunId: 'copy-run-1',
    })

    expect(positions.map(item => item.userPositionId)).toEqual(['position-1', 'position-2', 'position-3'])
    expect(getPositions).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ status: 'open', cursor: undefined, limit: 100 }),
    )
    expect(getPositions).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ status: 'open', cursor: 'next-page', limit: 100 }),
    )
  })

  it('fails closed when the cursor chain repeats', async () => {
    const getPositions = vi.fn((query: CopyRunPositionsQuery) => ({
      unwrap: async () =>
        response([position('position-1')], {
          hasMore: true,
          limit: 100,
          nextCursor: query.cursor === 'page-2' ? 'page-1' : query.cursor ? 'page-2' : 'page-1',
        }),
    }))

    await expect(
      loadAllOpenCopyRunPositions(getPositions, {
        ownerAddress: '0x1111111111111111111111111111111111111111',
        copyRunId: 'copy-run-1',
      }),
    ).rejects.toThrow('invalid pagination cursor')
  })
})

describe('Stop Copy position selection', () => {
  it('returns 32 selected position IDs', () => {
    const positions = Array.from({ length: 32 }, (_, index) => position(`position-${index}`))
    expect(getSelectedStopCopyPositionIds(positions, () => true)).toHaveLength(32)
  })

  it('rejects a payload containing more than 32 position IDs', () => {
    const positions = Array.from({ length: 33 }, (_, index) => position(`position-${index}`))
    expect(() => getSelectedStopCopyPositionIds(positions, () => true)).toThrow('Select at most 32 positions')
  })
})
