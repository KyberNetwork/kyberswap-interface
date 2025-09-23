import { ChainId, Token } from '@kyber/schema';

// Cache configuration
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY_PREFIX = 'kyber_tokens_cache_';

// Memory cache to avoid localStorage access on every render
const memoryCache = new Map<string, { data: Token[]; timestamp: number }>();

// Helper functions for caching
const getCacheKey = (chainId: ChainId, additionalTokenAddresses?: string) => {
  return `${CACHE_KEY_PREFIX}${chainId}_${additionalTokenAddresses || 'none'}`;
};

export const getCachedTokens = (chainId: ChainId, additionalTokenAddresses?: string): Token[] | null => {
  const cacheKey = getCacheKey(chainId, additionalTokenAddresses);

  // Check memory cache first
  const memoryEntry = memoryCache.get(cacheKey);
  if (memoryEntry && Date.now() - memoryEntry.timestamp < CACHE_EXPIRY_MS) {
    return memoryEntry.data;
  }

  // Check localStorage if memory cache miss
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY_MS) {
          // Update memory cache
          memoryCache.set(cacheKey, { data, timestamp });
          return data;
        } else {
          // Expired, remove from localStorage
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (e) {
      console.error('Failed to parse cached tokens:', e);
    }
  }

  return null;
};

export const setCachedTokens = (chainId: ChainId, tokens: Token[], additionalTokenAddresses?: string) => {
  const cacheKey = getCacheKey(chainId, additionalTokenAddresses);
  const cacheData = { data: tokens, timestamp: Date.now() };

  // Update memory cache
  memoryCache.set(cacheKey, cacheData);

  // Update localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (e) {
      console.error('Failed to cache tokens:', e);
    }
  }
};

export const clearTokenCache = (chainId?: ChainId) => {
  if (chainId) {
    // Clear specific chain cache
    const pattern = `${CACHE_KEY_PREFIX}${chainId}_`;

    // Clear from memory cache
    for (const key of memoryCache.keys()) {
      if (key.startsWith(pattern)) {
        memoryCache.delete(key);
      }
    }

    // Clear from localStorage
    if (typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(pattern)) {
          localStorage.removeItem(key);
        }
      }
    }
  } else {
    // Clear all token cache
    memoryCache.clear();

    if (typeof window !== 'undefined') {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      }
    }
  }
};
