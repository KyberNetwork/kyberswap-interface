import { afterEach, describe, expect, it, vi } from 'vitest'

const flags = vi.hoisted(() => ({ kyberCross: false }))
vi.mock('constants/env', async importOriginal => ({
  ...(await importOriginal<typeof import('constants/env')>()),
  get KYBERCROSS() {
    return flags.kyberCross
  },
}))
afterEach(() => {
  flags.kyberCross = false
})

// Representative route trees must complete the same async static render used by distinct pages and the
// shared product shells. This waits for React.lazy route chunks and validates real content, not only fallback UI.
const ROUTES = [
  // Limit Orders and Stop Market Orders - per chain
  '/limit/base',
  '/stop-market/base',
  // Cross-chain and Earn
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
    expect(html).not.toContain('id="cross-chain-nav-link"')
    expect(html).not.toContain('Swap EVM')
    expect(html).toContain('Route:')
    expect(html).not.toContain('<!--$?-->')
  })

  it('preserves the Limit Order entry on the swap page', async () => {
    const { renderRouteBodyHtml } = await import('entry-server')
    const html = await renderRouteBodyHtml('/swap/ethereum/eth-to-usdc')

    expect(html).toContain('id="limit-button"')
  })

  it('renders unified cross-chain directly at /swap with a query-only pair', async () => {
    const { renderRouteBodyHtml } = await import('entry-server')
    const html = await renderRouteBodyHtml('/swap?from=1&to=8453&tokenIn=ETH&tokenOut=ETH')

    expect(html).toContain('id="swap-currency-input"')
    expect(html).toContain('id="swap-currency-output"')
    const inputPanel = html.split('data-testid="swap-currency-input"')[1].split('data-testid="swap-currency-output"')[0]
    const outputPanel = html.split('data-testid="swap-currency-output"')[1].split('aria-label="Swap quote"')[0]
    expect(inputPanel).toContain('title="Ethereum"')
    expect(outputPanel).toContain('title="Base"')
    expect(html).toMatch(/<button\b[^>]*>(?:(?!<\/button>)[\s\S])*Routes<\/button>/)
    expect(html).toContain('Estimated Processing Time')
    expect(html).toContain('<aside')
    expect(html).not.toContain('data-testid="cross-chain-tab"')
    expect(html).not.toContain('<!--$?-->')
  })

  it.each(['/partner-swap', '/user-swap'])(
    'renders Unified Swap and retains Limit Order in the embedded route %s',
    async pathname => {
      const { renderRouteBodyHtml } = await import('entry-server')
      const html = await renderRouteBodyHtml(
        `${pathname}?clientId=test&chainId=1&features=swap,limit,cross_chain&tab=cross_chain`,
      )

      expect(html).toContain('id="swap-currency-input"')
      expect(html).toContain('id="swap-currency-output"')
      expect(html).toContain('id="limit-button"')
      expect(html).not.toContain('data-testid="cross-chain-tab"')
      expect(html).not.toContain('Swap EVM')
      expect(html).not.toContain('<!--$?-->')
    },
  )

  it.each(['/partner-swap', '/user-swap'])(
    'opens embedded Limit Order without the retired Cross-chain tab: %s',
    async pathname => {
      const { renderRouteBodyHtml } = await import('entry-server')
      const html = await renderRouteBodyHtml(
        `${pathname}?clientId=test&chainId=8453&inputCurrency=ETH&outputCurrency=USDC&features=swap,limit&tab=limit`,
      )
      expect(html).toContain('id="create-limit-order-input-tokena"')
      expect(html).toContain('id="create-limit-order-input-tokenb"')
      expect(html).toContain('id="limit-button"')
      expect(html).not.toContain('id="swap-currency-input"')
      expect(html).not.toContain('data-testid="cross-chain-tab"')
    },
  )

  it.each(['/partner-swap', '/user-swap'])('renders embedded cross-chain from toChain on %s', async pathname => {
    const { renderRouteBodyHtml } = await import('entry-server')
    const html = await renderRouteBodyHtml(
      `${pathname}?clientId=test&chainId=1&toChain=8453&inputCurrency=ETH&outputCurrency=ETH`,
    )
    expect(html).toContain('id="swap-currency-input"')
    expect(html).toContain('id="swap-currency-output"')
    expect(html).toContain('aria-label="Swap quote"')
  })

  it('honors embedded swap-only features', async () => {
    const { renderRouteBodyHtml } = await import('entry-server')
    const html = await renderRouteBodyHtml('/partner-swap?clientId=test&chainId=1&features=swap')
    expect(html).toContain('id="swap-currency-input"')
    expect(html).not.toContain('id="limit-button"')
  })

  it('gates both the KyberCross tab and route with KYBERCROSS', async () => {
    const { renderRouteBodyHtml } = await import('entry-server')
    const swap = await renderRouteBodyHtml('/swap/ethereum')
    expect(swap).not.toContain('id="kybercross-nav-link"')
    const disabled = await renderRouteBodyHtml('/kybercross?from=1&to=8453&tokenIn=ETH&tokenOut=ETH')
    expect(disabled).not.toContain('id="swap-currency-input"')
    flags.kyberCross = true
    const enabled = await renderRouteBodyHtml('/kybercross?from=1&to=8453&tokenIn=ETH&tokenOut=ETH')
    expect(enabled).toContain('id="kybercross-nav-link"')
    expect(enabled).toContain('id="swap-currency-input"')
    expect(enabled).toContain('id="swap-currency-output"')
    expect(enabled).toContain('aria-label="Swap quote"')
  })

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

  it('prerenders only distinct pages and the shared product shells', async () => {
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
    expect(prerenderManifest.distinctPages).toHaveLength(10)
    expect(
      prerenderManifest.distinctPages.every(
        ({ pathname }) =>
          !pathname.startsWith('/swap/') && !pathname.startsWith('/limit/') && !pathname.startsWith('/stop-market/'),
      ),
    ).toBe(true)
  })
})
