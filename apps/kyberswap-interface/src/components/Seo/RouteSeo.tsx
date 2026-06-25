import { useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import {
  DEFAULT_OG_IMAGE,
  STRUCTURED_DATA_ID,
  StructuredData,
  resolveSeoConfig,
  toAbsoluteUrl,
} from 'components/Seo/seoConfig'

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

/**
 * Client-side SEO layer for SPA navigation.
 *
 * Updates document head tags after route changes so each route exposes its own metadata.
 * Prerendered routes already ship the correct <head> (injected at build time from the same
 * `resolveSeoConfig` via scripts/prerender.mjs); this keeps it in sync as the user navigates.
 *
 * The pure config + tag data lives in components/Seo/seoConfig.ts so build-time prerender and
 * this runtime effect stay identical.
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
    setMetaTag("meta[property='og:image:alt']", { property: 'og:image:alt' }, seoConfig.title)
    setMetaTag("meta[name='twitter:card']", { name: 'twitter:card' }, 'summary_large_image')
    setMetaTag("meta[name='twitter:title']", { name: 'twitter:title' }, seoConfig.title)
    setMetaTag("meta[name='twitter:description']", { name: 'twitter:description' }, seoConfig.description)
    setMetaTag("meta[name='twitter:image']", { name: 'twitter:image' }, DEFAULT_OG_IMAGE)
    setMetaTag("meta[name='twitter:image:alt']", { name: 'twitter:image:alt' }, seoConfig.title)
    setStructuredData(seoConfig.structuredData)
  }, [seoConfig])

  return null
}
