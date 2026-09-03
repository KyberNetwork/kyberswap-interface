import { ChainId } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'
import { UnsupportedChainError, fetchWalletInventory } from 'services/walletInventory'

import useIsWindowVisible from 'hooks/useIsWindowVisible'
import { INVENTORY_CATCHUP_INTERVAL_MS, INVENTORY_TTL_MS } from 'state/walletInventory/constants'
import {
  commitFailure,
  commitResult,
  getStoreVersion,
  isAwaitingBlock,
  isInventoryChain,
  markChainUnsupported,
  readEntry,
  readMeta,
  readSubscriptions,
  subscribeStore,
} from 'state/walletInventory/store'

/** Tick granularity for noticing an inventory has passed its TTL — not the TTL itself. */
const SWEEP_INTERVAL_MS = 5_000
/** Trailing debounce on subscription changes, so a burst of mounts becomes one request. */
const COALESCE_MS = 50
const MAX_PARALLEL = 3

type DueTarget = { key: string; chainId: ChainId; account: string }

/**
 * Which subscribed wallets need fetching right now. A cold or explicitly expired wallet is always
 * fetched; TTL refreshes are visibility-gated so a background tab stops polling.
 */
export const selectDue = (now: number, windowVisible: boolean): DueTarget[] => {
  const due: DueTarget[] = []

  readSubscriptions().forEach((count, key) => {
    if (count <= 0) return
    const [chainPart, account] = key.split(':')
    const chainId = Number(chainPart) as ChainId
    if (!isInventoryChain(chainId)) return

    const entry = readEntry(key)
    const entryMeta = readMeta(key)

    // Failure backoff gates every branch below — a service that is erroring must not be hammered by
    // the catch-up poll or a cold retry any more than by the TTL.
    if (entryMeta && now < entryMeta.nextRetryAt) return

    // Never fetched, or failed with nothing to show: fetch regardless of visibility, otherwise a tab
    // restored from the background would render an empty inventory until the next tick.
    if (!entry || entry.status === 'error') {
      due.push({ key, chainId, account })
      return
    }

    // A partial walk means the wallet exceeded the page cap — a property of the wallet, so another
    // walk lands partial again. Consumers are already reading multicall for it (see resolve); walking
    // ten pages per TTL tick on top of that would be pure waste.
    if (entry.status === 'partial') return

    if (entryMeta?.forced) {
      due.push({ key, chainId, account })
      return
    }

    if (!windowVisible) return

    // Chasing a just-confirmed transaction: poll faster than the TTL until the indexer catches up.
    if (isAwaitingBlock(key, now)) {
      if (now - entry.fetchedAt >= INVENTORY_CATCHUP_INTERVAL_MS) due.push({ key, chainId, account })
      return
    }

    if (now - entry.fetchedAt >= INVENTORY_TTL_MS) due.push({ key, chainId, account })
  })

  return due
}

/**
 * Owns every request to the wallet-balances endpoint. Consumers only subscribe (see ./store), so one
 * poll serves the selector, the token list and the wallet popup at once rather than each racing.
 */
export default function Updater(): null {
  const windowVisible = useIsWindowVisible()

  // useSyncExternalStore rather than state, so a burst of mounts coalesces into one sweep.
  const storeVersion = useSyncExternalStore(subscribeStore, getStoreVersion, getStoreVersion)

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

    const targets = selectDue(Date.now(), visibleRef.current)
    if (!targets.length) return

    sweepInFlightRef.current = true
    const signal = abortRef.current?.signal

    try {
      const runTarget = async ({ key, chainId, account }: DueTarget) => {
        try {
          commitResult(key, await fetchWalletInventory({ chainId, account, signal }))
        } catch (error) {
          // An unindexed chain is a permanent answer, not a transient failure: disable it for the
          // session so consumers settle on the multicall path instead of retrying forever.
          if (error instanceof UnsupportedChainError) markChainUnsupported(chainId)
          else commitFailure(key)
        }
      }

      for (let i = 0; i < targets.length; i += MAX_PARALLEL) {
        await Promise.all(targets.slice(i, i + MAX_PARALLEL).map(runTarget))
      }
    } finally {
      sweepInFlightRef.current = false
      if (sweepQueuedRef.current) {
        sweepQueuedRef.current = false
        void runSweep()
      }
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    abortRef.current = controller
    // Unmount only: a response for a wallet that just unsubscribed is still worth storing.
    return () => controller.abort()
  }, [])

  // Gets a newly mounted consumer its inventory a frame later rather than on the next tick, and
  // collapses a StrictMode or route-transition mount flap into one request.
  useEffect(() => {
    const timer = setTimeout(() => void runSweep(), COALESCE_MS)
    return () => clearTimeout(timer)
  }, [storeVersion, runSweep])

  useEffect(() => {
    if (!readSubscriptions().size) return
    const interval = setInterval(() => void runSweep(), SWEEP_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [storeVersion, runSweep])

  useEffect(() => {
    if (windowVisible) void runSweep()
  }, [windowVisible, runSweep])

  return null
}
