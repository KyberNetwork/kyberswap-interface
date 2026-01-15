import { ParsedPosition } from 'pages/Earns/types'

const CACHE_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes
const CACHE_KEY_PREFIX = 'kyber_earn_unfinalized_positions'

const getCacheKey = (owner?: string) => {
  if (!owner) return CACHE_KEY_PREFIX
  return `${CACHE_KEY_PREFIX}_${owner.toLowerCase()}`
}

export const updateUnfinalizedPosition = (data: ParsedPosition, owner?: string) => {
  try {
    const cacheKey = getCacheKey(owner)
    const storedData = localStorage.getItem(cacheKey)
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

    // Remove expired positions (older than 5 minutes)
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

    localStorage.setItem(cacheKey, JSON.stringify(positions))
  } catch (error) {
    console.error('Failed to update unfinalized position:', error)
  }
}

export const getUnfinalizedPositions = (positionsFromData: ParsedPosition[], owner?: string): ParsedPosition[] => {
  try {
    const cacheKey = getCacheKey(owner)
    const storedData = localStorage.getItem(cacheKey)
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
    const validPositions = positions
      .filter(position => {
        const isExpired = now - position.createdTime > CACHE_EXPIRY_MS
        const existingPosition = positionsFromData.find(p => Number(p.tokenId) === Number(position.tokenId))
        const isValueDifferent = existingPosition
          ? Math.abs(existingPosition.totalProvidedValue - position.totalProvidedValue) /
              existingPosition.totalProvidedValue >
            0.01
          : position.isValueUpdating
          ? true
          : false
        const isDataUpdated = !position.isValueUpdating ? !!existingPosition : !isValueDifferent

        return !isExpired && !isDataUpdated
      })
      .map(position => {
        const existingPosition = positionsFromData.find(p => Number(p.tokenId) === Number(position.tokenId))

        if (existingPosition)
          return {
            ...existingPosition,
            token0: {
              ...existingPosition.token0,
              totalProvide: position.token0.totalProvide,
            },
            token1: {
              ...existingPosition.token1,
              totalProvide: position.token1.totalProvide,
            },
            totalValueTokens: existingPosition.totalValueTokens.map(token => ({
              ...token,
              amount: position.totalValueTokens.find(t => t.address === token.address)?.amount || token.amount,
            })),
            totalProvidedValue: position.totalProvidedValue,
            totalValue: position.totalValue,
            isValueUpdating: true,
          }

        return position
      })

    // If we filtered out some positions, update localStorage
    if (validPositions.length !== positions.length) {
      localStorage.setItem(cacheKey, JSON.stringify(validPositions))
    }

    return validPositions.reverse()
  } catch (error) {
    console.error('Failed to get unfinalized positions:', error)
    return []
  }
}
