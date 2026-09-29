import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'

import { ParsedPosition } from 'pages/Earns/types'
import {
  UNFINALIZED_POSITION_TTL_MS,
  UnfinalizedPositionRecord,
  getUnfinalizedPositionRecords,
  pruneUnfinalizedPositions,
  removeUnfinalizedPositions,
  resolveUnfinalizedPositions,
  subscribeUnfinalizedPositions,
} from 'pages/Earns/utils/unfinalizedPosition'

const EMPTY_POSITIONS: readonly ParsedPosition[] = []
const EMPTY_RECORDS: readonly UnfinalizedPositionRecord[] = []
const getServerSnapshot = () => EMPTY_RECORDS

/**
 * Projects the unfinalized-position cache against the indexed positions and keeps the cache pruned.
 * Subscribing rather than reading once is what makes a zap that finishes writing after this screen mounted
 * — the common case, since resolving the minted NFT id needs a receipt — show up without waiting for the
 * next positions poll. Pruning runs in effects, never during render.
 */
const useUnfinalizedPositions = ({
  owner,
  positions = EMPTY_POSITIONS,
}: {
  owner?: string
  positions?: readonly ParsedPosition[]
}) => {
  const getSnapshot = useCallback(() => getUnfinalizedPositionRecords(owner), [owner])
  const records = useSyncExternalStore(subscribeUnfinalizedPositions, getSnapshot, getServerSnapshot)

  const { placeholders, placeholderByKey, valueUpdatingKeys, staleKeys } = useMemo(
    () => resolveUnfinalizedPositions({ records, positions, now: Date.now() }),
    [positions, records],
  )

  useEffect(() => {
    if (!staleKeys.length) return
    removeUnfinalizedPositions(staleKeys, owner)
  }, [owner, staleKeys])

  // Clears entries that aged out while this screen was closed, plus any superseded cache.
  useEffect(() => {
    pruneUnfinalizedPositions(owner)
  }, [owner])

  // Re-runs the projection the moment the oldest entry ages out, so a placeholder cannot outlive its TTL on
  // a screen that receives no other update.
  useEffect(() => {
    if (!records.length) return
    const expiresAt = Math.min(...records.map(record => record.cachedAt + UNFINALIZED_POSITION_TTL_MS))
    const timer = setTimeout(() => pruneUnfinalizedPositions(owner), Math.max(expiresAt - Date.now(), 0) + 50)
    return () => clearTimeout(timer)
  }, [owner, records])

  return { placeholders, placeholderByKey, valueUpdatingKeys }
}

export default useUnfinalizedPositions
