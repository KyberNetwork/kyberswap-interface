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
  it.each([
    '/swap/ethereum/eth-to-usdc',
    '/swap/linea/eth-to-usdc',
    '/swap/base/eth-to-wbtc',
    '/swap/base/wbtc-to-eth',
  ])('renders the new layout through the existing swap entry %s', async location => {
    const { renderRouteBodyHtml } = await import('entry-server')
    const html = await renderRouteBodyHtml(location)

    expect(html).toContain('id="swap-currency-input"')
    expect(html).toContain('id="swap-currency-output"')
    expect(html).toContain('<aside')
    expect(html).toContain('Instantly buy or sell tokens at superior prices')
    expect(html).toContain('Swap')
    expect(html).toContain('Cross-Chain')
    expect(html).not.toContain('Swap EVM')
    expect(html).toContain('Route:')
    expect(html).not.toContain('<!--$?-->')
  })

  it('preserves the Limit Order entry on the swap page', async () => {
    const { renderRouteBodyHtml } = await import('entry-server')
    const html = await renderRouteBodyHtml('/swap/ethereum/eth-to-usdc')

    expect(html).toContain('id="limit-button"')
  })

  it.each(['/partner-swap', '/user-swap'])(
    'keeps embedded swap and feature selection working on %s',
    async pathname => {
      const { renderRouteBodyHtml } = await import('entry-server')
      const html = await renderRouteBodyHtml(`${pathname}?chainId=1&features=swap,limit&tab=swap`)

      expect(html).toContain('id="swap-currency-input"')
      expect(html).toContain('id="swap-currency-output"')
      expect(html).toContain('id="limit-button"')
      expect(html).not.toContain('data-testid="cross-chain-tab"')
      expect(html).not.toContain('Swap EVM')
      expect(html).not.toContain('<!--$?-->')
    },
  )

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
