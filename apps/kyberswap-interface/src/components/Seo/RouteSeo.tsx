import { useEffect, useMemo } from 'react'
import { matchPath, useLocation } from 'react-router-dom'

import {
  APP_PATHS,
  KYBERSWAP_DOMAIN,
  KYBER_NETWORK_DISCORD_URL,
  KYBER_NETWORK_TELEGRAM_URL,
  KYBER_NETWORK_TWITTER_URL,
} from 'constants/index'

type StructuredData = Record<string, unknown>

type SeoConfig = {
  canonicalPath: string
  description: string
  robots: string
  structuredData?: StructuredData[]
  title: string
}

const SITE_URL = `https://${KYBERSWAP_DOMAIN}`
const DEFAULT_TITLE = 'KyberSwap - Limitless Access To DeFi'
const DEFAULT_DESCRIPTION =
  'KyberSwap is a multi-chain aggregator and DeFi hub that empowers users with the insights and tools to achieve financial autonomy. All the above while being fast, secure, and easy-to-use.'
const DEFAULT_OG_IMAGE = `${SITE_URL}/kyberswap-og-image.png?version=2023`
const INDEX_ROBOTS = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
const NOINDEX_ROBOTS = 'noindex,follow'
const STRUCTURED_DATA_ID = 'kyberswap-structured-data'
const ABOUT_KYBERSWAP_DESCRIPTION =
  'KyberSwap is a decentralized platform. We provide our traders with superior token prices by analyzing rates across thousands of exchanges instantly!'
const SWAP_DESCRIPTION = 'Instantly buy or sell tokens at superior prices'
const LIMIT_DESCRIPTION = 'Buy or sell tokens at customized prices'
const CROSS_CHAIN_DESCRIPTION = 'Swap between tokens on different chains'
const EARN_DESCRIPTION =
  'Unlock the full potential of your assets. Offering data, tools, and utilities—centered around Zap technology—to help you maximize earnings from your liquidity across various DeFi protocols.'
const EARN_POOLS_DESCRIPTION = 'Explore and instantly add liquidity to high-APY pools the easy way with Zap Technology.'
const ABOUT_KNC_DESCRIPTION =
  'KNC is a utility and governance token and an integral part of Kyber Network and its product KyberSwap - the multi-chain decentralized exchange (DEX) that provides superior rates for traders.'

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

const toAbsoluteUrl = (path: string) => `${SITE_URL}${path === '/' ? '' : path}`

const setMetaTag = (selector: string, attributes: Record<string, string>, content: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector)

  if (!element) {
    element = document.createElement('meta')
    Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value))
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}

const setCanonicalLink = (href: string) => {
  let element = document.head.querySelector<HTMLLinkElement>("link[rel='canonical']")

  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', 'canonical')
    document.head.appendChild(element)
  }

  element.setAttribute('href', href)
}

const setStructuredData = (structuredData?: StructuredData[]) => {
  const existing = document.getElementById(STRUCTURED_DATA_ID)

  if (!structuredData?.length) {
    existing?.remove()
    return
  }

  const script = existing ?? document.createElement('script')
  script.id = STRUCTURED_DATA_ID
  script.setAttribute('type', 'application/ld+json')
  script.textContent = JSON.stringify(structuredData)

  if (!existing) {
    document.head.appendChild(script)
  }
}

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

const resolveSeoConfig = (pathname: string, search: string): SeoConfig => {
  const normalizedPath = normalizePath(pathname)
  const searchParams = new URLSearchParams(search)
  const hasQueryParams = Array.from(searchParams.keys()).length > 0

  const swapPairMatch = matchPath(`${APP_PATHS.SWAP}/:network/:currency`, normalizedPath)
  if (swapPairMatch) {
    const network = swapPairMatch.params.network || 'ethereum'
    return {
      title: 'Swap | KyberSwap',
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
      title: 'Swap | KyberSwap',
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

/**
 * Temporary client-side SEO layer for the current SPA setup.
 *
 * This updates document head tags after route changes so targeted pages can expose
 * route-specific metadata before we move important routes to SSR/prerender.
 *
 * Limitation: crawlers that do not execute JavaScript will only see the static
 * metadata from index.html.
 */
export default function RouteSeo() {
  const location = useLocation()

  const seoConfig = useMemo(
    () => resolveSeoConfig(location.pathname, location.search),
    [location.pathname, location.search],
  )

  useEffect(() => {
    const canonicalUrl = toAbsoluteUrl(seoConfig.canonicalPath)

    document.title = seoConfig.title

    setCanonicalLink(canonicalUrl)
    setMetaTag("meta[name='description']", { name: 'description' }, seoConfig.description)
    setMetaTag("meta[name='robots']", { name: 'robots' }, seoConfig.robots)
    setMetaTag("meta[property='og:title']", { property: 'og:title' }, seoConfig.title)
    setMetaTag("meta[property='og:description']", { property: 'og:description' }, seoConfig.description)
    setMetaTag("meta[property='og:type']", { property: 'og:type' }, 'website')
    setMetaTag("meta[property='og:url']", { property: 'og:url' }, canonicalUrl)
    setMetaTag("meta[property='og:site_name']", { property: 'og:site_name' }, 'KyberSwap')
    setMetaTag("meta[property='og:image']", { property: 'og:image' }, DEFAULT_OG_IMAGE)
    setMetaTag("meta[name='twitter:card']", { name: 'twitter:card' }, 'summary_large_image')
    setMetaTag("meta[name='twitter:title']", { name: 'twitter:title' }, seoConfig.title)
    setMetaTag("meta[name='twitter:description']", { name: 'twitter:description' }, seoConfig.description)
    setMetaTag("meta[name='twitter:image']", { name: 'twitter:image' }, DEFAULT_OG_IMAGE)
    setStructuredData(seoConfig.structuredData)
  }, [seoConfig])

  return null
}
