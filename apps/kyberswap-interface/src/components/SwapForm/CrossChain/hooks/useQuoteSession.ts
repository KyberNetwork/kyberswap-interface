import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'

import type { useCrossChainQuoteRequest } from 'components/SwapForm/CrossChain/hooks/useCrossChainQuoteRequest'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { PairCategory } from 'pages/Swap/crossChain/quote/utils'
import { Quote } from 'pages/Swap/crossChain/registry'

export type ReviewedQuote = Quote & { category: PairCategory }

const EMPTY_QUOTE_STATE = {
  quotes: [] as Quote[],
  selectedKey: null as string | null,
  category: 'commonPair' as PairCategory,
  reviewQuote: null as ReviewedQuote | null,
  loading: false,
  allLoading: false,
  countdown: 0,
}

export type QuoteLoadContext = {
  signal: AbortSignal
  publish: (patch: Partial<typeof EMPTY_QUOTE_STATE>) => void
}

type Props = {
  request: ReturnType<typeof useCrossChainQuoteRequest>
  loadQuotes: (context: QuoteLoadContext) => Promise<void>
  refreshSeconds: number
  getQuoteKey: (quote: Quote) => string
}

/** One owner for cancellation, periodic refresh, route selection and immutable review snapshots. */
export const useQuoteSession = ({ request, loadQuotes, refreshSeconds, getQuoteKey }: Props) => {
  const disable = !request.params
  const { pairKey, isAmountPending } = request

  const { trackingHandler } = useTracking()
  const [state, setState] = useState({ ...EMPTY_QUOTE_STATE, request, loading: !disable })

  if (state.request !== request) {
    // Reset only quote-owned state. Recipient and form state live outside this session.
    const previous = state.request.pairKey === pairKey ? state : EMPTY_QUOTE_STATE
    setState({
      ...previous,
      request,
      // Quotes from another amount/address/slippage must never become executable on a soft timeout.
      quotes: [],
      loading: !disable,
      allLoading: false,
      countdown: 0,
    })
  }

  const { quotes, selectedKey, reviewQuote, category, loading, allLoading, countdown } = state
  const showPreview = reviewQuote !== null
  const selectedQuote = quotes.find(quote => getQuoteKey(quote) === selectedKey) || quotes[0] || null

  const update = useCallback(
    (patch: Partial<typeof EMPTY_QUOTE_STATE>) => {
      setState(previous => (previous.request === request ? { ...previous, ...patch } : previous))
    },
    [request],
  )

  const runRef = useRef<(() => void) | null>(null)
  const nextManualRefreshAt = useRef(0)

  const load = useEffectEvent(loadQuotes)

  useEffect(() => {
    const { params } = request
    if (!params || request.isAmountPending || showPreview) return

    const controller = new AbortController()
    const { signal } = controller
    let running = false
    let timer: ReturnType<typeof setTimeout>
    let ticker: ReturnType<typeof setInterval> | undefined

    const run = async () => {
      if (signal.aborted || running) return

      clearTimeout(timer)
      clearInterval(ticker)
      running = true
      update({ loading: true, allLoading: true, countdown: 0 })

      // The same cancellation boundary covers pair lookup, streaming, periodic and manual refresh.
      const publish = (patch: Partial<typeof EMPTY_QUOTE_STATE>) => {
        if (!signal.aborted) update(patch)
      }

      try {
        await load({ signal, publish })
      } catch (error) {
        if (!signal.aborted && (error as Error).message !== 'Cancelled') {
          console.error('Error getting quotes:', error)
          publish({ quotes: [] })
        }
      } finally {
        running = false

        if (!signal.aborted) {
          const deadline = Date.now() + refreshSeconds * 1000
          update({ loading: false, allLoading: false, countdown: refreshSeconds * 1000 })
          ticker = setInterval(() => update({ countdown: Math.max(0, deadline - Date.now()) }), 1000)
          timer = setTimeout(() => void run(), refreshSeconds * 1000)
        }
      }
    }

    runRef.current = () => void run()
    timer = setTimeout(() => void run(), 300)

    return () => {
      controller.abort()
      runRef.current = null
      clearTimeout(timer)
      clearInterval(ticker)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Effect Event reads the loader for this request.
  }, [request, showPreview, update, refreshSeconds])

  const onRefresh = useCallback(() => {
    if (!runRef.current || Date.now() < nextManualRefreshAt.current) return

    nextManualRefreshAt.current = Date.now() + 2000
    runRef.current()
  }, [])

  const setSelectedKey = (selectedKey: string | null) => update({ selectedKey })

  const openReview = (quote: Quote) => {
    // Validate after the async allowance check, against the current request AND selected route.
    setState(previous => {
      const selected = previous.quotes.find(item => getQuoteKey(item) === previous.selectedKey) || previous.quotes[0]

      return previous.request === request && !previous.loading && selected === quote
        ? { ...previous, reviewQuote: { ...quote, category: previous.category } }
        : previous
    })
  }

  const closeReview = () => update({ reviewQuote: null, loading: !disable })

  const trackReviewOpened = useEffectEvent((reviewedQuote: Quote) => {
    const { quote, adapter } = reviewedQuote

    trackingHandler(TRACKING_EVENT_TYPE.CC_REVIEW_OPENED, {
      from_token: quote.quoteParams.fromToken.symbol,
      to_token: quote.quoteParams.toToken.symbol,
      from_chain: quote.quoteParams.fromChain,
      to_chain: quote.quoteParams.toChain,
      amount_in: quote.inputUsd,
      amount_out_estimated: quote.outputUsd,
      routing_source: adapter.getName(),
    })
  })

  // Analytics follows only accepted previews, independently of wallet/analytics context updates.
  useEffect(() => {
    if (reviewQuote) trackReviewOpened(reviewQuote)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Effect Events are non-reactive (React 19).
  }, [reviewQuote])

  return {
    quotes,
    selectedQuote,
    category,
    reviewQuote,
    openReview,
    closeReview,
    showPreview,
    disable,
    setSelectedKey,
    loading: loading || isAmountPending,
    allLoading,
    refresh: {
      countdown,
      refreshTime: refreshSeconds,
      disableRefresh: disable || showPreview || isAmountPending,
      isRefreshing: loading || allLoading,
      onRefresh,
    },
  }
}
