// KyberSwap dynamic social-preview (OG) edge worker.
//
// Job A: for `/swap/<net>/<in>-to-<out>` (and `/limit/...`, and the legacy `?inputCurrency=` form),
//        rewrite the origin HTML <head> per request to carry pair-specific OG/Twitter meta so social
//        crawlers (which don't run JS) render a rich card. The page body is untouched — the SPA
//        hydrates and behaves exactly as before.
// Job B: `/og/swap` + `/og/limit` generate a cached 1200x630 PNG (two token logos + symbols + brand).
//
// Everything else passes straight through to origin. No app code is imported; token metadata comes
// from the public ks-setting token-list API. See README.md for deploy + validation.

import { CACHE_KEY_ORIGIN, DEFAULT_OG_IMAGE } from '@/constants'
import { parsePairPath, buildSwapMeta, rewriteHead } from '@/meta'
import { chainFromSlug } from '@/networks'
import { renderSwapOg } from '@/og'
import { resolveToken } from '@/tokens'

interface Env {}

// Bound on how long a real user's swap-page request may wait for token resolution before we give up
// and serve the page unchanged. Crawlers that hit a cold pair simply get the default card and the
// cache warms for the (typically retried) next scrape.
const HEAD_TIMEOUT_MS = 1500

// Reject absurdly long /og params before any upstream work (mirrors the token-layer guard).
const MAX_PARAM_LEN = 64

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout>
  const timeout = new Promise<null>(resolve => {
    timer = setTimeout(() => resolve(null), ms)
  })
  // A reject degrades to null ("serve unchanged") rather than throwing out of the handler.
  return Promise.race([p.catch(() => null), timeout]).finally(() => clearTimeout(timer))
}

// Return the default card as a 200 image/png (some scrapers won't follow a 302 for og:image). Falls
// back to a redirect only if the origin fetch for the static asset itself fails.
async function defaultImage(): Promise<Response> {
  try {
    const res = await fetch(DEFAULT_OG_IMAGE, { cf: { cacheTtl: 86400, cacheEverything: true } })
    if (res.ok) {
      const r = new Response(res.body, res)
      r.headers.set('Content-Type', 'image/png')
      r.headers.set('Cache-Control', 'public, max-age=86400')
      return r
    }
  } catch {
    /* fall through to redirect */
  }
  return Response.redirect(DEFAULT_OG_IMAGE, 302)
}

async function handleHeadInjection(
  request: Request,
  pathname: string,
  searchParams: URLSearchParams,
  ctx: ExecutionContext,
): Promise<Response> {
  const parsed = parsePairPath(pathname, searchParams)

  // Fetch origin regardless; resolve meta in parallel under a latency budget.
  const originPromise = fetch(request)
  if (!parsed) return originPromise

  const cache = caches.default
  const [origin, meta] = await Promise.all([originPromise, withTimeout(buildSwapMeta(parsed, cache, ctx), HEAD_TIMEOUT_MS)])

  const contentType = origin.headers.get('content-type') || ''
  // Only rewrite a successful HTML response; never touch error pages or non-HTML.
  if (!meta || !origin.ok || !contentType.includes('text/html')) return origin

  return rewriteHead(origin, meta)
}

async function handleOgImage(url: URL, kind: 'swap' | 'limit', ctx: ExecutionContext): Promise<Response> {
  const slug = (url.searchParams.get('chain') || '').toLowerCase()
  const inId = (url.searchParams.get('in') || '').toLowerCase()
  const outId = (url.searchParams.get('out') || '').toLowerCase()

  const chain = chainFromSlug(slug)
  if (!chain || (!inId && !outId) || inId.length > MAX_PARAM_LEN || outId.length > MAX_PARAM_LEN) {
    return defaultImage()
  }

  const cache = caches.default

  // Stable, normalized cache key so the PNG is rendered once per unique pair per PoP.
  const normalized = new URL(`${CACHE_KEY_ORIGIN}/og/${kind}`)
  normalized.searchParams.set('chain', slug)
  normalized.searchParams.set('in', inId)
  normalized.searchParams.set('out', outId)
  const cacheKey = new Request(normalized.toString())

  const hit = await cache.match(cacheKey)
  if (hit) return hit

  const [inTok, outTok] = await Promise.all([
    inId ? resolveToken(chain.chainId, inId, chain.nativeSymbol, cache, ctx) : Promise.resolve(null),
    outId ? resolveToken(chain.chainId, outId, chain.nativeSymbol, cache, ctx) : Promise.resolve(null),
  ])

  // A *provided* side that doesn't resolve = junk/unlisted → default card, never a placeholder render
  // (a genuinely empty side is a valid one-sided link). This stops random ids from forcing renders.
  if ((inId && !inTok) || (outId && !outTok) || (!inTok && !outTok)) return defaultImage()

  // ImageResponse defers the Satori/resvg render into the response stream, so buffer it here: a render
  // failure rejects on arrayBuffer() and we fall back to the default card WITHOUT caching a broken PNG.
  let png: ArrayBuffer
  try {
    // Pass nulls straight through: a missing side here is an empty (one-sided) link, not junk.
    png = await renderSwapOg({ inToken: inTok, outToken: outTok, networkName: chain.name, kind }, ctx).then(r =>
      r.arrayBuffer(),
    )
  } catch {
    return defaultImage()
  }

  const response = new Response(png, {
    status: 200,
    headers: {
      'content-type': 'image/png',
      'cache-control': 'public, max-age=31536000, immutable',
    },
  })
  ctx.waitUntil(cache.put(cacheKey, response.clone()))
  return response
}

export default {
  async fetch(request: Request, _env: Env, ctx: ExecutionContext): Promise<Response> {
    // Safety net: if anything throws uncaught (e.g. an origin connection reset), fall back to default
    // origin behavior instead of serving a 1101 worker-error page on a swap/limit route.
    ctx.passThroughOnException()
    const url = new URL(request.url)
    const { pathname } = url

    // Job B — OG image endpoints.
    if (pathname === '/og/swap') return handleOgImage(url, 'swap', ctx)
    if (pathname === '/og/limit') return handleOgImage(url, 'limit', ctx)

    // Job A — swap/limit pair head injection (GET HTML only).
    if (request.method === 'GET' && (pathname.startsWith('/swap/') || pathname.startsWith('/limit/'))) {
      return handleHeadInjection(request, pathname, url.searchParams, ctx)
    }

    // Everything else — straight to origin.
    return fetch(request)
  },
} satisfies ExportedHandler<Env>
