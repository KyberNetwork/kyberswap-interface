import { useEffect } from 'react'

type LazyComponentLoader = () => Promise<unknown>

// Warm only common settings and panels; wallet/provider stacks load with the active swap flow.
const LEFT_CONTENT_LOADERS: LazyComponentLoader[] = [
  () => import('components/SwapForm/Settings/SwapSettingsPanel'),
  () => import('components/SwapForm/Settings/LiquiditySourcesPanel'),
  () => import('components/TokenInfo'),
]

const RIGHT_PANEL_LOADERS: LazyComponentLoader[] = [
  () => import('components/EarnBanner/TrendingPoolBanner'),
  () => import('components/EarnBanner/FarmingPoolBanner'),
  () => import('components/TokenPriceChart/TokenPriceChartCanvas'),
  () => import('components/TradeRouting'),
  // Limit Order and Stop Market share this panel.
  () => import('components/LimitOrder/OrderList'),
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
