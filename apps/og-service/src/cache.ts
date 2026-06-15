// In-process LRU cache for resolved tokens/pools and generated PNGs. Swap this module for a
// Redis-backed impl (same get/set surface) to share a cache across instances.
import { LRUCache } from 'lru-cache';

// lru-cache values must be non-nullable, but we negatively-cache resolution misses as `null`. Wrap
// every value in `{ v }` so the stored type is always an object, and `null` round-trips correctly.
const store = new LRUCache<string, { v: unknown }>({
  max: 5000,
  // Byte bound: cached 1200x630 PNG buffers would otherwise grow the heap unbounded — the `max` entry
  // count alone doesn't cap bytes. Buffers count their byte length; small wrapped values (resolved
  // tokens/pools, negative-cache nulls) count as 1. With maxSize set every entry must yield a size.
  maxSize: 256 * 1024 * 1024, // 256 MB
  sizeCalculation: ({ v }) => (Buffer.isBuffer(v) ? v.length : 1),
  // Default 1h; every set() passes an explicit ttl, so this is just a safety bound.
  ttl: 60 * 60 * 1000,
  // Lazy expiry only (checked on get). `ttlAutopurge` would schedule a setTimeout per entry, which
  // overflows for our 1-year image/font TTLs (> 2^31 ms) and spams TimeoutOverflowWarning. Stale entries
  // are dropped on access or evicted by capacity (entry count or bytes, whichever hits first).
  ttlAutopurge: false,
});

export const cache = {
  /** Returns the cached value, or `undefined` if missing/expired. A cached `null` (a negative hit
   *  used to dampen junk-id floods) round-trips as `null`, distinct from `undefined`. */
  get<T>(key: string): T | undefined {
    const hit = store.get(key);
    return hit === undefined ? undefined : (hit.v as T);
  },
  set(key: string, value: unknown, ttlMs: number): void {
    store.set(key, { v: value }, { ttl: ttlMs });
  },
};
