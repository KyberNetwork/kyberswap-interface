import type { CopyAccountPositionsResponse, PositionSummary } from 'services/copyTrading/types'
import { describe, expect, it, vi } from 'vitest'

import { loadCurrentCopyAccountPosition } from 'pages/CopyTrading/modals/ManagePositionModal'

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
