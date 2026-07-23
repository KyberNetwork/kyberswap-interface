import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { NETWORKS_INFO } from 'constants/networks'
import { STABLE_TOKENS } from 'constants/tokens'
import { SwapIntent } from 'utils/routes'
import { getChainIdFromSlug } from 'utils/string'

import { CURATED_SWAP_INTENT_REDIRECTS, CURATED_SWAP_PAIR_ROUTES, getCuratedSwapPairByPath } from './curatedSwapCatalog'
import { resolveRouteMetadata } from './routeMetadata'
import { renderRouteHeadHtml, renderTradeShellHeadHtml } from './seoHead'
import { SITEMAP_LIMIT_CHAIN_SLUGS, SITEMAP_PAGE_ROUTES, SITEMAP_SWAP_CHAIN_SLUGS } from './sitemapRoutes'

const SITE_URL = 'https://kyberswap.com'
const SWAP_DESCRIPTION =
  'Swap any token at the best rate across chains. An advanced aggregator splits your trade across hundreds of DEXs and liquidity sources for minimal slippage.'
const LIMIT_DESCRIPTION =
  'Set a target price and your order settles on-chain automatically when the market reaches it. Gasless submission, no slippage, zero fee for placing order.'
const APPROVED_SWAP_SUBJECTS = [
  ['ethereum', ['eth', 'wbtc']],
  ['arbitrum', ['eth', 'arb']],
  ['base', ['eth', 'wbtc']],
  ['optimism', ['eth', 'op']],
  ['polygon', ['pol']],
  ['bnb', ['bnb', 'wbtc']],
  ['avalanche', ['avax']],
  ['linea', ['eth']],
  ['sonic', ['s']],
  ['berachain', ['bera']],
  ['ronin', ['ronin']],
  ['unichain', ['eth']],
  ['hyperevm', ['eth']],
  ['plasma', ['eth']],
  ['etherlink', ['xtz']],
  ['megaeth', ['eth']],
  ['monad', ['mon']],
  ['robinhood', ['eth']],
] as const

const APPROVED_STATIC_METADATA = [
  {
    route: '/',
    title: 'KyberSwap - Limitless Access To DeFi',
    description:
      'Non-custodial platform to swap, earn, and trade crypto at the best rates across chains. Powered by an advanced multi-chain aggregator engine.',
  },
  {
    route: '/cross-chain',
    title: 'Cross-Chain Swap | KyberSwap',
    description:
      'Swap tokens between EVMs, Bitcoin, Solana, and Near chains in one step - no manual bridging. Quotes from multiple providers, best rate picked automatically.',
  },
  {
    route: '/earn',
    title: 'Explore Earning Opportunity, Provide Liquidity & Earn Yield',
    description:
      'Explore, compare, and enter DeFi liquidity positions across multiple protocols instantly, track and manage them in one place across various DeFi protocols.',
  },
  {
    route: '/earn/pools',
    title: 'Explore Earning pools across protocols.',
    description:
      'Explore and compare yield opportunities across top DeFi protocols on multiple chains - trading volume, TVL, and pool performance across networks - all from one interface without switching apps.',
  },
  {
    route: '/earn/positions',
    title: 'Liquidity Positions – Track Your Yield and Liquidity | KyberSwap',
    description:
      'Track all your active liquidity positions in one dashboard. Monitor APR, rewards, and performance across protocols - no need to check each one separately.',
  },
  {
    route: '/earn/smart-exit',
    title: 'Smart Exit – Conditional Withdrawal Liquidity | KyberSwap',
    description:
      'Set automatic exit conditions for your liquidity positions. KyberSwap Smart Exit closes a position on-chain when your target is reached - no manual monitoring required.',
  },
  {
    route: '/market-overview',
    title: 'Market Overview | KyberSwap',
    description:
      'Live token on-chain prices, trading volume, and market trends across multiple chains. Spot opportunities and jump straight into a trade from one dashboard.',
  },
  {
    route: '/kyberdao/stake-knc',
    title: 'Stake KNC | KyberSwap',
    description:
      'Stake KNC to participate in KyberDAO governance and earn rewards. Voting power and gas refunds for active stakers - help shape the future of KyberSwap.',
  },
  {
    route: '/kyberdao/vote',
    title: 'KyberDAO Governance & Voting | KyberSwap',
    description:
      'Vote on KyberDAO governance proposals (KIPs) with your staked KNC. Decide protocol parameters and earn voting rewards each epoch on KyberSwap.',
  },
  {
    route: '/kyberdao/knc-utility',
    title: 'KNC Gas Refund Program | KyberSwap',
    description:
      'Stake KNC to get your KyberSwap trading gas fees refunded. The KyberDAO gas refund program rewards active traders based on their staked KNC.',
  },
  {
    route: '/about/kyberswap',
    title: 'Swap Tokens at Superior Rates | KyberSwap',
    description:
      'KyberSwap is a decentralized platform. We provide our traders with superior token prices by analyzing rates across thousands of exchanges instantly!',
  },
  {
    route: '/about/knc',
    title: 'Kyber Network Crystal (KNC) | KyberSwap',
    description:
      'KNC is a utility and governance token and an integral part of Kyber Network and its product KyberSwap - the multi-chain decentralized exchange (DEX) that provides superior rates for traders.',
  },
] as const

const readPublicFile = (filename: string) =>
  readFileSync(new URL(`../../../public/${filename}`, import.meta.url), 'utf8')

describe('SEO contract', () => {
  describe('static sitemap inventory', () => {
    it('keeps the approved inventory boundaries', () => {
      expect(SITEMAP_SWAP_CHAIN_SLUGS).toHaveLength(18)
      expect(SITEMAP_LIMIT_CHAIN_SLUGS).toHaveLength(16)
      expect(SITEMAP_PAGE_ROUTES).toHaveLength(46)
      expect(new Set(SITEMAP_PAGE_ROUTES).size).toBe(SITEMAP_PAGE_ROUTES.length)
      expect(SITEMAP_PAGE_ROUTES[0]).toBe('/')
      expect(SITEMAP_SWAP_CHAIN_SLUGS.at(-1)).toBe('robinhood')
      expect(SITEMAP_LIMIT_CHAIN_SLUGS.at(-1)).toBe('robinhood')

      for (const chain of ['zksync', 'scroll', 'fantom', 'blast', 'mantle']) {
        expect(SITEMAP_PAGE_ROUTES).not.toContain(`/swap/${chain}`)
        expect(SITEMAP_PAGE_ROUTES).not.toContain(`/limit/${chain}`)
      }
    })

    it('gives every advertised route complete self-canonical indexable metadata', () => {
      for (const route of SITEMAP_PAGE_ROUTES) {
        const metadata = resolveRouteMetadata(route, '')
        const canonicalUrl = `${SITE_URL}${route === '/' ? '/' : route}`
        const headHtml = renderRouteHeadHtml(route)

        expect(metadata.title.trim(), route).not.toBe('')
        expect(metadata.description.trim(), route).not.toBe('')
        expect(metadata.canonicalPath, route).toBe(route)
        expect(metadata.robots, route).toMatch(/^index,follow/)

        expect(headHtml.match(/<title>/g), route).toHaveLength(1)
        expect(headHtml.match(/<meta name="description"/g), route).toHaveLength(1)
        expect(headHtml.match(/<meta name="robots"/g), route).toHaveLength(1)
        expect(headHtml.match(/<link rel="canonical"/g), route).toHaveLength(1)
        expect(headHtml, route).toContain(`<link rel="canonical" href="${canonicalUrl}" />`)
      }
    })

    it('applies the approved sitemap metadata content', () => {
      for (const { route, title, description } of APPROVED_STATIC_METADATA) {
        expect(resolveRouteMetadata(route, ''), route).toMatchObject({ title, description })
      }

      for (const chain of SITEMAP_SWAP_CHAIN_SLUGS) {
        const chainId = getChainIdFromSlug(chain)
        expect(chainId, `Unknown chain slug: ${chain}`).toBeDefined()
        if (chainId === undefined) continue

        const networkName = NETWORKS_INFO[chainId].name
        expect(resolveRouteMetadata(`/swap/${chain}`, ''), chain).toMatchObject({
          title: `KyberSwap - Swap, Trade & Earn Tokens on ${networkName} at the Best Rate`,
          description: SWAP_DESCRIPTION,
        })
      }

      for (const chain of SITEMAP_LIMIT_CHAIN_SLUGS) {
        const chainId = getChainIdFromSlug(chain)
        expect(chainId, `Unknown chain slug: ${chain}`).toBeDefined()
        if (chainId === undefined) continue

        const networkName = NETWORKS_INFO[chainId].name
        expect(resolveRouteMetadata(`/limit/${chain}`, ''), chain).toMatchObject({
          title: `Limit Orders - Set Your Target Price on ${networkName} | KyberSwap`,
          description: LIMIT_DESCRIPTION,
        })
      }
    })

    it.each([
      ['/swap/zksync', true],
      ['/swap/goerli', false],
      ['/swap/not-a-chain', false],
      ['/limit/zksync', true],
      ['/limit/etherlink', false],
      ['/limit/not-a-chain', false],
    ] as const)('applies network capability to clean chain landing %s', (route, indexable) => {
      expect(resolveRouteMetadata(route, '').robots).toMatch(indexable ? /^index,follow/ : /^noindex,follow/)
    })
  })

  describe('curated Swap catalog', () => {
    it('has a deterministic stable fallback for every promoted swap chain', () => {
      for (const chain of SITEMAP_SWAP_CHAIN_SLUGS) {
        const chainId = getChainIdFromSlug(chain)
        expect(chainId, `Unknown chain slug: ${chain}`).toBeDefined()
        if (chainId === undefined) continue
        const stableCounter = STABLE_TOKENS[chainId]
        expect(stableCounter, `Missing stable counter for ${chain}`).toBeDefined()
        expect(stableCounter?.symbol?.toLowerCase(), `Invalid stable counter for ${chain}`).toContain('usd')
      }
    })

    it('curates exactly the approved per-chain token intents', () => {
      expect(CURATED_SWAP_PAIR_ROUTES).toHaveLength(46)
      expect(new Set(CURATED_SWAP_PAIR_ROUTES).size).toBe(CURATED_SWAP_PAIR_ROUTES.length)
      expect(CURATED_SWAP_INTENT_REDIRECTS).toHaveLength(46)
      expect(new Set(CURATED_SWAP_INTENT_REDIRECTS.map(({ sourcePath }) => sourcePath)).size).toBe(46)
      expect(
        CURATED_SWAP_INTENT_REDIRECTS.every(({ targetPath }) => CURATED_SWAP_PAIR_ROUTES.includes(targetPath)),
      ).toBe(true)

      const approvedAliases = APPROVED_SWAP_SUBJECTS.flatMap(([chain, subjects]) =>
        subjects.flatMap(token => [`/buy/${chain}/${token}`, `/sell/${chain}/${token}`]),
      ).sort()
      expect(approvedAliases).toEqual(CURATED_SWAP_INTENT_REDIRECTS.map(({ sourcePath }) => sourcePath).sort())
    })

    it('makes curated clean Swap pairs self-canonical and indexable', () => {
      for (const path of CURATED_SWAP_PAIR_ROUTES) {
        const curatedPair = getCuratedSwapPairByPath(path)
        expect(curatedPair, path).toBeDefined()
        if (!curatedPair) continue

        const { chainName, intent, subjectToken } = curatedPair
        const metadata = resolveRouteMetadata(path, '')
        const intentLabel = intent === SwapIntent.BUY ? 'Buy' : 'Sell'

        expect(metadata.title, path).toBe(`${intentLabel} ${subjectToken.symbol} on ${chainName} | KyberSwap`)
        expect(metadata.description, path).toBe(
          `${intentLabel} ${subjectToken.symbol} on ${chainName} using any token in your wallet. KyberSwap aggregates DEX liquidity for competitive rates — swap instantly, no account needed.`,
        )
        expect(metadata.canonicalPath, path).toBe(path)
        expect(metadata.robots, path).toMatch(/^index,follow/)
        expect(resolveRouteMetadata(path, '?utm_source=test').canonicalPath, path).toBe(path)
        expect(resolveRouteMetadata(path, '?utm_source=test').robots, path).toMatch(/^noindex,follow/)
      }

      const uncuratedPair = '/swap/base/eth-to-knc'
      expect(resolveRouteMetadata(uncuratedPair, '').canonicalPath).toBe(uncuratedPair)
      expect(resolveRouteMetadata(uncuratedPair, '').robots).toMatch(/^noindex,follow/)
    })
  })

  describe('runtime metadata variants', () => {
    it('keeps Limit pairs full-path canonical and noindex without synchronous token validation', () => {
      const pair = '/limit/base/usdc-to-eth'
      const unresolvedPair = '/limit/base/not-a-token-to-also-not-a-token'

      expect(resolveRouteMetadata(pair, '')).toMatchObject({
        canonicalPath: pair,
        robots: 'noindex,follow',
      })
      expect(resolveRouteMetadata(pair, '?utm_source=test')).toMatchObject({
        canonicalPath: pair,
        robots: 'noindex,follow',
      })
      expect(resolveRouteMetadata(unresolvedPair, '')).toMatchObject({
        canonicalPath: unresolvedPair,
        robots: 'noindex,follow',
      })
    })

    it('normalizes a complete legacy pair to its full clean canonical', () => {
      expect(
        resolveRouteMetadata('/swap/base', '?inputCurrency=USDC&outputCurrency=ETH&utm_source=test'),
      ).toMatchObject({ canonicalPath: '/swap/base/usdc-to-eth', robots: 'noindex,follow' })
    })

    it('canonicalizes valid cross-chain state using only the four normalized state parameters', () => {
      const metadata = resolveRouteMetadata(
        '/cross-chain',
        '?tokenOut=ETH&to=1&utm_source=test&tokenIn=SOL&from=Solana',
      )

      expect(metadata).toMatchObject({
        canonicalPath: '/cross-chain?from=solana&to=1&tokenIn=SOL&tokenOut=ETH',
        robots: 'noindex,follow',
      })
    })

    it('rejects duplicate route state keys', () => {
      expect(
        resolveRouteMetadata('/swap/base', '?inputCurrency=eth&inputCurrency=weth&outputCurrency=usdc'),
      ).toMatchObject({ canonicalPath: '/swap/base', robots: 'noindex,follow' })
      expect(resolveRouteMetadata('/cross-chain', '?from=1&from=8453&to=10&tokenIn=ETH&tokenOut=USDC')).toMatchObject({
        canonicalPath: '/cross-chain',
        robots: 'noindex,follow',
      })
    })

    it('keeps malformed pool paths out of the index', () => {
      const address = `0x${'a'.repeat(40)}`

      expect(resolveRouteMetadata(`/pools/base/uniswapv3/${address}`, '')).toMatchObject({
        canonicalPath: `/pools/base/uniswapv3/${address}`,
        robots: expect.stringMatching(/^index,follow/),
      })
      expect(resolveRouteMetadata('/pools/base/uniswapv3/0x1234', '').robots).toBe('noindex,follow')
    })
  })

  describe('generated SEO artifacts', () => {
    it.each([
      ['swap', '/swap'],
      ['limit', '/limit'],
    ] as const)('keeps the shared %s shell safely noindex until OG or RouteSeo replaces it', (product, canonical) => {
      const head = renderTradeShellHeadHtml(product)

      expect(head).toContain('<meta name="robots" content="noindex,follow" />')
      expect(head).toContain(`<link rel="canonical" href="${SITE_URL}${canonical}" />`)
    })

    it('keeps the checked-in product and grouped Swap sitemaps synchronized with the catalogs', () => {
      const sitemap = readPublicFile('sitemap-pages.xml')
      const sitemapIndex = readFileSync(new URL('../../../public/sitemap.xml', import.meta.url), 'utf8')
      const locations = Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g), match => match[1])

      expect(locations).toEqual(SITEMAP_PAGE_ROUTES.map(route => `${SITE_URL}${route}`))
      expect(sitemap).not.toContain('<lastmod>')
      expect(sitemapIndex).not.toContain('<lastmod>')
      expect(sitemapIndex).toContain(`<loc>${SITE_URL}/sitemap-pages.xml</loc>`)
      expect(sitemapIndex.match(/<sitemap>/g)).toHaveLength(2)
      expect(sitemapIndex).toContain(`<loc>${SITE_URL}/sitemap-swap.xml</loc>`)

      const swapSitemap = readPublicFile('sitemap-swap.xml')
      const swapLocations = Array.from(swapSitemap.matchAll(/<loc>([^<]+)<\/loc>/g), match => match[1])
      expect(swapLocations).toEqual(CURATED_SWAP_PAIR_ROUTES.map(route => `${SITE_URL}${route}`))
      expect(swapSitemap).not.toContain('<lastmod>')
    })

    it('builds and installs the product shells and Nginx redirect map', () => {
      const nginx = readFileSync(new URL('../../../etc/nginx.conf', import.meta.url), 'utf8')
      const dockerfile = readFileSync(new URL('../../../Dockerfile', import.meta.url), 'utf8')
      const prerender = readFileSync(new URL('../../../scripts/prerender.mjs', import.meta.url), 'utf8')

      expect(nginx).toContain('map $uri $swap_intent_redirect')
      expect(nginx).toContain('return 301 $swap_intent_redirect$is_args$args;')
      expect(nginx).toContain('~^/swap(?:/|$) /swap/index.html;')
      expect(nginx).toContain('~^/limit(?:/|$) /limit/index.html;')
      expect(nginx).toContain('try_files $uri/index.html $uri $spa_fallback =404;')
      expect(dockerfile).toContain('COPY ./build/swap-intent-redirects.map /etc/nginx/swap-intent-redirects.map')
      expect(prerender).toContain('writeSwapIntentRedirectMap(prerenderManifest.swapIntentRedirects)')
    })
  })
})
