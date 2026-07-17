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
import { CURATED_SWAP_INTENT_REDIRECTS } from 'components/Seo/curatedSwapCatalog'
import { SITEMAP_PAGE_ROUTES } from 'components/Seo/sitemapRoutes'
import { wagmiConfig } from 'components/Web3Provider'
import { APP_PATHS, KYBERSWAP_URL } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import App from 'pages/App'
import { makeStore } from 'state'
import { updateChainId } from 'state/user/actions'
import ThemeProvider from 'theme'
import { getChainIdFromSlug } from 'utils/string'

// Match the client entry before any lazy route module evaluates helpers that depend on these plugins.
dayjs.extend(utc)
dayjs.extend(duration)
dayjs.extend(relativeTime)

// Build-time static output support (no Node runtime in production — this module is loaded once by
// scripts/prerender.mjs through Vite's SSR transform pipeline). The manifest owns route-domain
// decisions; the script only renders and writes the declared artifacts.

export { renderRouteHeadHtml, renderTradeShellHeadHtml } from 'components/Seo/seoHead'

const DEFAULT_NETWORK_ROUTE = NETWORKS_INFO[ChainId.MAINNET].route
const ROOT_SOURCE_ROUTE = `${APP_PATHS.SWAP}/${DEFAULT_NETWORK_ROUTE}`

const distinctPageRoutes = SITEMAP_PAGE_ROUTES.filter(
  route => route !== '/' && !route.startsWith(`${APP_PATHS.SWAP}/`) && !route.startsWith(`${APP_PATHS.LIMIT}/`),
)

export const prerenderManifest = {
  siteUrl: KYBERSWAP_URL,
  rootPage: {
    pathname: '/',
    sourceRoute: ROOT_SOURCE_ROUTE,
    outputPath: 'index-root.html',
  },
  distinctPages: distinctPageRoutes.map(pathname => ({
    pathname,
    sourceRoute: pathname,
    outputPath: `${pathname.slice(1)}/index.html`,
  })),
  tradeShells: [
    {
      product: 'swap',
      sourceRoute: ROOT_SOURCE_ROUTE,
      outputPath: 'swap/index.html',
    },
    {
      product: 'limit',
      sourceRoute: `${APP_PATHS.LIMIT}/${DEFAULT_NETWORK_ROUTE}`,
      outputPath: 'limit/index.html',
    },
  ],
  ogSkeletons: [
    {
      name: 'swap',
      sourceRoute: `${APP_PATHS.SWAP}/${DEFAULT_NETWORK_ROUTE}/eth-to-usdc`,
      outputPath: 'skeletons/swap.html',
    },
    {
      name: 'pool',
      sourceRoute: `${APP_PATHS.POOLS}/${DEFAULT_NETWORK_ROUTE}/uniswapv3/0x0000000000000000000000000000000000000001`,
      outputPath: 'skeletons/pool.html',
    },
  ],
  swapIntentRedirects: CURATED_SWAP_INTENT_REDIRECTS,
} as const

const getRouteNetworkSlug = (url: string) => {
  const productPath = [APP_PATHS.SWAP, APP_PATHS.LIMIT, APP_PATHS.BUY, APP_PATHS.SELL].find(path =>
    url.startsWith(`${path}/`),
  )
  return productPath ? url.slice(productPath.length + 1).split(/[/?#]/, 1)[0] : undefined
}

function createRouteAppTree(url: string) {
  const store = makeStore()
  const routeChainId = getChainIdFromSlug(getRouteNetworkSlug(url))
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
export async function renderRouteBodyHtml(url: string): Promise<string> {
  const renderErrors: unknown[] = []

  const { prelude } = await prerender(createRouteAppTree(url), {
    onError(error) {
      renderErrors.push(error)
    },
  })
  await new Response(prelude).text()

  if (renderErrors.length) {
    throw new AggregateError(renderErrors, `Failed to prerender ${url}`)
  }

  return renderToStaticMarkup(createRouteAppTree(url))
}

/**
 * Render a route's Suspense fallback (the page-shell skeleton from <RouteFallback>) to static HTML for
 * the cold-load placeholder. Reuses the SAME React skeleton the app shows while a lazy chunk loads, so
 * the build-baked cold-load shape and the post-hydrate fallback come from ONE source (no drift). The
 * skeletons are pure presentational (no wallet/data/Trans), so only a router (RouteFallback reads
 * useLocation) + ThemeProvider (Skeleton reads useTheme) are needed. renderToStaticMarkup emits no
 * hydration markers — this is a separate cosmetic cold-load overlay.
 */
export function renderRouteSkeletonHtml(url: string): string {
  return renderToStaticMarkup(
    <StaticRouter location={url}>
      <ThemeProvider>
        <RouteFallback />
      </ThemeProvider>
    </StaticRouter>,
  )
}
