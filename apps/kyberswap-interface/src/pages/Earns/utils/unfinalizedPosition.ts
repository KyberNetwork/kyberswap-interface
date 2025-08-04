import { ParsedPosition } from 'pages/Earns/types'

const CACHE_EXPIRY_MS = 2 * 60 * 1000 // 2 minutes
const CACHE_KEY = 'kyber_earn_unfinalized_positions'

export const updateUnfinalizedPosition = (data: ParsedPosition) => {
  try {
    const storedData = localStorage.getItem(CACHE_KEY)
    let positions: ParsedPosition[] = []

    if (storedData) {
      try {
        positions = JSON.parse(storedData)
        if (!Array.isArray(positions)) {
          positions = []
        }
      } catch (error) {
        console.warn('Failed to parse stored unfinalized positions:', error)
        positions = []
      }
    }

    const now = Date.now()

    // Remove expired positions (older than 2 minutes)
    positions = positions.filter(position => {
      const isExpired = now - position.createdTime > CACHE_EXPIRY_MS
      return !isExpired
    })

    // Check if position already exists (by txHash)
    const existingIndex = positions.findIndex(pos => pos.txHash === data.txHash)

    if (existingIndex >= 0) {
      positions[existingIndex] = data
    } else {
      positions.push(data)
    }

    localStorage.setItem(CACHE_KEY, JSON.stringify(positions))
  } catch (error) {
    console.error('Failed to update unfinalized position:', error)
  }
}

export const getUnfinalizedPositions = (finalizedNftIds: string[]): ParsedPosition[] => {
  try {
    const storedData = localStorage.getItem(CACHE_KEY)
    if (!storedData) {
      return []
    }

    let positions: ParsedPosition[] = []
    try {
      positions = JSON.parse(storedData)
      if (!Array.isArray(positions)) {
        return []
      }
    } catch (error) {
      console.warn('Failed to parse stored unfinalized positions:', error)
      return []
    }

    const now = Date.now()

    // Filter out expired positions
    const validPositions = positions.filter(position => {
      const isExpired = now - position.createdTime > CACHE_EXPIRY_MS
      return !isExpired && !finalizedNftIds.includes(position.tokenId)
    })

    // If we filtered out some positions, update localStorage
    if (validPositions.length !== positions.length) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(validPositions))
    }

    return validPositions.reverse()
  } catch (error) {
    console.error('Failed to get unfinalized positions:', error)
    return []
  }
}
