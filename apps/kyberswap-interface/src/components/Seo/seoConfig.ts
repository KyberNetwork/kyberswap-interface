import { matchPath } from 'react-router-dom'

import {
  APP_PATHS,
  KYBERSWAP_URL,
  KYBER_NETWORK_DISCORD_URL,
  KYBER_NETWORK_TELEGRAM_URL,
  KYBER_NETWORK_TWITTER_URL,
} from 'constants/index'

// Pure (no DOM access) SEO config + head-tag builder, shared by the client-side <RouteSeo>
// effect and the build-time prerender script (scripts/prerender.mjs). Keep DOM-free so it can
// run under Node during prerender.

export type StructuredData = Record<string, unknown>

export type SeoConfig = {
  canonicalPath: string
  description: string
  robots: string
  structuredData?: StructuredData[]
  title: string
}

const SITE_URL = KYBERSWAP_URL
const DEFAULT_TITLE = 'KyberSwap - Limitless Access To DeFi'
const DEFAULT_DESCRIPTION =
  'Non-custodial platform to swap, earn, and trade crypto at the best rates across chains. Powered by an advanced multi-chain aggregator engine.'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/kyberswap-og-image.png?version=2023`
const INDEX_ROBOTS = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
const NOINDEX_ROBOTS = 'noindex,follow'
export const STRUCTURED_DATA_ID = 'kyberswap-structured-data'
const ABOUT_KYBERSWAP_DESCRIPTION =
  'KyberSwap is a decentralized platform. We provide our traders with superior token prices by analyzing rates across thousands of exchanges instantly!'
const SWAP_DESCRIPTION =
  'Swap any token at the best rate across chains. An advanced aggregator splits your trade across hundreds of DEXs and liquidity sources for minimal slippage.'
const LIMIT_DESCRIPTION =
  'Auto execute with your price target. Gasless & no slippage - Kyberswap Limit Order execute on-chain automatically when the market reaches your price.'
const CROSS_CHAIN_DESCRIPTION =
  'Swap tokens between EVMs, Bitcoin, Solana, and Near chains in one step - no manual bridging. Quotes from multiple providers, best rate picked automatically.'
const EARN_DESCRIPTION =
  'Unlock the full potential of your assets. Offering data, tools, and utilities—centered around Zap technology—to help you maximize earnings from your liquidity across various DeFi protocols.'
const EARN_POOLS_DESCRIPTION =
  'Explore and compare yield opportunities across top DeFi protocols on multiple chains -  trading volume, TVL, and pool performance across networks - all from one interface without switching apps.'
const EARN_POSITIONS_DESCRIPTION =
  'Track all your active liquidity positions in one dashboard. Monitor APR, rewards, and performance across protocols - no need to check each one separately.'
const EARN_SMART_EXIT_DESCRIPTION =
  'Set automatic exit conditions for your liquidity positions. KyberSwap Smart Exit closes a position on-chain when your target is reached - no manual monitoring required.'
const MARKET_DESCRIPTION =
  'Live token on-chain prices, trading volume, and market trends across multiple chains. Spot opportunities and jump straight into a trade from one dashboard.'
const CAMPAIGNS_DESCRIPTION =
  'Earn bonus rewards and incentives while you swap, provide liquidity, or trade. Join active campaigns across supported chains - no lock-up required.'
const ABOUT_KNC_DESCRIPTION =
  'KNC is a utility and governance token and an integral part of Kyber Network and its product KyberSwap - the multi-chain decentralized exchange (DEX) that provides superior rates for traders.'
const KYBERDAO_STAKE_DESCRIPTION =
  'Stake KNC to participate in KyberDAO governance and earn rewards. Voting power and gas refunds for active stakers - help shape the future of KyberSwap.'
const KYBERDAO_VOTE_DESCRIPTION =
  'Vote on KyberDAO governance proposals (KIPs) with your staked KNC. Decide protocol parameters and earn voting rewards each epoch on KyberSwap.'
const KYBERDAO_KNC_UTILITY_DESCRIPTION =
  'Stake KNC to get your KyberSwap trading gas fees refunded. The KyberDAO gas refund program rewards active traders based on their staked KNC.'

const ORGANIZATION_SCHEMA: StructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'KyberSwap',
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.png?version=v1`,
  sameAs: [KYBER_NETWORK_TELEGRAM_URL, KYBER_NETWORK_TWITTER_URL, KYBER_NETWORK_DISCORD_URL],
}

const WEBSITE_SCHEMA: StructuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'KyberSwap',
  url: SITE_URL,
}

const normalizePath = (pathname: string) => {
  if (!pathname || pathname === '/') return '/'
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
}

export const toAbsoluteUrl = (path: string) => `${SITE_URL}${path === '/' ? '' : path}`

const getDefaultStructuredData = (path: string): StructuredData[] => [
  ORGANIZATION_SCHEMA,
  {
    ...WEBSITE_SCHEMA,
    mainEntityOfPage: toAbsoluteUrl(path),
  },
]

const getAboutStructuredData = (): StructuredData[] => [
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

export const resolveSeoConfig = (pathname: string, search: string): SeoConfig => {
  const normalizedPath = normalizePath(pathname)
  const searchParams = new URLSearchParams(search)
  const hasQueryParams = Array.from(searchParams.keys()).length > 0

  const swapPairMatch = matchPath(`${APP_PATHS.SWAP}/:network/:currency`, normalizedPath)
  if (swapPairMatch) {
    const network = swapPairMatch.params.network || 'ethereum'
    return {
      title: 'KyberSwap - Swap, Trade & Earn Tokens at the Best Rate Across Chains',
      description: SWAP_DESCRIPTION,
      canonicalPath: `${APP_PATHS.SWAP}/${network}`,
      robots: NOINDEX_ROBOTS,
      structuredData: getDefaultStructuredData(`${APP_PATHS.SWAP}/${network}`),
    }
  }

  const swapMatch = matchPath(`${APP_PATHS.SWAP}/:network`, normalizedPath)
  if (swapMatch) {
    const network = swapMatch.params.network || 'ethereum'
    const canonicalPath = `${APP_PATHS.SWAP}/${network}`
    return {
      title: 'KyberSwap - Swap, Trade & Earn Tokens at the Best Rate Across Chains',
      description: SWAP_DESCRIPTION,
      canonicalPath,
      robots: hasQueryParams ? NOINDEX_ROBOTS : INDEX_ROBOTS,
      structuredData: getDefaultStructuredData(canonicalPath),
    }
  }

  const limitMatch = matchPath(`${APP_PATHS.LIMIT}/:network/:currency?`, normalizedPath)
  if (limitMatch) {
    const network = limitMatch.params.network || 'ethereum'
    return {
      title: 'Limit Orders | KyberSwap',
      description: LIMIT_DESCRIPTION,
      canonicalPath: `${APP_PATHS.LIMIT}/${network}`,
      robots: NOINDEX_ROBOTS,
    }
  }

  if (normalizedPath === APP_PATHS.CROSS_CHAIN || normalizedPath === APP_PATHS.PARTNER_SWAP) {
    return {
      title: DEFAULT_TITLE,
      description: CROSS_CHAIN_DESCRIPTION,
      canonicalPath: normalizedPath,
      robots: NOINDEX_ROBOTS,
    }
  }

  if (normalizedPath === APP_PATHS.EARN) {
    return {
      title: 'Maximize Your Earnings in DeFi | KyberSwap',
      description: EARN_DESCRIPTION,
      canonicalPath: APP_PATHS.EARN,
      robots: hasQueryParams ? NOINDEX_ROBOTS : INDEX_ROBOTS,
      structuredData: getDefaultStructuredData(APP_PATHS.EARN),
    }
  }

  if (normalizedPath === APP_PATHS.EARN_POOLS) {
    return {
      title: 'Liquidity Pools | KyberSwap',
      description: EARN_POOLS_DESCRIPTION,
      canonicalPath: APP_PATHS.EARN_POOLS,
      robots: hasQueryParams ? NOINDEX_ROBOTS : INDEX_ROBOTS,
      structuredData: getDefaultStructuredData(APP_PATHS.EARN_POOLS),
    }
  }

  // Path-based pool detail (Phase 5): /pools/:chain/:protocol/:address. Unbounded catalog — NOT
  // prerendered/sitemapped, but the clean self-canonical URL is the intended SEO landing per pool, so
  // INDEX it (a deliberate departure from the noindex swap-pair). The per-pool <title> (tokens + fee)
  // is upgraded client-side once pool data loads (see PoolDetail). Legacy junk query -> noindex.
  const poolDetailMatch = matchPath(`${APP_PATHS.POOLS}/:chain/:protocol/:address`, normalizedPath)
  if (poolDetailMatch?.params.chain && poolDetailMatch.params.protocol && poolDetailMatch.params.address) {
    const { chain, protocol, address } = poolDetailMatch.params
    const canonicalPath = `${APP_PATHS.POOLS}/${chain}/${protocol}/${address}`
    return {
      title: 'Liquidity Pool | KyberSwap',
      description: EARN_POOLS_DESCRIPTION,
      canonicalPath,
      robots: hasQueryParams ? NOINDEX_ROBOTS : INDEX_ROBOTS,
      structuredData: getDefaultStructuredData(canonicalPath),
    }
  }

  if (normalizedPath === APP_PATHS.EARN_POSITIONS) {
    return {
      title: 'Liquidity Positions | KyberSwap',
      description: EARN_POSITIONS_DESCRIPTION,
      canonicalPath: APP_PATHS.EARN_POSITIONS,
      robots: NOINDEX_ROBOTS,
      structuredData: getDefaultStructuredData(APP_PATHS.EARN_POSITIONS),
    }
  }

  if (normalizedPath === APP_PATHS.EARN_SMART_EXIT) {
    return {
      title: 'Smart Exit Orders | KyberSwap',
      description: EARN_SMART_EXIT_DESCRIPTION,
      canonicalPath: APP_PATHS.EARN_SMART_EXIT,
      robots: NOINDEX_ROBOTS,
      structuredData: getDefaultStructuredData(APP_PATHS.EARN_SMART_EXIT),
    }
  }

  if (normalizedPath === APP_PATHS.MARKET_OVERVIEW) {
    return {
      title: 'Market Overview | KyberSwap',
      description: MARKET_DESCRIPTION,
      canonicalPath: APP_PATHS.MARKET_OVERVIEW,
      robots: NOINDEX_ROBOTS,
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

  if (normalizedPath === APP_PATHS.KYBERDAO_STAKE) {
    return {
      title: 'Stake KNC | KyberSwap',
      description: KYBERDAO_STAKE_DESCRIPTION,
      canonicalPath: APP_PATHS.KYBERDAO_STAKE,
      robots: INDEX_ROBOTS,
      structuredData: getDefaultStructuredData(APP_PATHS.KYBERDAO_STAKE),
    }
  }

  if (normalizedPath === APP_PATHS.KYBERDAO_VOTE) {
    return {
      title: 'KyberDAO Governance & Voting | KyberSwap',
      description: KYBERDAO_VOTE_DESCRIPTION,
      canonicalPath: APP_PATHS.KYBERDAO_VOTE,
      robots: INDEX_ROBOTS,
      structuredData: getDefaultStructuredData(APP_PATHS.KYBERDAO_VOTE),
    }
  }

  if (normalizedPath === APP_PATHS.KYBERDAO_KNC_UTILITY) {
    return {
      title: 'KNC Gas Refund Program | KyberSwap',
      description: KYBERDAO_KNC_UTILITY_DESCRIPTION,
      canonicalPath: APP_PATHS.KYBERDAO_KNC_UTILITY,
      robots: INDEX_ROBOTS,
      structuredData: getDefaultStructuredData(APP_PATHS.KYBERDAO_KNC_UTILITY),
    }
  }

  if (normalizedPath === `${APP_PATHS.ABOUT}/kyberswap`) {
    return {
      title: 'Swap Tokens at Superior Rates | KyberSwap',
      description: ABOUT_KYBERSWAP_DESCRIPTION,
      canonicalPath: `${APP_PATHS.ABOUT}/kyberswap`,
      robots: INDEX_ROBOTS,
      structuredData: getAboutStructuredData(),
    }
  }

  if (normalizedPath === `${APP_PATHS.ABOUT}/knc`) {
    return {
      title: 'Kyber Network Crystal (KNC) | KyberSwap',
      description: ABOUT_KNC_DESCRIPTION,
      canonicalPath: `${APP_PATHS.ABOUT}/knc`,
      robots: INDEX_ROBOTS,
      structuredData: getDefaultStructuredData(`${APP_PATHS.ABOUT}/knc`),
    }
  }

  if (normalizedPath === '/') {
    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      canonicalPath: normalizedPath,
      robots: INDEX_ROBOTS,
      structuredData: getDefaultStructuredData('/'),
    }
  }

  return {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    canonicalPath: normalizedPath,
    robots: NOINDEX_ROBOTS,
  }
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * Build the route-specific <head> inner HTML (title + meta + canonical + structured data)
 * for build-time prerender. Mirrors what <RouteSeo> sets imperatively on the client.
 */
export const buildHeadHtml = (pathname: string, search = ''): string => {
  const config = resolveSeoConfig(pathname, search)
  const canonicalUrl = toAbsoluteUrl(config.canonicalPath)
  const title = escapeHtml(config.title)
  const description = escapeHtml(config.description)

  const tags = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<meta name="robots" content="${escapeHtml(config.robots)}" />`,
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
    `<meta property="og:site_name" content="KyberSwap" />`,
    `<meta property="og:image" content="${escapeHtml(DEFAULT_OG_IMAGE)}" />`,
    `<meta property="og:image:alt" content="${title}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${escapeHtml(DEFAULT_OG_IMAGE)}" />`,
    `<meta name="twitter:image:alt" content="${title}" />`,
  ]

  if (config.structuredData?.length) {
    // Escape `</script>` so a stray closing tag in any (future-dynamic) structured-data value can't
    // break out of the script element when this string is spliced into the prerendered HTML.
    const ldJson = JSON.stringify(config.structuredData).replace(/<\/script>/gi, '\\u003c/script\\u003e')
    tags.push(`<script type="application/ld+json" id="${STRUCTURED_DATA_ID}">${ldJson}</script>`)
  }

  return tags.join('\n    ')
}
