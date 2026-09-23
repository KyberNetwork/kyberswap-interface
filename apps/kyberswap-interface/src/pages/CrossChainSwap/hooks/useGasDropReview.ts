import { t } from '@lingui/macro'
import { useCallback, useEffect, useRef, useState } from 'react'

import { KyberCrossRawQuote } from 'pages/CrossChainSwap/adapters/KyberCrossAdapter/types'
import { Quote } from 'pages/CrossChainSwap/registry'

// Keep the quote shown in Review stable until the user accepts a changed output.
export const useGasDropReview = (initialQuote: Quote | null, active: boolean) => {
  const [accepted, setAccepted] = useState<{ source: Quote | null; quote: Quote } | null>(null)
  const [pendingState, setPending] = useState<{ source: Quote | null; quote: Quote } | null>(null)
  const pending = pendingState?.source === initialQuote ? pendingState.quote : null
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const controller = useRef<AbortController | null>(null)
  const current = (accepted?.source === initialQuote ? accepted.quote : null) || initialQuote
  const currentRef = useRef(current)
  currentRef.current = current
  const enabled = !!initialQuote?.quote.quoteParams.gasDrop

  useEffect(() => {
    setAccepted(null)
    setPending(null)
    setError('')
  }, [initialQuote])

  const refresh = useCallback(async () => {
    const previous = currentRef.current
    if (!previous || controller.current) return
    const request = new AbortController()
    controller.current = request
    const timeout = setTimeout(() => request.abort(), 60_000)
    setRefreshing(true)
    setError('')
    try {
      const quote = await previous.adapter.getQuote(previous.quote.quoteParams, request.signal)
      if (request.signal.aborted) return
      const next = { ...previous, quote }
      const changed =
        quote.outputAmount !== previous.quote.outputAmount ||
        quote.minimumOutputAmount !== previous.quote.minimumOutputAmount ||
        quote.platformFeePercent !== previous.quote.platformFeePercent ||
        quote.contractAddress !== previous.quote.contractAddress ||
        JSON.stringify(quote.gasDrop) !== JSON.stringify(previous.quote.gasDrop)
      if (changed) setPending({ source: initialQuote, quote: next })
      else {
        setAccepted({ source: initialQuote, quote: next })
        setPending(null)
      }
    } catch {
      if (controller.current === request) setError(t`Unable to refresh this route. Please try again.`)
    } finally {
      clearTimeout(timeout)
      if (controller.current === request) {
        controller.current = null
        setRefreshing(false)
      }
    }
  }, [initialQuote])

  useEffect(() => {
    if (!active || !enabled) return
    const expiresAt = (currentRef.current?.quote.rawQuote as KyberCrossRawQuote)?.data?.route_plans[0]?.expires_at
    if (expiresAt && Date.parse(expiresAt) <= Date.now()) refresh()
    const interval = setInterval(refresh, 30_000)
    return () => {
      clearInterval(interval)
      controller.current?.abort()
      controller.current = null
      setRefreshing(false)
    }
  }, [active, enabled, initialQuote, refresh])

  const expiresAt = (current?.quote.rawQuote as KyberCrossRawQuote)?.data?.route_plans?.[0]?.expires_at
  return {
    quote: pending || current,
    pending,
    refreshing,
    error,
    refresh,
    expired: () => enabled && !!expiresAt && Date.parse(expiresAt) <= Date.now(),
    accept: () => {
      if (pending) setAccepted({ source: initialQuote, quote: pending })
      setPending(null)
    },
  }
}
