import { useEffect } from 'react'

type LazyComponentLoader = () => Promise<unknown>

// Forms stay eager. Only warm the lazy content rendered inside SwapLayout's two Suspense regions.
const LEFT_CONTENT_LOADERS: LazyComponentLoader[] = [
  () => import('components/TokenInfo'),
  () => import('pages/Swap/components/SwapSettingsPanel'),
  () => import('pages/Swap/components/LiquiditySourcesPanel'),
  () => import('pages/CrossChainSwap/components/CrossChainSwapSources'),
]

const RIGHT_PANEL_LOADERS: LazyComponentLoader[] = [
  () => import('components/EarnBanner/TrendingPoolBanner'),
  () => import('components/EarnBanner/FarmingPoolBanner'),
  () => import('components/LimitOrder/OrderList'),
  () => import('pages/CrossChainSwap/components/QuoteSteps'),
  () => import('pages/CrossChainSwap/components/TransactionHistory'),
  () => import('components/TokenPriceChart/TokenPriceChartCanvas'),
  () => import('components/TradeRouting'),
]

const SWAP_LAYOUT_LOADERS = [...LEFT_CONTENT_LOADERS, ...RIGHT_PANEL_LOADERS]
const PREFETCH_START_DELAY = 5_000
const PREFETCH_CHUNK_DELAY = 1_000

let hasStartedPrefetch = false

const prefetchSwapLayoutChunks = async () => {
  for (const [index, loader] of SWAP_LAYOUT_LOADERS.entries()) {
    await loader().catch(() => undefined)

    if (index < SWAP_LAYOUT_LOADERS.length - 1) {
      await new Promise(resolve => window.setTimeout(resolve, PREFETCH_CHUNK_DELAY))
    }
  }
}

const schedulePrefetch = () => {
  window.setTimeout(() => void prefetchSwapLayoutChunks(), PREFETCH_START_DELAY)
}

export const useSwapLayoutPrefetch = () => {
  useEffect(() => {
    if (typeof window === 'undefined' || hasStartedPrefetch) return

    const startPrefetch = () => {
      if (hasStartedPrefetch) return
      hasStartedPrefetch = true
      schedulePrefetch()
    }

    if (document.readyState === 'complete') {
      startPrefetch()
      return
    }

    window.addEventListener('load', startPrefetch, { once: true })
    return () => window.removeEventListener('load', startPrefetch)
  }, [])
}
