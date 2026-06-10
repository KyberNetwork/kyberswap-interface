import { ChainId } from '@kyberswap/ks-sdk-core'
import limitOrderApi from 'services/limitOrder'
import zapEarnServiceApi from 'services/zapEarn'

import { getInitialListOrdersArgs } from 'components/swapv2/LimitOrder/listOrdersArgs'
import { APP_PATHS } from 'constants/index'
import { isSupportedChainId } from 'constants/networks'
import store from 'state'

type ChunkLoader = () => Promise<unknown>

// Destination route → its lazy JS chunk. Each loader imports the SAME module App.tsx lazy-loads, so
// Vite serves the identical chunk (dedup by resolved module id) — prefetching never double-downloads.
// Order matters: list more specific path prefixes before their parents (EARN_POOLS before EARN).
const ROUTE_CHUNKS: { prefix: string; load: ChunkLoader }[] = [
  { prefix: APP_PATHS.SWAP, load: () => import('pages/SwapV3') },
  { prefix: APP_PATHS.LIMIT, load: () => import('pages/SwapV3') },
  { prefix: APP_PATHS.CROSS_CHAIN, load: () => import('pages/SwapV3') },
  { prefix: APP_PATHS.MARKET_OVERVIEW, load: () => import('pages/MarketOverview') },
  { prefix: APP_PATHS.EARN_POOLS, load: () => import('pages/Earns/PoolExplorer') },
  { prefix: APP_PATHS.EARN, load: () => import('pages/Earns/Landing') },
]

/** Warm the lazy JS chunk for the route a nav link points at. No-op for external/unmapped targets. */
export function prefetchRouteChunk(to: string) {
  const path = to.split('?')[0]
  ROUTE_CHUNKS.find(route => path === route.prefix || path.startsWith(`${route.prefix}/`))?.load()
}

// Pool-detail prefetches already issued this session — avoids re-dispatching on every re-hover.
const prefetchedPoolDetail = new Set<string>()

/**
 * Prefetch a pool-detail page on intent: its lazy chunk + the `poolDetail` RTK Query.
 *
 * The query args MUST match what the detail page requests or the prefetch misses the cache and the
 * page double-fetches: the detail page reads `chainId` from the chain slug and the LOWERCASED address
 * from the URL (see `getPoolDetailUrl`), so mirror both here. `ifOlderThan` skips refetching fresh data.
 */
export function prefetchPoolDetail(chainId: number | undefined, address: string | undefined) {
  void import('pages/Earns/PoolDetail')
  if (!chainId || !address) return
  const normalizedAddress = address.toLowerCase()
  const key = `${chainId}:${normalizedAddress}`
  if (prefetchedPoolDetail.has(key)) return
  prefetchedPoolDetail.add(key)
  store.dispatch(
    zapEarnServiceApi.util.prefetch('poolDetail', { chainId, address: normalizedAddress }, { ifOlderThan: 60 }),
  )
}

// Limit open-orders prefetches already issued this session, keyed by chain+account.
const prefetchedLimitOrders = new Set<string>()

/**
 * Prefetch the Limit page's open-orders list on nav intent. Mirrors the EXACT args ListOrder fires on a
 * fresh visit (active orders, page 1, empty query — see `getInitialListOrdersArgs`) so the page hits this
 * cache instead of refetching. Needs a connected wallet — the query is keyed by `maker` and the page
 * skips it without an account. `account`/`chainId` come from the nav component's `useActiveWeb3React`.
 */
export function prefetchLimitOpenOrders(chainId: ChainId, account: string | undefined) {
  if (!account || !isSupportedChainId(chainId)) return
  const key = `${chainId}:${account.toLowerCase()}`
  if (prefetchedLimitOrders.has(key)) return
  prefetchedLimitOrders.add(key)
  store.dispatch(
    limitOrderApi.util.prefetch('getListOrders', getInitialListOrdersArgs(chainId, account), { ifOlderThan: 30 }),
  )
}
