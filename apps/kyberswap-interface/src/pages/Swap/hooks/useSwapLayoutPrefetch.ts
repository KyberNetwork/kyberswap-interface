import { useEffect } from 'react'

import { loadCrossChainSwap } from 'pages/CrossChainSwap/loader'

type LazyComponentLoader = () => Promise<unknown>

// Warm the lazy content rendered inside SwapLayout's two Suspense regions, including the CrossChain form.
const LEFT_CONTENT_LOADERS: LazyComponentLoader[] = [
  () => import('pages/Swap/components/SwapSettingsPanel'),
  () => import('pages/Swap/components/LiquiditySourcesPanel'),
  loadCrossChainSwap,
  () => import('pages/CrossChainSwap/components/CrossChainSwapSources'),
  () => import('components/TokenInfo'),
]

const RIGHT_PANEL_LOADERS: LazyComponentLoader[] = [
  () => import('components/EarnBanner/TrendingPoolBanner'),
  () => import('components/EarnBanner/FarmingPoolBanner'),
  () => import('components/TokenPriceChart/TokenPriceChartCanvas'),
  () => import('components/TradeRouting'),
  () => import('components/LimitOrder/OrderList'),
  () => import('pages/CrossChainSwap/components/QuoteSteps'),
  () => import('pages/CrossChainSwap/components/TransactionHistory'),
]

const SWAP_LAYOUT_LOADERS = [...LEFT_CONTENT_LOADERS, ...RIGHT_PANEL_LOADERS]
const PREFETCH_START_FALLBACK_DELAY = 5_000
const PREFETCH_CHUNK_FALLBACK_DELAY = 1_000

let hasStartedPrefetch = false

const scheduleWhenIdle = (callback: () => void, fallbackDelay: number) => {
  if (window.requestIdleCallback) {
    window.requestIdleCallback(callback)
  } else {
    window.setTimeout(callback, fallbackDelay)
  }
}

const prefetchSwapLayoutChunk = (index = 0) => {
  const loader = SWAP_LAYOUT_LOADERS[index]
  if (!loader) return

  scheduleWhenIdle(
    () => {
      void loader()
        .catch(() => undefined)
        .finally(() => prefetchSwapLayoutChunk(index + 1))
    },
    index === 0 ? PREFETCH_START_FALLBACK_DELAY : PREFETCH_CHUNK_FALLBACK_DELAY,
  )
}

export const useSwapLayoutPrefetch = () => {
  useEffect(() => {
    if (typeof window === 'undefined' || hasStartedPrefetch) return

    const startPrefetch = () => {
      if (hasStartedPrefetch) return
      hasStartedPrefetch = true
      prefetchSwapLayoutChunk()
    }

    if (document.readyState === 'complete') {
      startPrefetch()
      return
    }

    window.addEventListener('load', startPrefetch, { once: true })
    return () => window.removeEventListener('load', startPrefetch)
  }, [])
}
