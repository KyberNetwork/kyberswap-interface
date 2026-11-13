import { useEffect, useMemo, useSyncExternalStore } from 'react'

import { QUOTE_EXPIRY_TIME } from 'components/SwapForm/CrossChain/hooks/getQuotesForMode'
import type { useCrossChainQuoteRequest } from 'components/SwapForm/CrossChain/hooks/useCrossChainQuoteRequest'
import type { QuoteLoadContext, QuotePoolSnapshot } from 'components/SwapForm/CrossChain/hooks/useQuoteSession'

type PoolRun = {
  controller: AbortController
  snapshot: QuotePoolSnapshot
  publish?: QuoteLoadContext['publish']
  result: Promise<boolean>
}

/**
 * Owns one request stream and its cache for an input identity.
 * Mode switches/review detach the session without cancelling transport; changing request
 * identity or unmounting aborts it. Repeated loads share an in-flight request.
 *
 * Expiry is 60 seconds after completion, not after the first streamed quote. This hook
 * does not schedule refreshes. The session supplies that schedule and forceRefresh intent.
 * `snapshot` is retained comparison data; `reusableSnapshot` may seed an active session
 * only while streaming or unexpired. Neither may cross a changed input identity.
 */
export const useQuotePool = (
  request: ReturnType<typeof useCrossChainQuoteRequest>,
  loadQuotes: (context: QuoteLoadContext) => Promise<void>,
) => {
  const pool = useMemo(() => {
    const listeners = new Set<() => void>()
    return {
      request,
      run: null as PoolRun | null,
      subscribe: (listener: () => void) => {
        listeners.add(listener)
        return () => {
          listeners.delete(listener)
        }
      },
      notify: () => listeners.forEach(listener => listener()),
    }
  }, [request])
  const snapshot = useSyncExternalStore(
    pool.subscribe,
    () => pool.run?.snapshot,
    () => undefined,
  )

  useEffect(() => () => pool.run?.controller.abort(), [pool])

  /**
   * Deduplicates pending work, otherwise reuses an unexpired result unless forced.
   * Explicit preparation can retry an empty result; confirming an already prepared
   * request consumes that result without silently issuing a duplicate request.
   */
  const prepare = (forceRefresh = false, retryEmpty = false) => {
    if (!request.params) return
    const existing = pool.run
    if (existing && !existing.controller.signal.aborted) {
      if (existing.snapshot.allLoading) return existing
      if (
        !forceRefresh &&
        (existing.snapshot.expiresAt ?? 0) > Date.now() &&
        (!retryEmpty || existing.snapshot.quotes.length)
      )
        return existing
    }

    const run: PoolRun = {
      controller: new AbortController(),
      snapshot: {
        quotes: existing?.snapshot.quotes ?? [],
        category: existing?.snapshot.category ?? 'commonPair',
        loading: true,
        allLoading: true,
        expiresAt: null,
      },
      result: Promise.resolve(false),
    }
    pool.run = run
    const publish: QuoteLoadContext['publish'] = patch => {
      if (run.controller.signal.aborted || pool.run !== run) return
      run.snapshot = { ...run.snapshot, ...patch }
      pool.notify()
      run.publish?.(patch)
    }
    pool.notify()
    run.result = loadQuotes({ signal: run.controller.signal, publish })
      .catch(error => {
        if (!run.controller.signal.aborted) {
          console.error('Error getting pool quotes:', error)
          publish({ quotes: [] })
        }
      })
      .then(() => {
        publish({ loading: false, allLoading: false, expiresAt: Date.now() + QUOTE_EXPIRY_TIME })
        return run.snapshot.quotes.length > 0
      })
    return run
  }

  /** Attaches the current session publisher and returns whether the stream finishes with usable quotes. */
  const load = async (context: QuoteLoadContext) => {
    const run = prepare(context.forceRefresh)
    if (!run) return false
    // A detached session ignores late updates; the pool keeps collecting them for the next subscriber.
    run.publish = context.publish
    context.publish(run.snapshot)
    return run.result
  }

  const reusableSnapshot =
    snapshot && (snapshot.allLoading || (snapshot.expiresAt ?? 0) > Date.now()) && snapshot.quotes.length
      ? snapshot
      : undefined

  const invalidate = () => {
    pool.run?.controller.abort()
    pool.run = null
    pool.notify()
  }

  return { snapshot, reusableSnapshot, load, invalidate, prepare: () => void prepare(false, true) }
}
