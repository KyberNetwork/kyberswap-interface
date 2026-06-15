import { renderToStaticMarkup } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'

import RouteFallback from 'components/RouteFallback'
import { APP_PATHS, KYBERSWAP_URL } from 'constants/index'
import { MAINNET_NETWORKS, NETWORKS_INFO } from 'constants/networks'
import ThemeProvider from 'theme'

// Build-time prerender support (no Node runtime in production — this module is loaded once by
// scripts/prerender.mjs via Vite's ssrLoadModule). The app body is NEVER server-rendered: every route is
// head-only — prerender injects the per-route <head> (buildHeadHtml) and bakes the route's page-shell
// skeleton (renderRouteSkeleton) into the cold-load overlay; the body is client-rendered after load.

// Re-export so the prerender script can read the per-route <head> from the same module.
export { buildHeadHtml } from 'components/Seo/seoConfig'

// Canonical base URL, re-exported so scripts/prerender.mjs builds sitemap <loc>s from the same
// single source of truth (constants/index KYBERSWAP_URL) instead of hardcoding the domain.
export const siteUrl = KYBERSWAP_URL

/**
 * Bounded public routes to prerender (en-US only), derived from app constants so the list tracks
 * network/campaign changes. Every route is head-only: the per-route <head> + cold-load skeleton are
 * baked into a static index.html, the body is client-rendered. The home route is intentionally omitted:
 * the SPA-fallback build/index.html already serves it with the (identical) default head.
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

/**
 * Render a route's Suspense fallback (the page-shell skeleton from <RouteFallback>) to static HTML for
 * the cold-load placeholder. Reuses the SAME React skeleton the app shows while a lazy chunk loads, so
 * the build-baked cold-load shape and the post-hydrate fallback come from ONE source (no drift). The
 * skeletons are pure presentational (no wallet/data/Trans), so only a router (RouteFallback reads
 * useLocation) + ThemeProvider (Skeleton reads useTheme) are needed. renderToStaticMarkup emits no
 * hydration markers — the client createRoot just clears #app and re-renders, so this is purely cosmetic.
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
