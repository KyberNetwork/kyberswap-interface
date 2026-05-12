import { ChainId } from '@kyberswap/ks-sdk-core'

// Ronin network scheduled maintenance window.
// 2026-05-12 22:00 (UTC+7, VN time) → 2026-05-13 08:00 (UTC+7) — ~10 hours.
export const RONIN_MAINTENANCE_START_MS = Date.UTC(2026, 4, 12, 15, 0, 0)
export const RONIN_MAINTENANCE_END_MS = Date.UTC(2026, 4, 13, 1, 0, 0)

export const RONIN_MAINTENANCE_MESSAGE =
  'Ronin Network is currently undergoing maintenance (est. 10 hours). Trades on Ronin are temporarily unavailable during this time.'

export const isRoninMaintenanceActive = (chainId: number | undefined): boolean => {
  if (chainId !== ChainId.RONIN) return false
  const now = Date.now()
  return now >= RONIN_MAINTENANCE_START_MS && now < RONIN_MAINTENANCE_END_MS
}
