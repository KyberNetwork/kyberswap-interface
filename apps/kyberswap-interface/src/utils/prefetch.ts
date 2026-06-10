import { ChainId } from '@kyberswap/ks-sdk-core'
import limitOrderApi from 'services/limitOrder'
import zapEarnServiceApi from 'services/zapEarn'

import { getInitialListOrdersArgs } from 'components/swapv2/LimitOrder/listOrdersArgs'
import { APP_PATHS } from 'constants/index'
import { isSupportedChainId } from 'constants/networks'
import { getInitialPositionQueryParams } from 'pages/Earns/UserPositions/positionsQuery'
import store from 'state'

type ChunkLoader = () => Promise<unknown>

// Destination route → its lazy JS chunk, covering every header nav link. Each loader imports the SAME
// module App.tsx lazy-loads, so Vite serves the identical chunk (dedup by resolved module id) —
// prefetching never double-downloads. Order matters: list more specific path prefixes before their
// parents (e.g. every `/earn/*` before `/earn`, `/campaigns/dashboard` before the `/campaigns` catch-all).
const ROUTE_CHUNKS: { prefix: string; load: ChunkLoader }[] = [
  // Trade — swap / limit / cross-chain all render from the SwapV3 chunk.
  { prefix: APP_PATHS.SWAP, load: () => import('pages/SwapV3') },
  { prefix: APP_PATHS.LIMIT, load: () => import('pages/SwapV3') },
  { prefix: APP_PATHS.CROSS_CHAIN, load: () => import('pages/SwapV3') },
  // Market
  { prefix: APP_PATHS.MARKET_OVERVIEW, load: () => import('pages/MarketOverview') },
  // Earn — specific /earn/* routes must precede the /earn landing.
  { prefix: APP_PATHS.EARN_POOLS, load: () => import('pages/Earns/PoolExplorer') },
  { prefix: APP_PATHS.EARN_POSITIONS, load: () => import('pages/Earns/UserPositions') },
  { prefix: APP_PATHS.EARN_SMART_EXIT, load: () => import('pages/Earns/SmartExitOrders') },
  { prefix: APP_PATHS.EARN, load: () => import('pages/Earns/Landing') },
  // KyberDAO
  { prefix: APP_PATHS.KYBERDAO_STAKE, load: () => import('pages/KyberDAO/StakeKNC') },
  { prefix: APP_PATHS.KYBERDAO_VOTE, load: () => import('pages/KyberDAO/Vote') },
  { prefix: APP_PATHS.KYBERDAO_KNC_UTILITY, load: () => import('pages/KyberDAO/KNCUtility') },
  // About (prerendered routes — warm the chunk for hydration + in-app nav).
  { prefix: `${APP_PATHS.ABOUT}/kyberswap`, load: () => import('pages/About/AboutKyberSwap') },
  { prefix: `${APP_PATHS.ABOUT}/knc`, load: () => import('pages/About/AboutKNC') },
  // Campaigns — the dashboard has its own chunk; every other /campaigns/* is the Campaign page.
  { prefix: APP_PATHS.MY_DASHBOARD, load: () => import('pages/Campaign/MyDashboard') },
  { prefix: '/campaigns', load: () => import('pages/Campaign') },
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

// My Positions prefetches already issued this session, keyed by account.
const prefetchedPositions = new Set<string>()

/**
 * Prefetch the My Positions list on nav intent. Mirrors the EXACT args the page fires on a fresh visit
 * (default filters → `getInitialPositionQueryParams`) so the page hits this cache instead of refetching.
 * Needs a connected wallet — the query is keyed by `wallet` and the page skips it without an account.
 * The args are chain-independent (the default `chainIds` is ''), so only `account` is required.
 */
export function prefetchMyPositions(account: string | undefined) {
  if (!account) return
  const key = account.toLowerCase()
  if (prefetchedPositions.has(key)) return
  prefetchedPositions.add(key)
  store.dispatch(
    zapEarnServiceApi.util.prefetch('userPositions', getInitialPositionQueryParams(account), { ifOlderThan: 30 }),
  )
}

// Route prefix → its data prefetcher (parallel to ROUTE_CHUNKS). More specific prefixes first.
const ROUTE_DATA_PREFETCH: { prefix: string; run: (account: string | undefined, chainId: ChainId) => void }[] = [
  { prefix: APP_PATHS.LIMIT, run: (account, chainId) => prefetchLimitOpenOrders(chainId, account) },
  { prefix: APP_PATHS.EARN_POSITIONS, run: account => prefetchMyPositions(account) },
]

/**
 * Warm a destination route on nav intent: its lazy JS chunk + (if registered) its data. This is the
 * single entry point every internal-navigation component (StyledNavLink, NavigateButton) calls via the
 * `usePrefetchRoute` hook, so any link to a registered route prefetches without per-link wiring.
 */
export function prefetchRoute(toPath: string | undefined, account: string | undefined, chainId: ChainId) {
  if (!toPath) return
  prefetchRouteChunk(toPath)
  const path = toPath.split('?')[0]
  ROUTE_DATA_PREFETCH.find(route => path === route.prefix || path.startsWith(`${route.prefix}/`))?.run(account, chainId)
}
