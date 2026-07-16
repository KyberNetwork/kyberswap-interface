import { describe, expect, it } from 'vitest'

// Representative route trees must complete the same async static render used by the build. This waits for
// React.lazy route chunks, so it validates route content rather than only the Suspense fallback. `/` is emitted
// from rootPrerenderSourceRoute and covered by the prerender inventory contract below.
const ROUTES = [
  // Limit Orders - per chain
  '/limit/base',
  // Cross-chain and Earn
  '/cross-chain',
  '/earn',
  '/earn/pools',
  '/earn/positions',
  '/earn/smart-exit',
  // Market, KyberDAO, and About
  '/market-overview',
  '/about/kyberswap',
]

describe('SSR render smoke', () => {
  it.each(ROUTES)('renders %s without throwing', async location => {
    const { renderRouteApp } = await import('entry-server')
    const html = await renderRouteApp(location)

    expect(html.length).toBeGreaterThan(0)
    expect(html).toContain('<main')
  })

  it('renders complete static swap content with the requested network active', async () => {
    const { renderRouteApp } = await import('entry-server')
    const ethereumHtml = await renderRouteApp('/swap/ethereum')
    const lineaHtml = await renderRouteApp('/swap/linea')

    expect(ethereumHtml).toContain('<h1')
    expect(ethereumHtml).toContain('<h2')
    expect(ethereumHtml).toContain('<nav')
    expect(ethereumHtml).toMatch(/<a\b[^>]*href="\//)
    expect(ethereumHtml).toMatch(/<a\b[^>]*href="https?:\/\//)
    expect(ethereumHtml).not.toContain('<div hidden id="S:')
    expect(ethereumHtml).not.toContain('<!--$?-->')
    expect(ethereumHtml).not.toContain('$RC(')
    expect(ethereumHtml).not.toContain('<script')

    expect(ethereumHtml).toMatch(/<a\b(?=[^>]*aria-current="page")(?=[^>]*href="\/swap\/ethereum")[^>]*>/)
    expect(lineaHtml).toMatch(/<a\b(?=[^>]*aria-current="page")(?=[^>]*href="\/swap\/linea")[^>]*>/)
    expect(lineaHtml).not.toMatch(/<a\b(?=[^>]*aria-current="page")(?=[^>]*href="\/swap\/ethereum")[^>]*>/)
  })

  it('uses the sitemap inventory as the prerender route list and handles root separately', async () => {
    const { prerenderContentRoutes, rootPrerenderSourceRoute, sitemapRoutes } = await import('entry-server')

    expect(rootPrerenderSourceRoute).toBe('/swap/ethereum')
    expect(['/', ...prerenderContentRoutes]).toEqual(sitemapRoutes)
  })
})
