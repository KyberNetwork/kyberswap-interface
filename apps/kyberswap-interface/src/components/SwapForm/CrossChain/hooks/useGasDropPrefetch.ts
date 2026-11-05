import { useRef } from 'react'

import type { useCrossChainQuoteRequest } from 'components/SwapForm/CrossChain/hooks/useCrossChainQuoteRequest'
import type { QuoteLoadContext } from 'components/SwapForm/CrossChain/hooks/useQuoteSession'

type QuoteResult = { available: boolean; hasQuotes: boolean }
type QuotePatch = Parameters<QuoteLoadContext['publish']>[0]
type Request = ReturnType<typeof useCrossChainQuoteRequest>
type PendingRequest = {
  request: Request
  startedAt: number
  patch: QuotePatch
  publish?: QuoteLoadContext['publish']
  result: Promise<QuoteResult>
}

// Shared quote transports require a signal; Gas Drop requests are allowed to finish.
const GAS_DROP_SIGNAL = new AbortController().signal

/** Owns the click-started request independently of whether the user confirms its mode. */
export const useGasDropPrefetch = (
  request: Request,
  loadQuotes: (context: QuoteLoadContext) => Promise<QuoteResult>,
) => {
  const pending = useRef<PendingRequest | null>(null)

  const prepare = () => {
    if (!request.params || request.isAmountPending) return

    const run: PendingRequest = {
      request,
      startedAt: Date.now(),
      patch: {},
      result: Promise.resolve({ available: true, hasQuotes: false }),
    }
    pending.current = run
    run.result = loadQuotes({
      signal: GAS_DROP_SIGNAL,
      publish: patch => {
        run.patch = { ...run.patch, ...patch }
        run.publish?.(patch)
      },
    }).catch(error => {
      console.error('Error preparing Gas Drop quotes:', error)
      return { available: true, hasQuotes: false }
    })
  }

  const load = async (context: QuoteLoadContext) => {
    const run = pending.current
    pending.current = null
    if (!run || run.request !== request || Date.now() - run.startedAt >= 60_000) {
      return loadQuotes({ ...context, signal: GAS_DROP_SIGNAL })
    }

    // The session publisher accepts only its current snapshot. Late results stay with their own request.
    run.publish = context.publish
    context.publish(run.patch)
    return run.result
  }

  return { prepare, load }
}
