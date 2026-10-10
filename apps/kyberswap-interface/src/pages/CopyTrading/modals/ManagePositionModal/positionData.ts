import type { PendingSellObligation } from 'services/copyTrading/types/copyRuns'
import type { PendingSellObligationsQuery } from 'services/copyTrading/types/queries'
import type { PendingSellObligationsResponse } from 'services/copyTrading/types/responses'

const POSITIONS_PAGE_SIZE = 100

export const isValidWadRatio = (value?: string) => {
  if (!value || !/^\d+$/.test(value)) return false

  const ratio = BigInt(value)
  return ratio > 0n && ratio <= 10n ** 18n
}

export const isFullWadRatio = (value?: string) => value === (10n ** 18n).toString()

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
