import { ChainId } from '@kyberswap/ks-sdk-core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
import { LanguageProvider } from 'i18n'
import { renderToStaticMarkup } from 'react-dom/server'
import { prerender } from 'react-dom/static'
import { Provider } from 'react-redux'
import { StaticRouter } from 'react-router-dom/server'
import { WagmiProvider } from 'wagmi'

import RouteFallback from 'components/RouteFallback'
import { wagmiConfig } from 'components/Web3Provider'
import { APP_PATHS, KYBERSWAP_URL } from 'constants/index'
import { MAINNET_NETWORKS, NETWORKS_INFO } from 'constants/networks'
import App from 'pages/App'
import { makeStore } from 'state'
import { updateChainId } from 'state/user/actions'
import ThemeProvider from 'theme'
import { getChainIdFromSlug } from 'utils/string'

// Match the client entry before any lazy route module evaluates helpers that depend on these plugins.
dayjs.extend(utc)
dayjs.extend(duration)
dayjs.extend(relativeTime)

// Build-time prerender support (no Node runtime in production — this module is loaded once by
// scripts/prerender.mjs via Vite's ssrLoadModule). Indexable routes get both their route-specific <head>
// and static app body at build time; the existing client entry mounts the interactive app after load.

// Re-export so the prerender script can read the per-route <head> from the same module.
export { buildHeadHtml } from 'components/Seo/seoConfig'

// Canonical base URL, re-exported so scripts/prerender.mjs builds sitemap <loc>s from the same
// single source of truth (constants/index KYBERSWAP_URL) instead of hardcoding the domain.
export const siteUrl = KYBERSWAP_URL

/**
 * Bounded public routes to prerender (en-US only), derived from app constants so the list tracks
 * network/campaign changes. Every route gets its per-route <head> and cold-load skeleton; the indexable
 * subset also gets its app body. The home route is intentionally omitted from this directory-route list
 * because scripts/prerender.mjs emits it separately without changing the empty-body SPA fallback.
 */
export const prerenderRoutes: string[] = [
  `${APP_PATHS.ABOUT}/kyberswap`,
  `${APP_PATHS.ABOUT}/knc`,
  APP_PATHS.EARN,
  APP_PATHS.EARN_POOLS,
  APP_PATHS.MARKET_OVERVIEW,
  APP_PATHS.SAFEPAL_CAMPAIGN,
  APP_PATHS.RAFFLE_CAMPAIGN,
  APP_PATHS.NEAR_INTENTS_CAMPAIGN,
  APP_PATHS.MAY_TRADING_CAMPAIGN,
  APP_PATHS.AGGREGATOR_CAMPAIGN,
  APP_PATHS.LIMIT_ORDER_CAMPAIGN,
  APP_PATHS.REFFERAL_CAMPAIGN,
  APP_PATHS.KYBERDAO_STAKE,
  APP_PATHS.KYBERDAO_VOTE,
  APP_PATHS.KYBERDAO_KNC_UTILITY,
  // Gated (wallet-required, noindex) list pages — prerendered ONLY to bake their page-shell skeleton into
  // the cold-load overlay (a direct/bookmarked load shows the right shape, not the generic logo). NOT for
  // SEO: they stay noindex (see seoConfig) and are kept out of sitemapRoutes. Only static list paths
  // qualify; the dynamic position-detail route stays SPA-fallback.
  APP_PATHS.EARN_POSITIONS,
  APP_PATHS.EARN_SMART_EXIT,
  ...Array.from(new Set(MAINNET_NETWORKS)).map(chainId => `${APP_PATHS.SWAP}/${NETWORKS_INFO[chainId].route}`),
]

/**
 * The index,follow URLs to list in sitemap.xml (home + about + earn + KyberDAO + per-network swap).
 * The noindex routes (market-overview, campaigns, gated list pages) are prerendered for meta/skeleton but
 * omitted here — a sitemap should only advertise indexable URLs.
 */
export const sitemapRoutes: string[] = [
  '/',
  `${APP_PATHS.ABOUT}/kyberswap`,
  `${APP_PATHS.ABOUT}/knc`,
  APP_PATHS.EARN,
  APP_PATHS.EARN_POOLS,
  APP_PATHS.KYBERDAO_STAKE,
  APP_PATHS.KYBERDAO_VOTE,
  APP_PATHS.KYBERDAO_KNC_UTILITY,
  ...Array.from(new Set(MAINNET_NETWORKS)).map(chainId => `${APP_PATHS.SWAP}/${NETWORKS_INFO[chainId].route}`),
]

// The client resolves `/` to the default Ethereum swap route. Prerender that same existing route tree
// into a dedicated exact-root document; build/index.html remains an empty-body SPA fallback for dynamic
// URLs that cannot be enumerated at build time.
export const rootPrerenderSourceRoute = `${APP_PATHS.SWAP}/${NETWORKS_INFO[ChainId.MAINNET].route}`

// Full body prerender is an SEO concern, so keep it aligned with the index,follow routes. Noindex
// campaigns and wallet-gated pages retain their route-specific head/skeleton without pulling their
// wallet-only dependency graph into the Node build renderer.
export const appPrerenderRoutes = sitemapRoutes.filter(route => route !== '/')

function createRouteApp(url: string) {
  const store = makeStore()
  const networkSlug = url.startsWith(`${APP_PATHS.SWAP}/`)
    ? url.slice(APP_PATHS.SWAP.length + 1).split(/[/?#]/, 1)[0]
    : undefined
  const routeChainId = getChainIdFromSlug(networkSlug)
  if (routeChainId !== undefined) store.dispatch(updateChainId(routeChainId))

  const queryClient = new QueryClient()
  return (
    <Provider store={store} stabilityCheck="never" identityFunctionCheck="never">
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <StaticRouter location={url}>
            <LanguageProvider>
              <ThemeProvider>
                <App />
              </ThemeProvider>
            </LanguageProvider>
          </StaticRouter>
        </QueryClientProvider>
      </WagmiProvider>
    </Provider>
  )
}

/**
 * Render the real route tree to static HTML. React's static prerender API waits for lazy route chunks,
 * unlike renderToString. Once those chunks are resolved, renderToStaticMarkup emits a flat document
 * without React's hidden Suspense reveal payload, so headings and links are directly present even when
 * scripts are disabled. Each pass gets isolated Redux and Query clients to prevent state leakage.
 */
export async function renderRouteApp(url: string): Promise<string> {
  const renderErrors: unknown[] = []

  const { prelude } = await prerender(createRouteApp(url), {
    onError(error) {
      renderErrors.push(error)
    },
  })
  await new Response(prelude).text()

  if (renderErrors.length) {
    throw new AggregateError(renderErrors, `Failed to prerender ${url}`)
  }

  return renderToStaticMarkup(createRouteApp(url))
}

/**
 * Render a route's Suspense fallback (the page-shell skeleton from <RouteFallback>) to static HTML for
 * the cold-load placeholder. Reuses the SAME React skeleton the app shows while a lazy chunk loads, so
 * the build-baked cold-load shape and the post-hydrate fallback come from ONE source (no drift). The
 * skeletons are pure presentational (no wallet/data/Trans), so only a router (RouteFallback reads
 * useLocation) + ThemeProvider (Skeleton reads useTheme) are needed. renderToStaticMarkup emits no
 * hydration markers — this is a separate cosmetic cold-load overlay.
 */
export function renderRouteSkeleton(url: string): string {
  return renderToStaticMarkup(
    <StaticRouter location={url}>
      <ThemeProvider>
        <RouteFallback />
      </ThemeProvider>
    </StaticRouter>,
  )
}
