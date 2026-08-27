/**
 * Which (chain, token) pairs currently have a mounted consumer, and when each was last fetched.
 *
 * Kept out of Redux deliberately: membership changes whenever a consumer mounts or rebuilds its
 * address list, which for the wallet and token-selector sorts is roughly every block, and each
 * dispatch would notify every `useAppSelector` in the app. Fetch bookkeeping lives here for the same
 * reason — it changes every sweep, and in Redux it would mint a new slice reference each tick even
 * when no price moved.
 */

/**
 * `live` — the default — re-fetches once past the TTL. `once` fetches when a consumer needs the
 * address and then leaves it alone while that consumer stays mounted, refreshing only when something
 * asks again after a gap (see REMOUNT_REFRESH_MS) or on an explicit `refetch()`. Drop to `once` for
 * consumers mounted per row of a list, where an open screen no longer means the user is watching.
 *
 * The tier decides who *drives* a refresh, not who reads the result — every consumer reads the same
 * slice entry, so a token kept fresh for one surface is fresh everywhere else too.
 */
export type RefreshTier = 'live' | 'once'

/**
 * How stale a price may be before a consumer arriving at an unwatched address re-fetches it, which is
 * what makes reopening a page show current numbers without polling in the background.
 *
 * A threshold is needed at all because an address set can be rebuilt on a per-block value: React runs
 * the old cleanup before the new effect, so the address briefly drops to no consumers.
 */
export const REMOUNT_REFRESH_MS = 30_000

export type RegistryCounts = { live: number; once: number }

export type RegistryMeta = {
  fetchedAt: number
  failures: number
  nextRetryAt: number
  /** Set by `expire()`; makes the next sweep pick this address up regardless of its TTL. */
  forced: boolean
}

/** chainId → lowercased address → refcount per tier. */
const registry = new Map<number, Map<string, RegistryCounts>>()
/** `${lowercasedAddress}_${chainId}` → fetch bookkeeping. */
const meta = new Map<string, RegistryMeta>()

export const metaKey = (chainId: number, address: string) => `${address}_${chainId}`

let version = 0
const listeners = new Set<() => void>()

const emit = () => {
  version += 1
  listeners.forEach(listener => listener())
}

export const subscribeRegistry = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const getRegistryVersion = () => version

export const register = (chainId: number, addresses: string[], tier: RefreshTier) => {
  if (!addresses.length) return
  let chainEntries = registry.get(chainId)
  if (!chainEntries) {
    chainEntries = new Map()
    registry.set(chainId, chainEntries)
  }
  const now = Date.now()
  addresses.forEach(address => {
    const counts = chainEntries.get(address)
    if (counts) {
      counts[tier] += 1
      return
    }

    chainEntries.set(address, { live: tier === 'live' ? 1 : 0, once: tier === 'once' ? 1 : 0 })
    // Nobody was watching this address, so its price is as old as whenever the last consumer left.
    const entry = meta.get(metaKey(chainId, address))
    if (entry && now - entry.fetchedAt >= REMOUNT_REFRESH_MS) entry.forced = true
  })
  emit()
}

export const unregister = (chainId: number, addresses: string[], tier: RefreshTier) => {
  if (!addresses.length) return
  const chainEntries = registry.get(chainId)
  if (!chainEntries) return
  addresses.forEach(address => {
    const counts = chainEntries.get(address)
    if (!counts) return
    counts[tier] = Math.max(0, counts[tier] - 1)
    // Registry only; the price and its `meta` stay. Closing a modal or changing route must not
    // discard prices the next screen is about to ask for again.
    if (!counts.live && !counts.once) chainEntries.delete(address)
  })
  if (!chainEntries.size) registry.delete(chainId)
  emit()
}

/** Backs `refetch()`: makes the given addresses due on the next sweep whatever their TTL says. */
export const expire = (chainId: number, addresses: string[]) => {
  if (!addresses.length) return
  addresses.forEach(address => {
    const entry = meta.get(metaKey(chainId, address))
    if (entry) entry.forced = true
  })
  emit()
}

export const readRegistry = () => registry

export const readMeta = (key: string) => meta.get(key)

export const markFetched = (key: string) => {
  meta.set(key, { fetchedAt: Date.now(), failures: 0, nextRetryAt: 0, forced: false })
}

/** Backoff per consecutive failure; the last entry is the ceiling, and retries never stop. */
const RETRY_BACKOFF_MS = [5_000, 15_000, 45_000]

export const markFailed = (key: string) => {
  const entry = meta.get(key)
  const failures = (entry?.failures ?? 0) + 1
  meta.set(key, {
    fetchedAt: entry?.fetchedAt ?? 0,
    failures,
    nextRetryAt: Date.now() + RETRY_BACKOFF_MS[Math.min(failures - 1, RETRY_BACKOFF_MS.length - 1)],
    forced: false,
  })
}

/** Whether anything could still become due, so an app showing only settled `once` data runs no timer. */
export const hasLiveOrPendingWork = () => {
  for (const [chainId, chainEntries] of registry) {
    for (const [address, counts] of chainEntries) {
      if (counts.live > 0) return true
      const entry = meta.get(metaKey(chainId, address))
      if (!entry) return true
      if (entry.forced) return true
      if (entry.failures > 0) return true
    }
  }
  return false
}

/** Test-only: drop all registrations and bookkeeping. */
export const resetRegistry = () => {
  registry.clear()
  meta.clear()
  version = 0
  listeners.clear()
}
