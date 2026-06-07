import { INDEX_ROBOTS, KYBERSWAP_URL } from '@/constants'
import { chainFromSlug, type ChainInfo } from '@/networks'
import { resolvePool } from '@/pools'
import { resolveToken, type ResolvedToken } from '@/tokens'

const POOL_ADDRESS_RE = /^0x[0-9a-f]{40}$/
const MAX_PROTOCOL_LEN = 64

// Trim float-representation noise from a fee-tier percentage so the title/meta match the app, which
// renders fees via formatDisplayNumber(fee, { significantDigits: 4 }). E.g. 0.30000000000000004 -> "0.3".
function formatFeeTier(fee: number): string {
  return parseFloat(fee.toPrecision(4)).toString()
}

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
  // When set (pool pages), rewriteHead also overwrites <link rel="canonical"> + <meta name="robots">
  // so non-JS crawlers get the self-canonical + index directive instead of the SPA-fallback homepage
  // values. Left undefined for swap/limit (those stay noindex with the existing canonical).
  canonical?: string
  robots?: string
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

// ---- Pool detail (Phase 5) ----

export interface ParsedPool {
  slug: string
  chain: ChainInfo
  protocol: string
  address: string
}

/**
 * Match a path-based pool-detail URL `/pools/<chain>/<protocol>/<address>` and extract its parts.
 * Returns null for the legacy `/pools/add-liquidity` (2 segments), `/pools`, or a bad address.
 */
export function parsePoolPath(pathname: string): ParsedPool | null {
  const segs = pathname.split('/').filter(Boolean)
  if (segs.length !== 4 || segs[0] !== 'pools') return null
  const chain = chainFromSlug(segs[1])
  if (!chain) return null
  const protocol = segs[2].toLowerCase()
  const address = segs[3].toLowerCase()
  if (!protocol || protocol.length > MAX_PROTOCOL_LEN || !POOL_ADDRESS_RE.test(address)) return null
  return { slug: segs[1].toLowerCase(), chain, protocol, address }
}

/**
 * Resolve a pool's tokens and build its OG/Twitter meta. Returns null (→ serve the page unchanged)
 * if the pool can't be resolved.
 */
export async function buildPoolMeta(parsed: ParsedPool, cache: Cache, ctx: ExecutionContext): Promise<SwapMeta | null> {
  const { chain, slug, protocol, address } = parsed
  const pool = await resolvePool(chain.chainId, address, protocol, cache, ctx)
  if (!pool) return null

  const s0 = pool.token0.symbol
  const s1 = pool.token1.symbol
  const feeText = typeof pool.feeTier === 'number' ? ` ${formatFeeTier(pool.feeTier)}%` : ''

  const title = `${s0}/${s1}${feeText} Pool | KyberSwap`
  const description = `Provide liquidity in the ${s0}/${s1}${feeText} pool on KyberSwap (${chain.name}) and earn fees across 20+ chains.`
  const imageAlt = `${s0}/${s1} liquidity pool on KyberSwap`
  const url = `${KYBERSWAP_URL}/pools/${slug}/${protocol}/${address}`
  const imgParams = new URLSearchParams({ chain: slug, address, protocol })
  const image = `${KYBERSWAP_URL}/og/pool?${imgParams.toString()}`

  // Pool pages are the intended SEO landing per pool (not prerendered), so make crawlers see a
  // self-canonical + index directive. The caller downgrades robots to noindex if the URL has a query.
  return { title, description, image, url, imageAlt, canonical: url, robots: INDEX_ROBOTS }
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

class SetHref {
  constructor(private value: string) {}
  element(el: Element) {
    el.setAttribute('href', this.value)
  }
}

/**
 * Rewrite the origin HTML's <head> to carry the route-specific OG/Twitter meta + title. Overwrites
 * existing tags in place (each exists once in the served HTML) — no duplicates. For swap/limit it
 * leaves <link rel="canonical"> + robots untouched (those routes stay noindex with the existing
 * canonical). For pool pages meta.canonical/robots are set, so the rewriter also makes crawlers see a
 * self-canonical + index directive (the SPA-fallback HTML otherwise ships the homepage canonical).
 */
export function rewriteHead(origin: Response, meta: SwapMeta): Response {
  let rewriter = new HTMLRewriter()
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

  if (meta.canonical) rewriter = rewriter.on('link[rel="canonical"]', new SetHref(meta.canonical))
  if (meta.robots) rewriter = rewriter.on('meta[name="robots"]', new SetContent(meta.robots))

  return rewriter.transform(origin)
}

export type { ResolvedToken }
