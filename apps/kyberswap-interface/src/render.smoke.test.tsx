import { QueryClientProvider } from '@tanstack/react-query'
import { renderToString } from 'react-dom/server'
import { Provider } from 'react-redux'
import { StaticRouter } from 'react-router-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'
import { WagmiProvider } from 'wagmi'

// Phase 1 SSR render smoke test: each representative public route must render to non-empty
// HTML in a node environment without throwing. This proves the app is importable + renderable
// server-side (foundation for the Phase 2/3 prerender). Ordered lightest import-graph first.
const ROUTES = ['/about/kyberswap', '/earn', '/earn/pools', '/', '/swap/ethereum']

describe('SSR render smoke', () => {
  beforeAll(async () => {
    // Activate the default catalog synchronously so LanguageProvider renders content.
    const { activateInitialLocale } = await import('i18n')
    activateInitialLocale()
  })

  it.each(ROUTES)('renders %s without throwing', async location => {
    const { makeStore } = await import('state')
    const { LanguageProvider } = await import('i18n')
    const ThemeProvider = (await import('theme')).default
    const { wagmiConfig, queryClient } = await import('components/Web3Provider')
    const { default: App } = await import('pages/App')

    const store = makeStore()
    let html = ''
    expect(() => {
      html = renderToString(
        <Provider store={store}>
          <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
              <StaticRouter location={location}>
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
    }).not.toThrow()
    // Non-empty assertion also catches a regression where LanguageProvider renders null.
    expect(html.length).toBeGreaterThan(0)
  })
})
