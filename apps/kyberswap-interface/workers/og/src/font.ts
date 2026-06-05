// Satori needs a real font (TTF/OTF). If you pass none, workers-og fetches "Bitter" from Google
// Fonts on every cold render and does NOT cache the binary. So we load our own once and cache the
// *binary* in caches.default (per-PoP, 1y) + memoize per isolate. Production hardening: bundle a
// .ttf as a Data module (wrangler `[[rules]] type=Data`) to drop the runtime dependency entirely.

import { CACHE_KEY_ORIGIN } from '@/constants'

const FONT_FAMILY = 'Inter'
const FONT_CACHE_TTL = 31536000 // 1 year

// Old-UA trick: Google Fonts serves TTF (not woff2) to legacy user agents, which is what Satori wants.
const LEGACY_UA = 'Mozilla/5.0 (Windows NT 6.1; rv:6.0) Gecko/20110814 Firefox/6.0'

const memo = new Map<number, Promise<ArrayBuffer | null>>()

const FONT_FETCH_TIMEOUT_MS = 1500

async function fetchGoogleFontTtf(weight: number): Promise<ArrayBuffer | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(FONT_FAMILY)}:wght@${weight}`
    const cssRes = await fetch(cssUrl, {
      headers: { 'User-Agent': LEGACY_UA },
      cf: { cacheTtl: FONT_CACHE_TTL, cacheEverything: true },
      signal: AbortSignal.timeout(FONT_FETCH_TIMEOUT_MS),
    })
    if (!cssRes.ok) return null
    const css = await cssRes.text()
    // Grab the first truetype src URL from the @font-face block.
    const match = css.match(/src:\s*url\(([^)]+)\)\s*format\(['"]?truetype['"]?\)/)
    const fontUrl = match?.[1]
    if (!fontUrl) return null
    const fontRes = await fetch(fontUrl, {
      cf: { cacheTtl: FONT_CACHE_TTL, cacheEverything: true },
      signal: AbortSignal.timeout(FONT_FETCH_TIMEOUT_MS),
    })
    if (!fontRes.ok) return null
    return await fontRes.arrayBuffer()
  } catch {
    return null
  }
}

/**
 * Load the OG card font binary for a given weight. Memoized per isolate and cached (binary) in
 * caches.default. Returns null on failure — the caller should let workers-og fall back to its
 * default font rather than fail the whole image.
 */
export function loadFont(weight: number, ctx: ExecutionContext): Promise<ArrayBuffer | null> {
  const existing = memo.get(weight)
  if (existing) return existing

  const promise = (async () => {
    const cache = caches.default
    const cacheKey = new Request(`${CACHE_KEY_ORIGIN}/font/${FONT_FAMILY}/${weight}`)
    const cached = await cache.match(cacheKey)
    if (cached) return await cached.arrayBuffer()

    const ttf = await fetchGoogleFontTtf(weight)
    if (ttf) {
      ctx.waitUntil(
        cache.put(
          cacheKey,
          new Response(ttf, {
            headers: {
              'content-type': 'font/ttf',
              'cache-control': `public, max-age=${FONT_CACHE_TTL}, immutable`,
            },
          }),
        ),
      )
    } else {
      // Don't memoize a transient failure for the isolate's lifetime — let the next render retry.
      memo.delete(weight)
    }
    return ttf
  })()

  memo.set(weight, promise)
  return promise
}

export { FONT_FAMILY }
