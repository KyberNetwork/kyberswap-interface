import { useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import { type JsonLdObject, resolveRouteMetadata, toSiteUrl } from 'components/Seo/routeMetadata'
import { DEFAULT_SOCIAL_IMAGE_URL, JSON_LD_SCRIPT_ID, SERVER_SEO_PATH_META_NAME } from 'components/Seo/seoHead'

// Browser-only head writers. Route policy remains DOM-free in routeMetadata.ts.
const upsertCanonicalLink = (href: string) => {
  let element = document.head.querySelector<HTMLLinkElement>("link[rel='canonical']")

  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', 'canonical')
    document.head.appendChild(element)
  }

  element.setAttribute('href', href)
}

const upsertMetaTag = (selector: string, attributes: Record<string, string>, content: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector)

  if (!element) {
    element = document.createElement('meta')
    Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value))
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}

const syncJsonLd = (jsonLd?: JsonLdObject[]) => {
  const existing = document.getElementById(JSON_LD_SCRIPT_ID)

  if (!jsonLd?.length) {
    existing?.remove()
    return
  }

  const script = existing ?? document.createElement('script')
  script.id = JSON_LD_SCRIPT_ID
  script.setAttribute('type', 'application/ld+json')
  script.textContent = JSON.stringify(jsonLd)

  if (!existing) {
    document.head.appendChild(script)
  }
}

/**
 * Client-side SEO layer for SPA navigation.
 *
 * Updates document head tags after route changes so each route exposes its own metadata.
 * Distinct static routes already ship the correct <head>. Shared Swap/Limit shells ship a safe
 * noindex head that this replaces from the requested browser URL after mount. A matching server
 * SEO marker preserves OG's request-specific head until the browser navigates to another URL.
 *
 * The pure route policy lives in components/Seo/routeMetadata.ts so browser navigation remains
 * consistent with the Interface route policy.
 */
export default function RouteSeo() {
  const location = useLocation()
  const currentPath = `${location.pathname}${location.search}`

  const metadata = useMemo(
    () => resolveRouteMetadata(location.pathname, location.search),
    [location.pathname, location.search],
  )

  useEffect(() => {
    const serverSeoPathMarker = document.head.querySelector<HTMLMetaElement>(
      `meta[name='${SERVER_SEO_PATH_META_NAME}']`,
    )
    if (serverSeoPathMarker?.content === currentPath) return
    serverSeoPathMarker?.remove()

    const canonicalUrl = toSiteUrl(metadata.canonicalPath)

    // Base metadata.
    document.title = metadata.title
    upsertCanonicalLink(canonicalUrl)
    upsertMetaTag("meta[name='description']", { name: 'description' }, metadata.description)
    upsertMetaTag("meta[name='robots']", { name: 'robots' }, metadata.robots)

    // Open Graph metadata.
    upsertMetaTag("meta[property='og:title']", { property: 'og:title' }, metadata.title)
    upsertMetaTag("meta[property='og:description']", { property: 'og:description' }, metadata.description)
    upsertMetaTag("meta[property='og:type']", { property: 'og:type' }, 'website')
    upsertMetaTag("meta[property='og:url']", { property: 'og:url' }, canonicalUrl)
    upsertMetaTag("meta[property='og:site_name']", { property: 'og:site_name' }, 'KyberSwap')
    upsertMetaTag("meta[property='og:image']", { property: 'og:image' }, DEFAULT_SOCIAL_IMAGE_URL)
    upsertMetaTag("meta[property='og:image:alt']", { property: 'og:image:alt' }, metadata.title)

    // Twitter metadata.
    upsertMetaTag("meta[name='twitter:card']", { name: 'twitter:card' }, 'summary_large_image')
    upsertMetaTag("meta[name='twitter:title']", { name: 'twitter:title' }, metadata.title)
    upsertMetaTag("meta[name='twitter:description']", { name: 'twitter:description' }, metadata.description)
    upsertMetaTag("meta[name='twitter:image']", { name: 'twitter:image' }, DEFAULT_SOCIAL_IMAGE_URL)
    upsertMetaTag("meta[name='twitter:image:alt']", { name: 'twitter:image:alt' }, metadata.title)

    // JSON-LD structured data.
    syncJsonLd(metadata.jsonLd)
  }, [currentPath, metadata])

  return null
}
