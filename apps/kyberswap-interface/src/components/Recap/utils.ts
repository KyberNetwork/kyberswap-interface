import badgeDiamond from 'assets/recap/badge-diamond.png'
import badgeMover from 'assets/recap/badge-mover.png'
import badgeWhale from 'assets/recap/badge-whale.png'

export const formatVolume = (volume: number): string => {
  if (volume >= 1e9) {
    return `$${(volume / 1e9).toFixed(2)}B`
  }
  if (volume >= 1e6) {
    return `$${(volume / 1e6).toFixed(2)}M`
  }
  if (volume >= 1e3) {
    return `$${(volume / 1e3).toFixed(2)}K`
  }
  return `$${volume.toFixed(2)}`
}

export const formatUsers = (users: number): string => {
  if (users >= 1e6) {
    return `${(users / 1e6).toFixed(1)}M`
  }
  if (users >= 1e3) {
    return `${(users / 1e3).toFixed(1)}K`
  }
  return users.toString()
}

export const formatTradingVolume = (volume: number): string => {
  if (volume >= 1e9) {
    return `$${(volume / 1e9).toFixed(2)}B`
  }
  if (volume >= 1e6) {
    return `$${(volume / 1e6).toFixed(2)}M`
  }
  if (volume >= 1e3) {
    return `$${(volume / 1e3).toFixed(2)}K`
  }
  return `$${volume.toLocaleString()}`
}

export const getBadgeImage = (top: number): string => {
  if (top >= 1 && top <= 5) {
    return badgeWhale
  }
  if (top >= 6 && top <= 20) {
    return badgeDiamond
  }
  return badgeMover
}

// Date constants for recap availability
const AUTO_OPEN_END_DATE = new Date('2026-01-03T23:59:59.999Z') // End of Jan 3, 2026 UTC
const RECAP_END_DATE = new Date('2026-01-10T23:59:59.999Z') // End of Jan 10, 2026 UTC

/**
 * Check if auto-open popup is still available (until Jan 3, 2026)
 */
export const isAutoOpenAvailable = (): boolean => {
  const now = new Date()
  return now <= AUTO_OPEN_END_DATE
}

/**
 * Check if recap feature is still available (until Jan 10, 2026)
 */
export const isRecapAvailable = (): boolean => {
  const now = new Date()
  return now <= RECAP_END_DATE
}
