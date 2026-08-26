import type { PositionSummary } from 'services/copyTrading/types/positions'
import type { CopyRunPositionsQuery, CopyRunQuery } from 'services/copyTrading/types/queries'
import type { CopyRunPositionsResponse } from 'services/copyTrading/types/responses'

export const MAX_STOP_POSITIONS = 32
const POSITIONS_PAGE_SIZE = 100

export type SelectableStopCopyPosition = PositionSummary & { userPositionId: string }

export const hasUserPositionId = (position: PositionSummary): position is SelectableStopCopyPosition =>
  !!position.userPositionId

type GetCopyRunPositions = (query: CopyRunPositionsQuery) => {
  unwrap: () => Promise<CopyRunPositionsResponse>
}

export const loadAllOpenCopyRunPositions = async (getCopyRunPositions: GetCopyRunPositions, copyRun: CopyRunQuery) => {
  const allPositions: PositionSummary[] = []
  const seenPositionIds = new Set<string>()
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  while (true) {
    const response = await getCopyRunPositions({
      ...copyRun,
      status: 'open',
      cursor,
      limit: POSITIONS_PAGE_SIZE,
    }).unwrap()

    response.data.forEach(position => {
      const positionId = position.userPositionId || position.positionId
      if (!positionId || seenPositionIds.has(positionId)) return

      seenPositionIds.add(positionId)
      allPositions.push(position)
    })

    if (!response.pagination.hasMore) return allPositions

    const nextCursor = response.pagination.nextCursor
    if (!nextCursor || seenCursors.has(nextCursor)) {
      throw new Error('The positions response returned an invalid pagination cursor.')
    }

    seenCursors.add(nextCursor)
    cursor = nextCursor
  }
}

export const getSelectedStopCopyPositionIds = (
  positions: SelectableStopCopyPosition[],
  isSelected: (position: SelectableStopCopyPosition, index: number) => boolean,
) => {
  const positionIds = positions.filter(isSelected).map(position => position.userPositionId)

  if (positionIds.length > MAX_STOP_POSITIONS) {
    throw new Error('Select at most ' + MAX_STOP_POSITIONS + ' positions before continuing.')
  }

  return positionIds
}
