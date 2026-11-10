import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Representative route trees must complete the same async static render used by distinct pages and the
// shared product shells. This waits for React.lazy route chunks and validates real content, not only fallback UI.
const ROUTES = [
  // Limit Orders and Stop Market Orders - per chain
  '/limit/base',
  '/stop-market/base',
  // Curated pairs are rendered at their own URL, not at the generic Swap landing page.
  '/swap/ethereum/eth-to-wbtc',
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
    const { renderRouteBodyHtml } = await import('entry-server')
    const html = await renderRouteBodyHtml(location)

    expect(html.length).toBeGreaterThan(0)
    expect(html).toContain('<main')
  })

  it('renders complete static swap content with the requested network active', async () => {
    const { renderRouteBodyHtml } = await import('entry-server')
    const ethereumHtml = await renderRouteBodyHtml('/swap/ethereum')
    const lineaHtml = await renderRouteBodyHtml('/swap/linea')

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

  it('gives every sitemap URL a unique HTML artifact and retains dynamic-route fallbacks', async () => {
    const { prerenderManifest } = await import('entry-server')

    expect(prerenderManifest.rootPage).toEqual({
      pathname: '/',
      sourceRoute: '/swap/ethereum',
      outputPath: 'index-root.html',
    })
    expect(prerenderManifest.tradeShells).toEqual([
      { outputPath: 'swap/index.html', product: 'swap', sourceRoute: '/swap/ethereum' },
      { outputPath: 'limit/index.html', product: 'limit', sourceRoute: '/limit/ethereum' },
      { outputPath: 'stop-market/index.html', product: 'stop-market', sourceRoute: '/stop-market/ethereum' },
    ])
    const sitemapIndex = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8')
    const sitemapPaths = Array.from(sitemapIndex.matchAll(/<loc>([^<]+)<\/loc>/g), ([, url]) => new URL(url).pathname)
    const sitemapRoutes = sitemapPaths.flatMap(path => {
      const sitemap = readFileSync(new URL(`../public${path}`, import.meta.url), 'utf8')
      return Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g), ([, url]) => new URL(url).pathname)
    })
    const pages = [prerenderManifest.rootPage, ...prerenderManifest.distinctPages]
    expect(pages.map(({ pathname }) => pathname).sort()).toEqual(sitemapRoutes.sort())
    for (const page of prerenderManifest.distinctPages) {
      expect(page.sourceRoute).toBe(page.pathname)
      expect(page.outputPath).toBe(`${page.pathname.slice(1)}/index.html`)
    }
    const outputPaths = [...pages, ...prerenderManifest.tradeShells].map(({ outputPath }) => outputPath)
    expect(new Set(outputPaths).size).toBe(outputPaths.length)
    expect(outputPaths).not.toContain('index.html')
  })
})
