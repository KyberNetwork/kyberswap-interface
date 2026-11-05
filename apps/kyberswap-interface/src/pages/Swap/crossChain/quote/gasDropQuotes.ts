import { formatUnits } from 'viem'

import { getQuotes } from 'pages/Swap/crossChain/quote/adapterQuotes'
import type { Quote } from 'pages/Swap/crossChain/registry'

export const selectOrdinaryQuotes = (quotes: Quote[]) => quotes.filter(item => !item.quote.quoteParams.gasDrop)
export const selectGasDropQuotes = (quotes: Quote[]) =>
  quotes.filter(item => item.quote.quoteParams.gasDrop && item.quote.gasDrop)

type GasDropQuotesParams = Omit<Parameters<typeof getQuotes>[0], 'quoteMode'> & {
  gasDropSupported: boolean
}

/** Collect both modes under the caller's cancellation boundary, preserving partial successes. */
export const getQuotesWithGasDrop = async ({
  gasDropSupported,
  onQuotes,
  onQuoteReady,
  ...options
}: GasDropQuotesParams) => {
  const { params, signal } = options
  const inputUsd = Number(formatUnits(BigInt(params.amount), params.fromToken.decimals)) * params.tokenInUsd
  const modes = gasDropSupported && Number.isFinite(inputUsd) && inputUsd > 2 ? [false, true] : [false]
  const results: [Quote[], Quote[]] = [[], []]

  const publishQuotes = () => {
    if (!signal.aborted) onQuotes([...results[0], ...results[1]])
  }

  await Promise.all(
    modes.map(async gasDrop => {
      const index = gasDrop ? 1 : 0
      const publishReady = () => {
        if (!signal.aborted && results[index].length) onQuoteReady()
      }

      try {
        await getQuotes({
          ...options,
          quoteMode: 'stream',
          params: { ...params, gasDrop },
          onQuotes: quotes => {
            if (signal.aborted) return
            results[index] = gasDrop ? selectGasDropQuotes(quotes) : selectOrdinaryQuotes(quotes)
            publishQuotes()
          },
          onQuoteReady: publishReady,
        })
      } catch (error) {
        // A failed mode must not discard usable quotes from the other stream.
        if (!signal.aborted) console.error(`Error getting quotes (gasDrop=${gasDrop}):`, error)
      } finally {
        publishQuotes()
        publishReady()
      }
    }),
  )
}
