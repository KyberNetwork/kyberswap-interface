import { KYBERSWAP_URL } from '@/constants'
import { chainFromSlug, type ChainInfo } from '@/networks'
import { resolveToken, type ResolvedToken } from '@/tokens'

export interface ParsedPair {
  kind: 'swap' | 'limit'
  slug: string
  chain: ChainInfo
  inId: string
  outId: string
}

/**
 * Match a swap/limit *pair* URL and extract (network, inId, outId). Handles both the canonical path
 * form `/swap/<net>/<in>-to-<out>` (split on the literal `-to-`, per src/state/swap/hooks.ts) and the
 * legacy `/swap/<net>?inputCurrency=&outputCurrency=` query form. Returns null for the bare
 * `/swap/<net>` landing (already prerendered with its own meta) and any non-pair path.
 */
export function parsePairPath(pathname: string, searchParams: URLSearchParams): ParsedPair | null {
  const segs = pathname.split('/').filter(Boolean)
  if (segs.length < 2) return null
  const kind = segs[0]
  if (kind !== 'swap' && kind !== 'limit') return null

  const chain = chainFromSlug(segs[1])
  if (!chain) return null

  let inId = ''
  let outId = ''

  const currency = segs[2]
  if (currency && currency.includes('-to-')) {
    const [from, to] = currency.split('-to-')
    inId = (from || '').toLowerCase()
    outId = (to || '').toLowerCase()
  } else {
    // Legacy query form (?inputCurrency=&outputCurrency=) — the app redirects this to the path form
    // client-side, but a crawler sees the query URL, so resolve it here too.
    inId = (searchParams.get('inputCurrency') || '').toLowerCase()
    outId = (searchParams.get('outputCurrency') || '').toLowerCase()
  }

  if (!inId && !outId) return null
  // App parity: the swap form clears the output when both sides are the same token, so render a
  // one-sided card rather than "X → X" (see src/state/swap/hooks.ts useCurrencyFromUrl).
  if (inId && inId === outId) outId = ''

  return { kind, slug: segs[1].toLowerCase(), chain, inId, outId }
}

export interface SwapMeta {
  title: string
  description: string
  image: string
  url: string
  imageAlt: string
}

/**
 * Resolve both tokens and build the per-pair OG/Twitter meta. Returns null if neither token resolves
 * (so the caller passes the request through unchanged). Tolerates one side missing (one-sided link).
 */
export async function buildSwapMeta(
  parsed: ParsedPair,
  cache: Cache,
  ctx: ExecutionContext,
): Promise<SwapMeta | null> {
  const { chain, slug, kind, inId, outId } = parsed

  const [inToken, outToken] = await Promise.all([
    inId ? resolveToken(chain.chainId, inId, chain.nativeSymbol, cache, ctx) : Promise.resolve(null),
    outId ? resolveToken(chain.chainId, outId, chain.nativeSymbol, cache, ctx) : Promise.resolve(null),
  ])

  // Bail (→ serve the page unchanged) if a *provided* side can't be resolved. This both avoids
  // misleading "Token" cards for junk/unlisted ids and stops a flood of random ids from forcing work.
  if ((inId && !inToken) || (outId && !outToken)) return null
  if (!inToken && !outToken) return null

  const verb = kind === 'limit' ? 'Limit order' : 'Swap'

  // A null token here means that side was empty (the provided-but-unresolved case already bailed
  // above), i.e. a one-sided link — render a single-token card instead of "X → Token".
  let title: string
  let description: string
  let imageAlt: string
  if (inToken && outToken) {
    title = `${verb} ${inToken.symbol} → ${outToken.symbol} | KyberSwap`
    description = `${verb} ${inToken.symbol} for ${outToken.symbol} on KyberSwap, the best-rate DeFi aggregator on ${chain.name} and 20+ chains.`
    imageAlt = `${verb} ${inToken.symbol} to ${outToken.symbol} on KyberSwap`
  } else {
    const soleSym = (inToken ?? outToken)?.symbol ?? 'Token'
    title = `${verb} ${soleSym} | KyberSwap`
    description = `${verb} ${soleSym} on KyberSwap, the best-rate DeFi aggregator on ${chain.name} and 20+ chains.`
    imageAlt = `${verb} ${soleSym} on KyberSwap`
  }

  // Canonical pair URL for og:url (path form). Keep each side in place (an empty side stays empty) so
  // the URL matches what the user/crawler actually visited and never flips token direction.
  const url = `${KYBERSWAP_URL}/${kind}/${slug}/${inId}-to-${outId}`

  // Thin, normalized params -> stable cache key for the generated PNG. The image endpoint re-resolves
  // the tokens (shared, cached helper) so the long logo URLs never enter the og:image URL.
  const imgParams = new URLSearchParams({ chain: slug, in: inId, out: outId })
  const image = `${KYBERSWAP_URL}/og/${kind === 'limit' ? 'limit' : 'swap'}?${imgParams.toString()}`

  return { title, description, image, url, imageAlt }
}

// ---- HTMLRewriter handlers (Job A) ----

class SetContent {
  constructor(private value: string) {}
  element(el: Element) {
    el.setAttribute('content', this.value)
  }
}

class SetTitle {
  constructor(private value: string) {}
  element(el: Element) {
    el.setInnerContent(this.value)
  }
}

class AppendImageDims {
  element(el: Element) {
    // og:image:width/height/type are absent in the served <head> — add them once for richer cards.
    el.append(
      `<meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /><meta property="og:image:type" content="image/png" />`,
      { html: true },
    )
  }
}

/**
 * Rewrite the origin HTML's <head> to carry the pair-specific OG/Twitter meta. Overwrites the
 * existing tags in place (they all exist exactly once in the served HTML) — no duplicates. Leaves
 * <link rel="canonical"> and robots untouched: pair routes stay noindex with canonical → the
 * network landing, matching the app's existing SEO pipeline. Crawlers read OG/Twitter for previews.
 */
export function rewriteHead(origin: Response, meta: SwapMeta): Response {
  return (
    new HTMLRewriter()
      .on('title', new SetTitle(meta.title))
      .on('meta[property="og:title"]', new SetContent(meta.title))
      .on('meta[name="twitter:title"]', new SetContent(meta.title))
      .on('meta[property="og:description"]', new SetContent(meta.description))
      .on('meta[name="twitter:description"]', new SetContent(meta.description))
      .on('meta[property="og:image"]', new SetContent(meta.image))
      .on('meta[name="twitter:image"]', new SetContent(meta.image))
      .on('meta[property="og:image:alt"]', new SetContent(meta.imageAlt))
      .on('meta[name="twitter:image:alt"]', new SetContent(meta.imageAlt))
      .on('meta[property="og:url"]', new SetContent(meta.url))
      .on('meta[name="twitter:card"]', new SetContent('summary_large_image'))
      .on('head', new AppendImageDims())
      .transform(origin)
  )
}

export type { ResolvedToken }
