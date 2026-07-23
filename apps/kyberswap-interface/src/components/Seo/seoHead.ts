import { KYBERSWAP_URL } from 'constants/index'

import {
  type RouteSeoMetadata,
  type TradeProduct,
  resolveRouteMetadata,
  resolveTradeShellMetadata,
  toSiteUrl,
} from './routeMetadata'

export const DEFAULT_SOCIAL_IMAGE_URL = `${KYBERSWAP_URL}/kyberswap-og-image.png?version=2023`
export const SERVER_SEO_PATH_META_NAME = 'kyberswap:server-seo-path'
export const JSON_LD_SCRIPT_ID = 'kyberswap-structured-data'

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')

const renderSeoHeadHtml = (metadata: RouteSeoMetadata): string => {
  const canonicalUrl = toSiteUrl(metadata.canonicalPath)
  const title = escapeHtml(metadata.title)
  const description = escapeHtml(metadata.description)

  const tags = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<meta name="robots" content="${escapeHtml(metadata.robots)}" />`,
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
    `<meta property="og:site_name" content="KyberSwap" />`,
    `<meta property="og:image" content="${escapeHtml(DEFAULT_SOCIAL_IMAGE_URL)}" />`,
    `<meta property="og:image:alt" content="${title}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${escapeHtml(DEFAULT_SOCIAL_IMAGE_URL)}" />`,
    `<meta name="twitter:image:alt" content="${title}" />`,
  ]

  if (metadata.jsonLd?.length) {
    // Escape `</script>` so a stray closing tag in any future dynamic JSON-LD value cannot break
    // out of the script element when this string is spliced into the prerendered HTML.
    const jsonLd = JSON.stringify(metadata.jsonLd).replace(/<\/script>/gi, '\\u003c/script\\u003e')
    tags.push(`<script type="application/ld+json" id="${JSON_LD_SCRIPT_ID}">${jsonLd}</script>`)
  }

  return tags.join('\n    ')
}

/** Render the route-specific head used by bounded static pages. */
export const renderRouteHeadHtml = (pathname: string, search = ''): string =>
  renderSeoHeadHtml(resolveRouteMetadata(pathname, search))

/** Render a safe noindex head for the shared Swap or Limit shell. */
export const renderTradeShellHeadHtml = (product: TradeProduct): string =>
  renderSeoHeadHtml(resolveTradeShellMetadata(product))
