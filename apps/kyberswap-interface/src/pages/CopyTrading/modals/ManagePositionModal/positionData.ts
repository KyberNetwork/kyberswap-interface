import type { PendingSellObligation } from 'services/copyTrading/types/copyRuns'
import type { PositionActionKind, PositionSummary } from 'services/copyTrading/types/positions'
import type { CopyAccountPositionsQuery, PendingSellObligationsQuery } from 'services/copyTrading/types/queries'
import type { CopyAccountPositionsResponse, PendingSellObligationsResponse } from 'services/copyTrading/types/responses'

const POSITIONS_PAGE_SIZE = 200

export const hasPositionAction = (position: PositionSummary, action: PositionActionKind) =>
  position.actionKind === action || position.availableActionKinds.includes(action)

export const isValidWadRatio = (value?: string) => {
  if (!value || !/^\d+$/.test(value)) return false

  const ratio = BigInt(value)
  return ratio > 0n && ratio <= 10n ** 18n
}

type GetCopyAccountPositions = (query: CopyAccountPositionsQuery) => {
  unwrap: () => Promise<CopyAccountPositionsResponse>
}

type CurrentPositionQuery = Pick<CopyAccountPositionsQuery, 'chainId' | 'copyAccount'> & {
  userPositionId: string
}

export const loadCurrentCopyAccountPosition = async (
  getCopyAccountPositions: GetCopyAccountPositions,
  { chainId, copyAccount, userPositionId }: CurrentPositionQuery,
) => {
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  while (true) {
    const response = await getCopyAccountPositions({
      chainId,
      copyAccount,
      cursor,
      limit: POSITIONS_PAGE_SIZE,
    }).unwrap()
    const currentPosition = response.data.find(position => position.userPositionId === userPositionId)
    if (currentPosition) return currentPosition
    if (!response.pagination.hasMore) {
      throw new Error('The selected position is no longer available in this Smart Wallet.')
    }

    const nextCursor = response.pagination.nextCursor
    if (!nextCursor || seenCursors.has(nextCursor)) {
      throw new Error('The positions response returned an invalid pagination cursor.')
    }

    seenCursors.add(nextCursor)
    cursor = nextCursor
  }
}

type GetPendingSellObligations = (query: PendingSellObligationsQuery) => {
  unwrap: () => Promise<PendingSellObligationsResponse>
}

export const loadPendingSellObligations = async (
  getPendingSellObligations: GetPendingSellObligations,
  query: Pick<PendingSellObligationsQuery, 'chainId' | 'copyAccount' | 'userPositionId'>,
) => {
  const obligations: PendingSellObligation[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  while (true) {
    const response = await getPendingSellObligations({
      ...query,
      cursor,
      limit: POSITIONS_PAGE_SIZE,
    }).unwrap()
    obligations.push(...response.data)

    if (!response.pagination.hasMore) return obligations

    const nextCursor = response.pagination.nextCursor
    if (!nextCursor || seenCursors.has(nextCursor)) {
      throw new Error('The pending obligations response returned an invalid pagination cursor.')
    }

    seenCursors.add(nextCursor)
    cursor = nextCursor
  }
}
