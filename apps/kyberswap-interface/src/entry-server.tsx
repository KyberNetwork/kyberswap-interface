import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LanguageProvider, activateInitialLocale } from 'i18n'
import { prerenderToNodeStream } from 'react-dom/static.node'
import { Provider } from 'react-redux'
import { StaticRouter } from 'react-router-dom/server'
import { WagmiProvider } from 'wagmi'

import { wagmiConfig } from 'components/Web3Provider'
import App from 'pages/App'
import { makeStore } from 'state'
import ThemeProvider from 'theme'

// Re-export so the prerender script can read the per-route <head> from the same module.
export { buildHeadHtml } from 'components/Seo/seoConfig'

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
