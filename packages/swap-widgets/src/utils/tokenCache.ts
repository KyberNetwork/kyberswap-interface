import { TokenInfo } from '../constants'

const CACHE_EXPIRY_MS = 5 * 60 * 1000
const CACHE_KEY_PREFIX = 'kyberswap_widgets_tokens_cache_v2_'

const memoryCache = new Map<string, { data: TokenInfo[]; timestamp: number }>()

const getCacheKey = (chainId: number) => `${CACHE_KEY_PREFIX}${chainId}`

export const getCachedTokens = (chainId: number): TokenInfo[] | null => {
  const cacheKey = getCacheKey(chainId)

  const memoryEntry = memoryCache.get(cacheKey)
  if (memoryEntry && Date.now() - memoryEntry.timestamp < CACHE_EXPIRY_MS) {
    return memoryEntry.data
  }

  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < CACHE_EXPIRY_MS) {
          memoryCache.set(cacheKey, { data, timestamp })
          return data
        } else {
          localStorage.removeItem(cacheKey)
        }
      }
    } catch (e) {
      // ignore corrupted cache
    }
  }

  return null
}

export const setCachedTokens = (chainId: number, tokens: TokenInfo[]) => {
  const cacheKey = getCacheKey(chainId)
  const cacheData = { data: tokens, timestamp: Date.now() }

  memoryCache.set(cacheKey, cacheData)

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(cacheData))
    } catch (e) {
      // ignore quota errors
    }
  }
}
