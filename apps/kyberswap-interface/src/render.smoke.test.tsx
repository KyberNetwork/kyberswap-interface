import { describe, expect, it } from 'vitest'

// Representative route trees must complete the same async static render used by distinct pages and the two
// shared product shells. This waits for React.lazy route chunks and validates real content, not only fallback UI.
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

  it('prerenders only distinct pages and two shared product shells', async () => {
    const { prerenderManifest } = await import('entry-server')

    expect(prerenderManifest.rootPage).toEqual({
      pathname: '/',
      sourceRoute: '/swap/ethereum',
      outputPath: 'index-root.html',
    })
    expect(prerenderManifest.tradeShells).toEqual([
      { outputPath: 'swap/index.html', product: 'swap', sourceRoute: '/swap/ethereum' },
      { outputPath: 'limit/index.html', product: 'limit', sourceRoute: '/limit/ethereum' },
    ])
    expect(prerenderManifest.distinctPages).toHaveLength(11)
    expect(
      prerenderManifest.distinctPages.every(
        ({ pathname }) => !pathname.startsWith('/swap/') && !pathname.startsWith('/limit/'),
      ),
    ).toBe(true)
  })
})
