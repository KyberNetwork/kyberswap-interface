import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { DEFAULT_OUTPUT_TOKEN_BY_CHAIN } from 'constants/tokens'
import { getChainIdFromSlug } from 'utils/string'

import {
  PRODUCT_SITEMAP_ROUTES,
  PRODUCT_SITEMAP_SECTIONS,
  SITEMAP_LIMIT_CHAIN_SLUGS,
  SITEMAP_SWAP_CHAIN_SLUGS,
} from './productRoutes'
import { buildHeadHtml, resolveSeoConfig } from './seoConfig'

const SITE_URL = 'https://kyberswap.com'

describe('product sitemap routes', () => {
  it('keeps the approved inventory boundaries', () => {
    expect(SITEMAP_SWAP_CHAIN_SLUGS).toHaveLength(18)
    expect(SITEMAP_LIMIT_CHAIN_SLUGS).toHaveLength(16)
    expect(PRODUCT_SITEMAP_ROUTES).toHaveLength(46)
    expect(new Set(PRODUCT_SITEMAP_ROUTES).size).toBe(PRODUCT_SITEMAP_ROUTES.length)
    expect(PRODUCT_SITEMAP_ROUTES[0]).toBe('/')
    expect(SITEMAP_SWAP_CHAIN_SLUGS.at(-1)).toBe('robinhood')
    expect(SITEMAP_LIMIT_CHAIN_SLUGS.at(-1)).toBe('robinhood')

    for (const chain of ['zksync', 'scroll', 'fantom', 'blast', 'mantle']) {
      expect(PRODUCT_SITEMAP_ROUTES).not.toContain(`/swap/${chain}`)
      expect(PRODUCT_SITEMAP_ROUTES).not.toContain(`/limit/${chain}`)
    }
  })

  it('gives every advertised route complete self-canonical indexable metadata', () => {
    for (const route of PRODUCT_SITEMAP_ROUTES) {
      const config = resolveSeoConfig(route, '')
      const canonicalUrl = `${SITE_URL}${route === '/' ? '/' : route}`
      const headHtml = buildHeadHtml(route)

      expect(config.title.trim(), route).not.toBe('')
      expect(config.description.trim(), route).not.toBe('')
      expect(config.canonicalPath, route).toBe(route)
      expect(config.robots, route).toMatch(/^index,follow/)

      expect(headHtml.match(/<title>/g), route).toHaveLength(1)
      expect(headHtml.match(/<meta name="description"/g), route).toHaveLength(1)
      expect(headHtml.match(/<meta name="robots"/g), route).toHaveLength(1)
      expect(headHtml.match(/<link rel="canonical"/g), route).toHaveLength(1)
      expect(headHtml, route).toContain(`<link rel="canonical" href="${canonicalUrl}" />`)
    }
  })

  it('has an existing quote-token mapping for every promoted swap chain', () => {
    for (const chain of SITEMAP_SWAP_CHAIN_SLUGS) {
      const chainId = getChainIdFromSlug(chain)
      expect(chainId, `Unknown chain slug: ${chain}`).toBeDefined()
      if (chainId === undefined) continue
      expect(DEFAULT_OUTPUT_TOKEN_BY_CHAIN[chainId], `Missing quote token for ${chain}`).toBeDefined()
    }
  })

  it('keeps the checked-in product sitemap and index synchronized with the catalog', () => {
    const sitemap = readFileSync(new URL('../../../public/sitemap-pages.xml', import.meta.url), 'utf8')
    const sitemapIndex = readFileSync(new URL('../../../public/sitemap.xml', import.meta.url), 'utf8')
    const locations = Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g), match => match[1])

    expect(locations).toEqual(PRODUCT_SITEMAP_ROUTES.map(route => `${SITE_URL}${route}`))
    expect(sitemap).not.toContain('<lastmod>')
    expect(sitemapIndex).not.toContain('<lastmod>')
    let previousSectionIndex = -1
    for (const { title } of PRODUCT_SITEMAP_SECTIONS) {
      const sectionIndex = sitemap.indexOf(`<!-- ${title} -->`)
      expect(sectionIndex, title).toBeGreaterThan(previousSectionIndex)
      previousSectionIndex = sectionIndex
    }
    expect(sitemapIndex).toContain(`<loc>${SITE_URL}/sitemap-pages.xml</loc>`)
    expect(sitemapIndex.match(/<sitemap>/g)).toHaveLength(1)
  })
})
