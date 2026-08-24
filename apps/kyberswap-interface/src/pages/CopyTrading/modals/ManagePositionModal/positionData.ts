import type { PendingSellObligation } from 'services/copyTrading/types/copyRuns'
import type { PositionActionKind, PositionSummary } from 'services/copyTrading/types/positions'
import type { PositionStatusFilter } from 'services/copyTrading/types/primitives'
import type { CopyAccountPositionsQuery, PendingSellObligationsQuery } from 'services/copyTrading/types/queries'
import type { CopyAccountPositionsResponse, PendingSellObligationsResponse } from 'services/copyTrading/types/responses'

const POSITIONS_PAGE_SIZE = 100

export const hasPositionAction = (position: PositionSummary, action: PositionActionKind) =>
  position.actionKind === action || position.availableActionKinds.includes(action)

export type PositionRecoveryContext = 'active' | 'leftover'

export const getPositionRecoveryAction = (position: PositionSummary, context: PositionRecoveryContext) => {
  const advertisedActions = [position.actionKind, ...position.availableActionKinds]
  if (context === 'leftover') {
    return advertisedActions.find(action => action === 'POSITION_ACTION_KIND_CLOSE_POSITION')
  }

  return advertisedActions.find(
    action => action === 'POSITION_ACTION_KIND_MANUAL_SELL' || action === 'POSITION_ACTION_KIND_CLOSE_POSITION',
  )
}

export const isValidWadRatio = (value?: string) => {
  if (!value || !/^\d+$/.test(value)) return false

  const ratio = BigInt(value)
  return ratio > 0n && ratio <= 10n ** 18n
}

export const isFullWadRatio = (value?: string) => value === (10n ** 18n).toString()

type GetCopyAccountPositions = (query: CopyAccountPositionsQuery) => {
  unwrap: () => Promise<CopyAccountPositionsResponse>
}

type CurrentPositionQuery = Pick<CopyAccountPositionsQuery, 'chainId' | 'copyAccount'> & {
  status?: PositionStatusFilter
  userPositionId: string
}

export const loadCurrentCopyAccountPosition = async (
  getCopyAccountPositions: GetCopyAccountPositions,
  { chainId, copyAccount, status, userPositionId }: CurrentPositionQuery,
) => {
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  while (true) {
    const response = await getCopyAccountPositions({
      chainId,
      copyAccount,
      cursor,
      limit: POSITIONS_PAGE_SIZE,
      ...(status ? { status } : {}),
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
