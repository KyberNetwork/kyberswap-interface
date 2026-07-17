import { matchPath } from 'react-router-dom'

import { type CuratedSwapPair, getCuratedSwapPairByPath } from 'components/Seo/curatedSwapCatalog'
import {
  APP_PATHS,
  KYBERSWAP_URL,
  KYBER_NETWORK_DISCORD_URL,
  KYBER_NETWORK_TELEGRAM_URL,
  KYBER_NETWORK_TWITTER_URL,
} from 'constants/index'
import { MAINNET_NETWORKS, NETWORKS_INFO, isSupportLimitOrder } from 'constants/networks'
import { SwapIntent } from 'utils/routes'

// Pure route metadata shared by client-side <RouteSeo> and static trade shells.
// Keep DOM-free so it can run under Node during build-time rendering.

export type JsonLdObject = Record<string, unknown>

export type RouteSeoMetadata = {
  canonicalPath: string
  description: string
  jsonLd?: JsonLdObject[]
  robots: string
  title: string
}

export type TradeProduct = 'limit' | 'swap'

type SeoCopy = Pick<RouteSeoMetadata, 'title' | 'description'>

// Shared metadata policy.
const SITE_URL = KYBERSWAP_URL

const DEFAULT_TITLE = 'KyberSwap - Limitless Access To DeFi'
const DEFAULT_DESCRIPTION =
  'Non-custodial platform to swap, earn, and trade crypto at the best rates across chains. Powered by an advanced multi-chain aggregator engine.'
const INDEX_ROBOTS = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
const NOINDEX_ROBOTS = 'noindex,follow'
const POOL_ADDRESS_RE = /^0x(?:[0-9a-f]{40}|[0-9a-f]{64})$/

// Route metadata content, ordered to match resolveRouteMetadata below.
// Sitemap: Swap - per chain
const SWAP_TITLE = 'KyberSwap - Swap, Trade & Earn Tokens at the Best Rate Across Chains'
const SWAP_DESCRIPTION =
  'Swap any token at the best rate across chains. An advanced aggregator splits your trade across hundreds of DEXs and liquidity sources for minimal slippage.'
const DEFAULT_SWAP_SEO_COPY: SeoCopy = { title: SWAP_TITLE, description: SWAP_DESCRIPTION }

// Sitemap: Limit Orders - per chain
const LIMIT_TITLE = 'Limit Orders | KyberSwap'
const LIMIT_DESCRIPTION =
  'Set a target price and your order settles on-chain automatically when the market reaches it. Gasless submission, no slippage, zero fee for placing order.'
const DEFAULT_LIMIT_SEO_COPY: SeoCopy = { title: LIMIT_TITLE, description: LIMIT_DESCRIPTION }

// Sitemap: Cross-chain and Earn
const CROSS_CHAIN_DESCRIPTION =
  'Swap tokens between EVMs, Bitcoin, Solana, and Near chains in one step - no manual bridging. Quotes from multiple providers, best rate picked automatically.'
const EARN_DESCRIPTION =
  'Explore, compare, and enter DeFi liquidity positions across multiple protocols instantly, track and manage them in one place across various DeFi protocols.'
const EARN_POOLS_DESCRIPTION =
  'Explore and compare yield opportunities across top DeFi protocols on multiple chains - trading volume, TVL, and pool performance across networks - all from one interface without switching apps.'
const EARN_POSITIONS_DESCRIPTION =
  'Track all your active liquidity positions in one dashboard. Monitor APR, rewards, and performance across protocols - no need to check each one separately.'
const EARN_SMART_EXIT_DESCRIPTION =
  'Set automatic exit conditions for your liquidity positions. KyberSwap Smart Exit closes a position on-chain when your target is reached - no manual monitoring required.'

// Sitemap: Market, KyberDAO, and About
const MARKET_DESCRIPTION =
  'Live token on-chain prices, trading volume, and market trends across multiple chains. Spot opportunities and jump straight into a trade from one dashboard.'
const KYBERDAO_STAKE_DESCRIPTION =
  'Stake KNC to participate in KyberDAO governance and earn rewards. Voting power and gas refunds for active stakers - help shape the future of KyberSwap.'
const KYBERDAO_VOTE_DESCRIPTION =
  'Vote on KyberDAO governance proposals (KIPs) with your staked KNC. Decide protocol parameters and earn voting rewards each epoch on KyberSwap.'
const KYBERDAO_KNC_UTILITY_DESCRIPTION =
  'Stake KNC to get your KyberSwap trading gas fees refunded. The KyberDAO gas refund program rewards active traders based on their staked KNC.'
const ABOUT_KYBERSWAP_DESCRIPTION =
  'KyberSwap is a decentralized platform. We provide our traders with superior token prices by analyzing rates across thousands of exchanges instantly!'
const ABOUT_KNC_DESCRIPTION =
  'KNC is a utility and governance token and an integral part of Kyber Network and its product KyberSwap - the multi-chain decentralized exchange (DEX) that provides superior rates for traders.'

// Runtime-only routes outside the sitemap inventory
const CAMPAIGNS_DESCRIPTION =
  'Earn bonus rewards and incentives while you swap, provide liquidity, or trade. Join active campaigns across supported chains - no lock-up required.'

// Route parsing and metadata helpers.
const normalizePathname = (pathname: string) => {
  if (!pathname || pathname === '/') return '/'
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
}

const getMainnetChainIdByRoute = (networkRoute: string) =>
  MAINNET_NETWORKS.find(chainId => NETWORKS_INFO[chainId].route === networkRoute)

const getNetworkNameByRoute = (networkRoute: string) => {
  const chainId = getMainnetChainIdByRoute(networkRoute)
  return chainId === undefined ? undefined : NETWORKS_INFO[chainId].name
}

const supportsLimitOrder = (networkRoute: string) => {
  const chainId = getMainnetChainIdByRoute(networkRoute)
  if (chainId === undefined) return false
  return isSupportLimitOrder(chainId)
}

const getSwapSeoCopy = (networkRoute: string): SeoCopy => {
  const networkName = getNetworkNameByRoute(networkRoute)
  return networkName
    ? {
        title: `KyberSwap - Swap, Trade & Earn Tokens on ${networkName} at the Best Rate`,
        description: SWAP_DESCRIPTION,
      }
    : DEFAULT_SWAP_SEO_COPY
}

// Buy/sell aliases return HTTP 301, so their search-intent copy belongs on the canonical Swap pair target.
const getCuratedSwapPairSeoCopy = ({ chainName, intent, subjectToken }: CuratedSwapPair): SeoCopy => {
  const intentLabel = intent === SwapIntent.BUY ? 'Buy' : 'Sell'

  return {
    title: `${intentLabel} ${subjectToken.symbol} on ${chainName} | KyberSwap`,
    description: `${intentLabel} ${subjectToken.symbol} on ${chainName} using any token in your wallet. KyberSwap aggregates DEX liquidity for competitive rates — swap instantly, no account needed.`,
  }
}

const getLimitSeoCopy = (networkRoute: string): SeoCopy => {
  const networkName = getNetworkNameByRoute(networkRoute)
  return networkName
    ? {
        title: `Limit Orders - Set Your Target Price on ${networkName} | KyberSwap`,
        description: LIMIT_DESCRIPTION,
      }
    : DEFAULT_LIMIT_SEO_COPY
}

const getLegacyPairCanonicalPath = (productPath: string, networkRoute: string, searchParams: URLSearchParams) => {
  const tokenIn = searchParams.get('inputCurrency')?.trim().toLowerCase()
  const tokenOut = searchParams.get('outputCurrency')?.trim().toLowerCase()
  if (!tokenIn || !tokenOut || tokenIn === tokenOut || tokenIn.includes('-to-') || tokenOut.includes('-to-'))
    return undefined

  return `${productPath}/${networkRoute.toLowerCase()}/${encodeURIComponent(tokenIn)}-to-${encodeURIComponent(
    tokenOut,
  )}`
}

const getCrossChainCanonicalPath = (searchParams: URLSearchParams) => {
  const from = searchParams.get('from')?.trim().toLowerCase()
  const to = searchParams.get('to')?.trim().toLowerCase()
  const tokenIn = searchParams.get('tokenIn')?.trim()
  const tokenOut = searchParams.get('tokenOut')?.trim()

  if (!from || !to || !tokenIn || !tokenOut) return undefined

  const normalizedState = new URLSearchParams({ from, to, tokenIn, tokenOut })
  return `${APP_PATHS.CROSS_CHAIN}?${normalizedState.toString()}`
}

// Home is `${SITE_URL}/` (trailing slash) to match index.html's canonical + sitemap.xml; other paths
// already start with '/', so they append directly.
export const toSiteUrl = (path: string) => (path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`)

// Structured-data templates and builders shared by route configs.
const ORGANIZATION_SCHEMA: JsonLdObject = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'KyberSwap',
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.png?version=v1`,
  sameAs: [KYBER_NETWORK_TELEGRAM_URL, KYBER_NETWORK_TWITTER_URL, KYBER_NETWORK_DISCORD_URL],
}

const WEBSITE_SCHEMA: JsonLdObject = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'KyberSwap',
  url: SITE_URL,
}

const buildSiteJsonLd = (path: string): JsonLdObject[] => [
  ORGANIZATION_SCHEMA,
  {
    ...WEBSITE_SCHEMA,
    mainEntityOfPage: toSiteUrl(path),
  },
]

const buildAboutPageJsonLd = (): JsonLdObject[] => [
  ORGANIZATION_SCHEMA,
  {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About KyberSwap',
    url: `${SITE_URL}/about/kyberswap`,
    description: ABOUT_KYBERSWAP_DESCRIPTION,
    about: {
      '@type': 'Organization',
      name: 'KyberSwap',
      url: SITE_URL,
    },
  },
]

// Route-to-head policy used by both the SPA and prerender pipeline.
export const resolveRouteMetadata = (pathname: string, search: string): RouteSeoMetadata => {
  const normalizedPath = normalizePathname(pathname)
  const searchParams = new URLSearchParams(search)
  const hasQueryParams = Array.from(searchParams.keys()).length > 0

  // Sitemap: Core
  if (normalizedPath === '/') {
    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      canonicalPath: normalizedPath,
      robots: hasQueryParams ? NOINDEX_ROBOTS : INDEX_ROBOTS,
      jsonLd: buildSiteJsonLd('/'),
    }
  }

  // Keep Swap pair routes before chain landings because their canonical and robots policies differ.
  const swapPairMatch = matchPath(`${APP_PATHS.SWAP}/:network/:currency`, normalizedPath)
  if (swapPairMatch) {
    const networkRoute = swapPairMatch.params.network || 'ethereum'
    const canonicalPath = normalizedPath
    const curatedPair = getCuratedSwapPairByPath(canonicalPath)
    return {
      ...(curatedPair ? getCuratedSwapPairSeoCopy(curatedPair) : getSwapSeoCopy(networkRoute)),
      canonicalPath,
      jsonLd: buildSiteJsonLd(canonicalPath),
      robots: curatedPair && !hasQueryParams ? INDEX_ROBOTS : NOINDEX_ROBOTS,
    }
  }

  const swapMatch = matchPath(`${APP_PATHS.SWAP}/:network`, normalizedPath)
  if (swapMatch) {
    const networkRoute = (swapMatch.params.network || 'ethereum').toLowerCase()
    const isKnownMainnetRoute = getMainnetChainIdByRoute(networkRoute) !== undefined
    const canonicalPath =
      (isKnownMainnetRoute && getLegacyPairCanonicalPath(APP_PATHS.SWAP, networkRoute, searchParams)) ||
      `${APP_PATHS.SWAP}/${networkRoute}`
    return {
      ...getSwapSeoCopy(networkRoute),
      canonicalPath,
      jsonLd: buildSiteJsonLd(canonicalPath),
      robots: !isKnownMainnetRoute || hasQueryParams ? NOINDEX_ROBOTS : INDEX_ROBOTS,
    }
  }

  // Sitemap: Limit Orders - per chain. Interface cannot validate arbitrary pair token identities
  // synchronously, so pair routes stay noindex while retaining their full clean canonical path.
  const limitPairMatch = matchPath(`${APP_PATHS.LIMIT}/:network/:currency`, normalizedPath)
  if (limitPairMatch) {
    const networkRoute = limitPairMatch.params.network || 'ethereum'
    return {
      ...getLimitSeoCopy(networkRoute),
      canonicalPath: normalizedPath,
      jsonLd: buildSiteJsonLd(normalizedPath),
      robots: NOINDEX_ROBOTS,
    }
  }

  const limitMatch = matchPath(`${APP_PATHS.LIMIT}/:network`, normalizedPath)
  if (limitMatch) {
    const networkRoute = (limitMatch.params.network || 'ethereum').toLowerCase()
    const isSupportedLimitRoute = supportsLimitOrder(networkRoute)
    const canonicalPath =
      (isSupportedLimitRoute && getLegacyPairCanonicalPath(APP_PATHS.LIMIT, networkRoute, searchParams)) ||
      `${APP_PATHS.LIMIT}/${networkRoute}`
    return {
      ...getLimitSeoCopy(networkRoute),
      canonicalPath,
      jsonLd: buildSiteJsonLd(canonicalPath),
      robots: !isSupportedLimitRoute || hasQueryParams ? NOINDEX_ROBOTS : INDEX_ROBOTS,
    }
  }

  // Sitemap: Cross-chain and Earn
  if (normalizedPath === APP_PATHS.CROSS_CHAIN) {
    const canonicalPath = getCrossChainCanonicalPath(searchParams) || normalizedPath
    return {
      title: 'Cross-Chain Swap | KyberSwap',
      description: CROSS_CHAIN_DESCRIPTION,
      canonicalPath,
      jsonLd: buildSiteJsonLd(canonicalPath),
      robots: hasQueryParams ? NOINDEX_ROBOTS : INDEX_ROBOTS,
    }
  }

  if (normalizedPath === APP_PATHS.EARN) {
    return {
      title: 'Explore Earning Opportunity, Provide Liquidity & Earn Yield',
      description: EARN_DESCRIPTION,
      canonicalPath: APP_PATHS.EARN,
      jsonLd: buildSiteJsonLd(APP_PATHS.EARN),
      robots: hasQueryParams ? NOINDEX_ROBOTS : INDEX_ROBOTS,
    }
  }

  if (normalizedPath === APP_PATHS.EARN_POOLS) {
    return {
      title: 'Explore Earning pools across protocols.',
      description: EARN_POOLS_DESCRIPTION,
      canonicalPath: APP_PATHS.EARN_POOLS,
      jsonLd: buildSiteJsonLd(APP_PATHS.EARN_POOLS),
      robots: hasQueryParams ? NOINDEX_ROBOTS : INDEX_ROBOTS,
    }
  }

  if (normalizedPath === APP_PATHS.EARN_POSITIONS) {
    return {
      title: 'Liquidity Positions – Track Your Yield and Liquidity | KyberSwap',
      description: EARN_POSITIONS_DESCRIPTION,
      canonicalPath: APP_PATHS.EARN_POSITIONS,
      jsonLd: buildSiteJsonLd(APP_PATHS.EARN_POSITIONS),
      robots: hasQueryParams ? NOINDEX_ROBOTS : INDEX_ROBOTS,
    }
  }

  if (normalizedPath === APP_PATHS.EARN_SMART_EXIT) {
    return {
      title: 'Smart Exit – Conditional Withdrawal Liquidity | KyberSwap',
      description: EARN_SMART_EXIT_DESCRIPTION,
      canonicalPath: APP_PATHS.EARN_SMART_EXIT,
      jsonLd: buildSiteJsonLd(APP_PATHS.EARN_SMART_EXIT),
      robots: hasQueryParams ? NOINDEX_ROBOTS : INDEX_ROBOTS,
    }
  }

  // Sitemap: Market, KyberDAO, and About
  if (normalizedPath === APP_PATHS.MARKET_OVERVIEW) {
    return {
      title: 'Market Overview | KyberSwap',
      description: MARKET_DESCRIPTION,
      canonicalPath: APP_PATHS.MARKET_OVERVIEW,
      robots: hasQueryParams ? NOINDEX_ROBOTS : INDEX_ROBOTS,
    }
  }

  if (normalizedPath === APP_PATHS.KYBERDAO_STAKE) {
    return {
      title: 'Stake KNC | KyberSwap',
      description: KYBERDAO_STAKE_DESCRIPTION,
      canonicalPath: APP_PATHS.KYBERDAO_STAKE,
      jsonLd: buildSiteJsonLd(APP_PATHS.KYBERDAO_STAKE),
      robots: hasQueryParams ? NOINDEX_ROBOTS : INDEX_ROBOTS,
    }
  }

  if (normalizedPath === APP_PATHS.KYBERDAO_VOTE) {
    return {
      title: 'KyberDAO Governance & Voting | KyberSwap',
      description: KYBERDAO_VOTE_DESCRIPTION,
      canonicalPath: APP_PATHS.KYBERDAO_VOTE,
      jsonLd: buildSiteJsonLd(APP_PATHS.KYBERDAO_VOTE),
      robots: hasQueryParams ? NOINDEX_ROBOTS : INDEX_ROBOTS,
    }
  }

  if (normalizedPath === APP_PATHS.KYBERDAO_KNC_UTILITY) {
    return {
      title: 'KNC Gas Refund Program | KyberSwap',
      description: KYBERDAO_KNC_UTILITY_DESCRIPTION,
      canonicalPath: APP_PATHS.KYBERDAO_KNC_UTILITY,
      jsonLd: buildSiteJsonLd(APP_PATHS.KYBERDAO_KNC_UTILITY),
      robots: hasQueryParams ? NOINDEX_ROBOTS : INDEX_ROBOTS,
    }
  }

  if (normalizedPath === `${APP_PATHS.ABOUT}/kyberswap`) {
    return {
      title: 'Swap Tokens at Superior Rates | KyberSwap',
      description: ABOUT_KYBERSWAP_DESCRIPTION,
      canonicalPath: `${APP_PATHS.ABOUT}/kyberswap`,
      jsonLd: buildAboutPageJsonLd(),
      robots: hasQueryParams ? NOINDEX_ROBOTS : INDEX_ROBOTS,
    }
  }

  if (normalizedPath === `${APP_PATHS.ABOUT}/knc`) {
    return {
      title: 'Kyber Network Crystal (KNC) | KyberSwap',
      description: ABOUT_KNC_DESCRIPTION,
      canonicalPath: `${APP_PATHS.ABOUT}/knc`,
      jsonLd: buildSiteJsonLd(`${APP_PATHS.ABOUT}/knc`),
      robots: hasQueryParams ? NOINDEX_ROBOTS : INDEX_ROBOTS,
    }
  }

  // Runtime-only routes outside the sitemap inventory.
  if (normalizedPath === APP_PATHS.PARTNER_SWAP) {
    return {
      title: DEFAULT_TITLE,
      description: CROSS_CHAIN_DESCRIPTION,
      canonicalPath: normalizedPath,
      robots: NOINDEX_ROBOTS,
    }
  }

  // Path-based pool detail: /pools/:chain/:protocol/:address. Unbounded catalog — NOT
  // prerendered/sitemapped. A clean supported and lightly validated path is the intended SEO landing, while OG
  // remains responsible for resolving actual pool existence for crawlers. The per-pool <title> (tokens + fee) is
  // upgraded client-side once pool data loads (see PoolDetail). Junk query string -> noindex.
  const poolDetailMatch = matchPath(`${APP_PATHS.POOLS}/:chain/:protocol/:address`, normalizedPath)
  if (poolDetailMatch?.params.chain && poolDetailMatch.params.protocol && poolDetailMatch.params.address) {
    const chain = poolDetailMatch.params.chain.toLowerCase()
    const protocol = poolDetailMatch.params.protocol.toLowerCase()
    const address = poolDetailMatch.params.address.toLowerCase()
    const canonicalPath = `${APP_PATHS.POOLS}/${chain}/${protocol}/${address}`
    const isValidPoolPath = getMainnetChainIdByRoute(chain) !== undefined && POOL_ADDRESS_RE.test(address)

    if (isValidPoolPath)
      return {
        title: 'Liquidity Pool | KyberSwap',
        description: EARN_POOLS_DESCRIPTION,
        canonicalPath,
        jsonLd: buildSiteJsonLd(canonicalPath),
        robots: hasQueryParams ? NOINDEX_ROBOTS : INDEX_ROBOTS,
      }
  }

  const campaignsMatch = matchPath('/campaigns/*', normalizedPath)
  if (campaignsMatch) {
    return {
      title: 'Campaigns | KyberSwap',
      description: CAMPAIGNS_DESCRIPTION,
      canonicalPath: normalizedPath,
      robots: NOINDEX_ROBOTS,
    }
  }

  return {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    canonicalPath: normalizedPath,
    robots: NOINDEX_ROBOTS,
  }
}

/**
 * Product shells are shared by every child URL, so their build-time head must never claim that the
 * representative render route is canonical or indexable. OG replaces this head for crawlers and
 * RouteSeo replaces it after the browser app mounts.
 */
export const resolveTradeShellMetadata = (product: TradeProduct): RouteSeoMetadata => {
  const isSwap = product === 'swap'
  return {
    ...(isSwap ? DEFAULT_SWAP_SEO_COPY : DEFAULT_LIMIT_SEO_COPY),
    canonicalPath: isSwap ? APP_PATHS.SWAP : APP_PATHS.LIMIT,
    robots: NOINDEX_ROBOTS,
  }
}
