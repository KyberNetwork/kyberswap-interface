import { getQuotes } from 'services/crossChain/quote/adapterQuotes'
import type { Quote } from 'services/crossChain/registry'

export const selectOrdinaryQuotes = (quotes: Quote[]) => quotes.filter(item => !item.quote.quoteParams.gasDrop)
export const selectGasDropQuotes = (quotes: Quote[]) =>
  quotes.filter(item => item.quote.quoteParams.gasDrop && item.quote.gasDrop)

/** Request only the requested mode and exclude Gas Drop responses without an allocation. */
export const getQuotesForMode = async ({
  onQuotes,
  onQuoteReady,
  ...options
}: Omit<Parameters<typeof getQuotes>[0], 'quoteMode'>) => {
  const { params, signal } = options
  const selectQuotes = params.gasDrop ? selectGasDropQuotes : selectOrdinaryQuotes
  let results: Quote[] = []
  const publishReady = () => {
    if (!signal.aborted && results.length) onQuoteReady()
  }

  try {
    await getQuotes({
      ...options,
      quoteMode: 'stream',
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
