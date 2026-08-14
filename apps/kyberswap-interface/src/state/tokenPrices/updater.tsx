import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'
import { useStore } from 'react-redux'
import { TokenPricesBody, fetchTokenPrices, getMidPrice } from 'services/tokenCatalog'

import useIsWindowVisible from 'hooks/useIsWindowVisible'
import { AppState } from 'state'
import { useAppDispatch } from 'state/hooks'
import { UpdatePricesPayload, updatePrices } from 'state/tokenPrices'
import {
  getRegistryVersion,
  hasLiveOrPendingWork,
  markFailed,
  markFetched,
  metaKey,
  readMeta,
  readRegistry,
  subscribeRegistry,
} from 'state/tokenPrices/registry'
import { diffPayload, packBodies, selectDue } from 'state/tokenPrices/sweep'

/** Tick granularity for noticing a `live` address has passed its TTL — not the TTL itself. */
const SWEEP_INTERVAL_MS = 5_000
/** Trailing debounce on registry changes, so a burst of mounts becomes one request. */
const COALESCE_MS = 50
const MAX_PARALLEL = 4
const DEV_LIVE_UNION_WARN = 50
/**
 * `fetch` has no timeout of its own, and every trigger funnels through one in-flight guard — so an
 * unbounded request would wedge price fetching for the whole app until the socket gave up.
 */
const REQUEST_TIMEOUT_MS = 10_000

/** Abort signal that fires on the updater unmounting or on this request outliving its budget. */
const withTimeout = (lifetime: AbortSignal | undefined) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const onLifetimeAbort = () => controller.abort()
  lifetime?.addEventListener('abort', onLifetimeAbort)

  return {
    signal: controller.signal,
    dispose: () => {
      clearTimeout(timer)
      lifetime?.removeEventListener('abort', onLifetimeAbort)
    },
  }
}

/**
 * Owns every request to the prices endpoint. Consumers only subscribe (see ./registry); this decides
 * what to fetch and when, which is what keeps one canonical price per token instead of each consumer
 * racing to define its own.
 */
export default function Updater(): null {
  const dispatch = useAppDispatch()
  const store = useStore<AppState>()
  const windowVisible = useIsWindowVisible()

  // Read the registry through useSyncExternalStore rather than state so a burst of mounts coalesces
  // into a single sweep instead of one render each.
  const registryVersion = useSyncExternalStore(subscribeRegistry, getRegistryVersion, getRegistryVersion)

  const visibleRef = useRef(windowVisible)
  visibleRef.current = windowVisible

  const sweepInFlightRef = useRef(false)
  const sweepQueuedRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)

  const runSweep = useCallback(async () => {
    if (sweepInFlightRef.current) {
      sweepQueuedRef.current = true
      return
    }

    const bodies = packBodies(selectDue(readRegistry(), readMeta, Date.now(), visibleRef.current))
    if (!bodies.length) return

    sweepInFlightRef.current = true
    const lifetimeSignal = abortRef.current?.signal

    try {
      const payload: UpdatePricesPayload = {}
      const current = store.getState().tokenPrices

      const applyResponse = (body: TokenPricesBody, response: Awaited<ReturnType<typeof fetchTokenPrices>>) => {
        Object.entries(body).forEach(([chainKey, requested]) => {
          const chainId = Number(chainKey)
          // The API may echo checksummed addresses; index by lowercase to match what we requested.
          const returned = response?.data?.[chainKey] || {}
          const byLowercase = Object.entries(returned).reduce<typeof returned>((acc, [address, entry]) => {
            acc[address.toLowerCase()] = entry
            return acc
          }, {})

          requested.forEach(address => {
            // Write a terminal value for every requested address, not just the returned ones — that
            // is what lets `loading` fall false for a token the price service simply omits.
            ;(payload[chainId] ||= {})[address] = getMidPrice(byLowercase[address])
            markFetched(metaKey(chainId, address))
          })
        })
      }

      const failBody = (body: TokenPricesBody) => {
        Object.entries(body).forEach(([chainKey, requested]) => {
          const chainId = Number(chainKey)
          requested.forEach(address => {
            markFailed(metaKey(chainId, address))
            // Stale-while-revalidate: only fill a hole, never downgrade a good price to null.
            if (current[chainId]?.[address] === undefined) (payload[chainId] ||= {})[address] = null
          })
        })
      }

      const request = async (body: TokenPricesBody) => {
        const { signal, dispose } = withTimeout(lifetimeSignal)
        try {
          return await fetchTokenPrices(body, { signal })
        } finally {
          dispose()
        }
      }

      const runBody = async (body: TokenPricesBody) => {
        try {
          applyResponse(body, await request(body))
        } catch {
          // Retry each chain on its own so one malformed chain cannot poison the others in the batch.
          const chainKeys = Object.keys(body)
          if (chainKeys.length > 1) {
            await Promise.all(
              chainKeys.map(async chainKey => {
                const single: TokenPricesBody = { [chainKey]: body[chainKey] }
                try {
                  applyResponse(single, await request(single))
                } catch {
                  failBody(single)
                }
              }),
            )
          } else {
            failBody(body)
          }
        }
      }

      for (let i = 0; i < bodies.length; i += MAX_PARALLEL) {
        await Promise.all(bodies.slice(i, i + MAX_PARALLEL).map(runBody))
      }

      const changed = diffPayload(current, payload)
      if (Object.keys(changed).length) dispatch(updatePrices(changed))
    } finally {
      sweepInFlightRef.current = false
      if (sweepQueuedRef.current) {
        sweepQueuedRef.current = false
        void runSweep()
      }
    }
  }, [dispatch, store])

  useEffect(() => {
    const controller = new AbortController()
    abortRef.current = controller
    // Aborted only on unmount: a response for addresses that just unsubscribed is still worth
    // storing, and modals remount within milliseconds.
    return () => controller.abort()
  }, [])

  // A newly mounted consumer gets its price about a frame later instead of waiting for the next tick,
  // and a StrictMode or route-transition mount flap collapses into one request.
  useEffect(() => {
    const timer = setTimeout(() => void runSweep(), COALESCE_MS)
    return () => clearTimeout(timer)
  }, [registryVersion, runSweep])

  // Only runs while something could actually become due, so an idle app polls nothing at all.
  useEffect(() => {
    if (!hasLiveOrPendingWork()) return
    const interval = setInterval(() => void runSweep(), SWEEP_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [registryVersion, runSweep])

  useEffect(() => {
    if (windowVisible) void runSweep()
  }, [windowVisible, runSweep])

  useEffect(() => {
    if (!import.meta.env.DEV) return
    readRegistry().forEach((chainEntries, chainId) => {
      let live = 0
      chainEntries.forEach(counts => {
        if (counts.live > 0) live += 1
      })
      if (live > DEV_LIVE_UNION_WARN) {
        console.warn(
          `[tokenPrices] chain ${chainId} has ${live} live-tier addresses; a list-sized subscription should use the default 'once' tier.`,
        )
      }
    })
  }, [registryVersion])

  return null
}
