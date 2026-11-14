import { getDirectQuotes, getQuotes } from 'services/crossChain/quote/adapterQuotes'
import type { Quote } from 'services/crossChain/registry'

export const QUOTE_EXPIRY_TIME = 60_000

export const selectOrdinaryQuotes = (quotes: Quote[]) => quotes.filter(item => !item.quote.quoteParams.gasDrop)
export const selectGasDropQuotes = (quotes: Quote[]) =>
  quotes.filter(item => item.quote.quoteParams.gasDrop && item.quote.gasDrop)

/**
 * Requests the configured stream/direct transport and publishes usable mode-matching quotes.
 * Gas Drop requires an allocation, not just a request flag. Stream failure preserves any
 * usable partial results; cancellation ignores late data. Empty results let the owning hook
 * decide fallback policy. Stream failures never retry through direct provider adapters.
 */
export const getQuotesForMode = async ({
  onQuotes,
  onQuoteReady,
  quoteMode = 'stream',
  ...options
}: Omit<Parameters<typeof getQuotes>[0], 'quoteMode'> & { quoteMode?: 'stream' | 'direct' }) => {
  const { params, signal } = options
  const selectQuotes = params.gasDrop ? selectGasDropQuotes : selectOrdinaryQuotes
  let results: Quote[] = []
  const publishReady = () => {
    if (!signal.aborted && results.length) onQuoteReady()
  }

  try {
    const load = quoteMode === 'direct' ? getDirectQuotes : getQuotes
    await load({
      ...options,
      quoteMode,
      onQuotes: quotes => {
        if (signal.aborted) return
        results = selectQuotes(quotes)
        onQuotes(results)
      },
      onQuoteReady: publishReady,
    })
  } catch (error) {
    // Keep any usable quotes received before a stream failure.
    if (!signal.aborted) console.error(`Error getting quotes (gasDrop=${!!params.gasDrop}):`, error)
  } finally {
    if (!signal.aborted) onQuotes(results)
    publishReady()
  }
}
