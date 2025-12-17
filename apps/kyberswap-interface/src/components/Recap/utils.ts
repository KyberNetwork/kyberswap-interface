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
