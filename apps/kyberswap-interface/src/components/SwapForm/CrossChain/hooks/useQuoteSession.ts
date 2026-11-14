import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'
import { PairCategory } from 'services/crossChain/quote/utils'
import { Quote } from 'services/crossChain/registry'

import type { useCrossChainQuoteRequest } from 'components/SwapForm/CrossChain/hooks/useCrossChainQuoteRequest'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'

export type ReviewedQuote = Quote & { category: PairCategory }

const EMPTY_QUOTE_STATE = {
  quotes: [] as Quote[],
  selectedKey: null as string | null,
  category: 'commonPair' as PairCategory,
  reviewQuote: null as ReviewedQuote | null,
  loading: false,
  allLoading: false,
  countdown: 0,
  expiresAt: null as number | null,
}

export type QuoteLoadContext = {
  /** Session cancellation: consumers must ignore late publishes; pool transport has its own signal. */
  signal: AbortSignal
  publish: (patch: Partial<typeof EMPTY_QUOTE_STATE>) => void
  /** Manual/periodic refresh intent. A mode switch can reuse the existing pool instead. */
  forceRefresh?: boolean
}

export type QuotePoolSnapshot = Pick<
  typeof EMPTY_QUOTE_STATE,
  'quotes' | 'category' | 'loading' | 'allLoading' | 'expiresAt'
>

type Props = {
  request: ReturnType<typeof useCrossChainQuoteRequest>
  loadQuotes: (context: QuoteLoadContext) => Promise<void>
  refreshSeconds: number
  getQuoteKey: (quote: Quote) => string
  selectQuotes?: (quotes: Quote[]) => Quote[]
  /** Existing quotes explicitly adopted for the new request when switching modes. */
  initialSnapshot?: QuotePoolSnapshot
}

/**
 * Owns the active quote view: 500 ms request debounce, selection, refresh scheduling
 * and an immutable review snapshot. Pools retain transport/cache ownership independently.
 *
 * Request changes clear actionable quotes immediately; only an explicitly supplied
 * reusable pool snapshot can seed the new session. A pool's completion deadline drives
 * the countdown, and changing modes never grants another 60 seconds to cached quotes.
 * Review pauses scheduled refreshes while existing streams continue updating live data;
 * live results never replace the open review snapshot. Submit invalidates live quotes
 * without fetching; closing review resumes the normal cache/expiry scheduling.
 */
export const useQuoteSession = ({
  request,
  loadQuotes,
  refreshSeconds,
  getQuoteKey,
  selectQuotes,
  initialSnapshot,
}: Props) => {
  const disable = !request.params
  const { pairKey } = request

  const { trackingHandler } = useTracking()
  const runRef = useRef<(() => void) | null>(null)
  const reviewRefreshRef = useRef<((paused: boolean) => void) | null>(null)
  const nextManualRefreshAt = useRef(0)
  const [state, setState] = useState({
    ...EMPTY_QUOTE_STATE,
    request,
    selectQuotes,
    loading: !disable,
    refreshVersion: 0,
  })

  if (state.request !== request) {
    // Reset only quote-owned state. Recipient and form state live outside this session.
    const previous = !disable && state.request.pairKey === pairKey ? state : EMPTY_QUOTE_STATE
    setState({
      ...previous,
      request,
      selectQuotes,
      // Quotes from another amount/address/slippage must never become executable on a soft timeout.
      quotes: initialSnapshot?.quotes ?? [],
      loading: !disable && (initialSnapshot?.loading ?? true),
      allLoading: initialSnapshot?.allLoading ?? false,
      countdown: 0,
      expiresAt: initialSnapshot?.expiresAt ?? null,
      category: initialSnapshot?.category ?? previous.category,
      refreshVersion: 0,
    })
  } else if (state.selectQuotes !== selectQuotes) {
    setState({ ...state, selectQuotes, selectedKey: null, reviewQuote: null })
  }

  const { selectedKey, reviewQuote, category, loading, allLoading, countdown, refreshVersion } = state
  const quotes = selectQuotes ? selectQuotes(state.quotes) : state.quotes
  const showPreview = reviewQuote !== null
  const selectedQuote = quotes.find(quote => getQuoteKey(quote) === selectedKey) || quotes[0] || null

  const update = useCallback(
    (patch: Partial<typeof EMPTY_QUOTE_STATE>) => {
      setState(previous =>
        previous.request === request && previous.refreshVersion === refreshVersion
          ? { ...previous, ...patch }
          : previous,
      )
    },
    [request, refreshVersion],
  )

  const onRefresh = useCallback(() => {
    if (!runRef.current || Date.now() < nextManualRefreshAt.current) return

    nextManualRefreshAt.current = Date.now() + 2000
    runRef.current()
  }, [])

  const setSelectedKey = (selectedKey: string | null) => update({ selectedKey })

  const openReview = (quote: Quote) => {
    // Validate after the async allowance check, against the current request AND selected route.
    setState(previous => {
      const available = previous.selectQuotes ? previous.selectQuotes(previous.quotes) : previous.quotes
      const selected = available.find(item => getQuoteKey(item) === previous.selectedKey) || available[0]

      return previous.request === request && !previous.loading && selected === quote
        ? { ...previous, reviewQuote: { ...quote, category: previous.category } }
        : previous
    })
  }

  const closeReview = () => {
    setState(previous => {
      if (previous.request !== request) return previous
      const available = previous.selectQuotes ? previous.selectQuotes(previous.quotes) : previous.quotes
      const hasFreshQuotes = available.length > 0 && (previous.allLoading || (previous.expiresAt ?? 0) > Date.now())
      return { ...previous, reviewQuote: null, loading: !disable && !hasFreshQuotes }
    })
  }

  const invalidateQuotes = () => {
    // Detach old streams and clear live quotes; the open review keeps fetching paused.
    setState(previous =>
      previous.request === request
        ? {
            ...previous,
            quotes: [],
            selectedKey: null,
            loading: !disable,
            allLoading: !disable,
            countdown: 0,
            expiresAt: null,
            refreshVersion: previous.refreshVersion + 1,
          }
        : previous,
    )
  }

  useEffect(() => {
    const { params } = request
    if (!params) return

    const controller = new AbortController()
    const { signal } = controller
    let running = false
    let paused = showPreview
    let hasQuotes = quotes.length > 0
    let timer: ReturnType<typeof setTimeout>
    let ticker: ReturnType<typeof setInterval> | undefined
    let expiresAt = state.expiresAt ?? undefined

    const clearRefresh = () => {
      clearTimeout(timer)
      clearInterval(ticker)
    }

    const scheduleRefresh = () => {
      if (paused) return
      const deadline = expiresAt ?? Date.now() + refreshSeconds * 1000
      const remaining = Math.max(0, deadline - Date.now())
      update({ countdown: remaining })
      ticker = setInterval(() => update({ countdown: Math.max(0, deadline - Date.now()) }), 1000)
      timer = setTimeout(() => void run(), remaining)
    }

    const run = async (forceRefresh = true) => {
      if (signal.aborted || running || paused) return

      runRef.current = () => void run()
      clearRefresh()
      running = true
      expiresAt = undefined
      update({ loading: true, allLoading: true, countdown: 0, expiresAt: null })

      // The same cancellation boundary covers pair lookup, streaming, periodic and manual refresh.
      const publish = (patch: Partial<typeof EMPTY_QUOTE_STATE>) => {
        if (!signal.aborted) {
          if (patch.expiresAt !== undefined) expiresAt = patch.expiresAt ?? undefined
          if (patch.quotes) hasQuotes = patch.quotes.length > 0
          update(patch)
        }
      }

      try {
        // Capture the loader with this request; never mix a session with another request's pool.
        await loadQuotes({ signal, publish, forceRefresh })
      } catch (error) {
        if (!signal.aborted && (error as Error).message !== 'Cancelled') {
          console.error('Error getting quotes:', error)
          publish({ quotes: [] })
        }
      } finally {
        running = false

        if (!signal.aborted) {
          update({ loading: false, allLoading: false })
          scheduleRefresh()
        }
      }
    }

    const syncReviewRefresh = (reviewOpen: boolean) => {
      paused = reviewOpen
      clearRefresh()
      if (paused) {
        update({ countdown: 0 })
        return
      }
      // Review never detaches the active stream or starts a competing request.
      if (running) return
      if (hasQuotes && expiresAt !== undefined && expiresAt > Date.now()) {
        runRef.current = () => void run()
        scheduleRefresh()
      } else {
        // All request inputs share one debounce; changing any input cancels this timer.
        timer = setTimeout(() => void run(false), 500)
      }
    }

    reviewRefreshRef.current = syncReviewRefresh
    if (refreshVersion) void run(true)
    else if (allLoading) void run(false)
    else syncReviewRefresh(showPreview)

    return () => {
      controller.abort()
      runRef.current = null
      reviewRefreshRef.current = null
      clearRefresh()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Request owns the stream; review only controls scheduling below.
  }, [request, update, refreshSeconds, refreshVersion])

  useEffect(() => {
    reviewRefreshRef.current?.(showPreview)
  }, [showPreview])

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
    allQuotes: state.quotes,
    quotes,
    selectedQuote,
    category,
    reviewQuote,
    openReview,
    closeReview,
    invalidateQuotes,
    showPreview,
    disable,
    setSelectedKey,
    loading,
    allLoading,
    refresh: {
      countdown,
      refreshTime: refreshSeconds,
      disableRefresh: disable || showPreview || loading,
      isRefreshing: allLoading,
      onRefresh,
    },
  }
}
