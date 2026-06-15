import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LanguageProvider, activateInitialLocale } from 'i18n'
import { renderToStaticMarkup } from 'react-dom/server'
import { prerenderToNodeStream } from 'react-dom/static.node'
import { Provider } from 'react-redux'
import { StaticRouter } from 'react-router-dom/server'
import { WagmiProvider } from 'wagmi'

import RouteFallback from 'components/RouteFallback'
import { wagmiConfig } from 'components/Web3Provider'
import { APP_PATHS, KYBERSWAP_URL } from 'constants/index'
import { MAINNET_NETWORKS, NETWORKS_INFO } from 'constants/networks'
import App from 'pages/App'
import { makeStore } from 'state'
import ThemeProvider from 'theme'

// Re-export so the prerender script can read the per-route <head> from the same module.
export { buildHeadHtml } from 'components/Seo/seoConfig'

// Canonical base URL, re-exported so scripts/prerender.mjs builds sitemap <loc>s from the same
// single source of truth (constants/index KYBERSWAP_URL) instead of hardcoding the domain.
export const siteUrl = KYBERSWAP_URL

/**
 * Bounded public routes to prerender (en-US only), derived from app constants so the list tracks
 * network/campaign changes. `ssr: true` = full body is rendered server-side and hydrated (use for
 * pages with static, indexable content that render cleanly in Node). `ssr: false` = only the
 * per-route <head> (title/description/canonical/OG) is injected and the body is client-rendered —
 * used for wallet/data-heavy interactive routes whose body has no static SEO value and pulls deps
 * that don't run under Node SSR. The home route is intentionally omitted: the SPA-fallback
 * build/index.html already serves it with the (identical) default head.
 */
export type PrerenderRoute = { path: string; ssr: boolean }

export const prerenderRoutes: PrerenderRoute[] = [
  // Full-body: static marketing content, index,follow.
  { path: `${APP_PATHS.ABOUT}/kyberswap`, ssr: true },
  { path: `${APP_PATHS.ABOUT}/knc`, ssr: true },
  // Head-only: interactive/data-driven bodies (client-rendered) with prerendered SEO meta.
  { path: APP_PATHS.EARN, ssr: false },
  { path: APP_PATHS.EARN_POOLS, ssr: false },
  { path: APP_PATHS.MARKET_OVERVIEW, ssr: false },
  { path: APP_PATHS.SAFEPAL_CAMPAIGN, ssr: false },
  { path: APP_PATHS.RAFFLE_CAMPAIGN, ssr: false },
  { path: APP_PATHS.NEAR_INTENTS_CAMPAIGN, ssr: false },
  { path: APP_PATHS.MAY_TRADING_CAMPAIGN, ssr: false },
  { path: APP_PATHS.AGGREGATOR_CAMPAIGN, ssr: false },
  { path: APP_PATHS.LIMIT_ORDER_CAMPAIGN, ssr: false },
  { path: APP_PATHS.REFFERAL_CAMPAIGN, ssr: false },
  // KyberDAO — public staking / governance / KNC-utility pages (wallet-driven bodies → head-only).
  { path: APP_PATHS.KYBERDAO_STAKE, ssr: false },
  { path: APP_PATHS.KYBERDAO_VOTE, ssr: false },
  { path: APP_PATHS.KYBERDAO_KNC_UTILITY, ssr: false },
  // Gated (wallet-required, noindex) list pages — prerendered head-only ONLY to bake their page-shell
  // skeleton into the cold-load overlay, so a direct/bookmarked load shows the right shape instead of the
  // generic logo. NOT for SEO: they stay noindex (see seoConfig) and are intentionally kept out of
  // sitemapRoutes. Only static list paths qualify; the dynamic position-detail route stays SPA-fallback.
  { path: APP_PATHS.EARN_POSITIONS, ssr: false },
  { path: APP_PATHS.EARN_SMART_EXIT, ssr: false },
  ...Array.from(new Set(MAINNET_NETWORKS)).map(
    (chainId): PrerenderRoute => ({ path: `${APP_PATHS.SWAP}/${NETWORKS_INFO[chainId].route}`, ssr: false }),
  ),
]

/**
 * The index,follow URLs to list in sitemap.xml (home + about + earn + KyberDAO + per-network swap).
 * The noindex routes (market-overview, campaigns) are prerendered for meta/first-paint but omitted
 * here — a sitemap should only advertise indexable URLs.
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

// Server entry for build-time prerendering (no Node runtime in production — loaded once by
// scripts/prerender.mjs via Vite's ssrLoadModule). Renders the same App tree the client hydrates.
// Wallet-side-effect providers (Bitcoin/NEAR/Solana, auto-connect, analytics)
// are intentionally NOT here: they only run client effects and add no DOM, so omitting them keeps
// the server HTML identical to the client's first render. import.meta.env.SSR is true here, so the
// porto connector is excluded from wagmiConfig.

export async function render(url: string): Promise<string> {
  // Pick the catalog (cookie/default) synchronously so the markup is translated.
  activateInitialLocale()

  // Fresh store + query client per render so route renders never share cached state.
  const store = makeStore()
  const queryClient = new QueryClient()

  const { prelude } = await prerenderToNodeStream(
    <Provider store={store}>
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
    </Provider>,
  )

  let html = ''
  for await (const chunk of prelude) html += chunk
  return html
}

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
