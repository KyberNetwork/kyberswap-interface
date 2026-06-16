// KyberSwap OG + head-injection service: generates social-preview PNGs for /og/*, injects per-route
// <head> meta for swap/limit/pool pages, and serves the static HTML as-is for everything else.
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { cache } from '@/cache';
import { PORT, PUBLIC_BASE, STATIC_DIR } from '@/config';
import { DEFAULT_OG_IMAGE, NOINDEX_ROBOTS } from '@/constants';
import { injectHead } from '@/headInject';
import { buildPairMeta, buildPoolMeta, parsePairPath, parsePoolPath } from '@/meta';
import { chainFromSlug, slugFromChainId } from '@/networks';
import { renderPoolOg, renderSwapOg } from '@/og';
import { resolvePool } from '@/pools';
import { injectSkeleton } from '@/skeleton';
import { readAppHtml } from '@/static';
import { resolveToken } from '@/tokens';

const MAX_PARAM_LEN = 64;
const IMG_TTL_MS = 31_536_000_000; // 1 year
// 40 hex = a v2/v3 pool address; 64 hex = a Uniswap v4 pool id (keccak of the PoolKey).
const ADDRESS_RE = /^0x([0-9a-f]{40}|[0-9a-f]{64})$/;
const EXCHANGE_RE = /^[a-z0-9_-]{1,60}$/;
const PNG_HEADERS = { 'content-type': 'image/png', 'cache-control': 'public, max-age=31536000, immutable' };
const HTML_HEADERS = {
  'content-type': 'text/html; charset=utf-8',
  // HTML embeds the per-deploy hashed chunk URLs, so it must never be cached: a stale page served after a
  // redeploy requests chunk hashes that no longer exist -> "Failed to fetch dynamically imported module".
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'SAMEORIGIN',
};

// ---- default (fallback) card ----
// Served when a pair/pool can't be resolved. Read from the static build (a real file), so there's no
// confusing cross-origin redirect; falls back to fetching the public asset, then a last-resort 302.
// Loaded once and memoized via a shared promise so a concurrent burst at startup doesn't all fetch.
let defaultImagePromise: Promise<Buffer | null> | undefined;
function loadDefaultImage(): Promise<Buffer | null> {
  if (!defaultImagePromise) {
    const loadOnce = async (): Promise<Buffer | null> => {
      try {
        return await readFile(join(STATIC_DIR, 'kyberswap-og-image.png'));
      } catch {
        try {
          const r = await fetch(DEFAULT_OG_IMAGE, { signal: AbortSignal.timeout(5000) });
          return r.ok ? Buffer.from(await r.arrayBuffer()) : null;
        } catch {
          return null;
        }
      }
    };
    // Don't memoize failures: if the load resolves to null, reset the memo so a later request can
    // retry. A successful load stays memoized, preserving the concurrent-burst dedupe.
    defaultImagePromise = loadOnce().then(buf => {
      if (!buf) defaultImagePromise = undefined;
      return buf;
    });
  }
  return defaultImagePromise;
}
async function defaultImage(): Promise<Response> {
  const buf = await loadDefaultImage();
  if (buf) {
    return new Response(buf, { headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=86400' } });
  }
  return Response.redirect(DEFAULT_OG_IMAGE, 302);
}

// ---- OG image endpoints ----
async function ogSwapImage(url: URL, kind: 'swap' | 'limit'): Promise<Response> {
  const slug = (url.searchParams.get('chain') || '').toLowerCase();
  const inId = (url.searchParams.get('in') || '').toLowerCase();
  const outId = (url.searchParams.get('out') || '').toLowerCase();
  const chain = chainFromSlug(slug);
  if (!chain || (!inId && !outId) || inId.length > MAX_PARAM_LEN || outId.length > MAX_PARAM_LEN) return defaultImage();

  const cacheKey = `img:${kind}:${slug}:${inId}:${outId}`;
  const hit = cache.get<Buffer>(cacheKey);
  if (hit) return new Response(hit, { headers: PNG_HEADERS });

  const [inTok, outTok] = await Promise.all([
    inId ? resolveToken(chain.chainId, inId, chain.nativeSymbol) : Promise.resolve(null),
    outId ? resolveToken(chain.chainId, outId, chain.nativeSymbol) : Promise.resolve(null),
  ]);
  if ((inId && !inTok) || (outId && !outTok) || (!inTok && !outTok)) {
    console.log(`[og] /og/${kind} chain=${slug} in=${inId || '-'} out=${outId || '-'} -> UNRESOLVED (default card)`);
    return defaultImage();
  }

  try {
    const png = await renderSwapOg({ inToken: inTok, outToken: outTok, networkName: chain.name, kind });
    cache.set(cacheKey, png, IMG_TTL_MS);
    console.log(`[og] /og/${kind} chain=${slug} in=${inId || '-'} out=${outId || '-'} -> rendered`);
    return new Response(png, { headers: PNG_HEADERS });
  } catch {
    return defaultImage();
  }
}

async function ogPoolImage(url: URL): Promise<Response> {
  const slug = (url.searchParams.get('chain') || '').toLowerCase();
  const address = (url.searchParams.get('address') || '').toLowerCase();
  const protocol = (url.searchParams.get('protocol') || '').toLowerCase();
  const chain = chainFromSlug(slug);
  if (!chain || !ADDRESS_RE.test(address) || protocol.length > MAX_PARAM_LEN) return defaultImage();

  const cacheKey = `img:pool:${slug}:${address}:${protocol}`;
  const hit = cache.get<Buffer>(cacheKey);
  if (hit) return new Response(hit, { headers: PNG_HEADERS });

  const pool = await resolvePool(chain.chainId, address, protocol);
  if (!pool) {
    console.log(
      `[og] /og/pool chain=${slug} address=${address} protocol=${protocol || '-'} -> UNRESOLVED (default card)`,
    );
    return defaultImage();
  }

  try {
    const png = await renderPoolOg({
      token0: pool.token0,
      token1: pool.token1,
      networkName: chain.name,
      feeTier: pool.feeTier,
    });
    cache.set(cacheKey, png, IMG_TTL_MS);
    console.log(`[og] /og/pool chain=${slug} address=${address} protocol=${protocol || '-'} -> rendered`);
    return new Response(png, { headers: PNG_HEADERS });
  } catch {
    return defaultImage();
  }
}

// ---- per-route <head> injection ----
async function handlePair(url: URL): Promise<Response> {
  const parsed = parsePairPath(url.pathname, url.searchParams);
  if (parsed) {
    const meta = await buildPairMeta(parsed);
    if (meta) {
      const { html, prerendered } = await readAppHtml(url.pathname);
      // A path-form pair (/swap/<net>/<pair>) isn't prerendered → SPA shell (generic logo): swap in the
      // swap page-shell skeleton so a shared/cold-loaded link shows the right shape while JS downloads. The
      // legacy query form (/swap/<net>?inputCurrency=) resolves to the prerendered network landing, which
      // already carries that skeleton — don't re-inject it.
      const withHead = injectHead(html, meta);
      console.log(`[og] pair ${url.pathname} in=${parsed.inId || '-'} out=${parsed.outId || '-'} -> injected`);
      return new Response(prerendered ? withHead : await injectSkeleton(withHead, 'swap'), { headers: HTML_HEADERS });
    }
    console.log(
      `[og] pair ${url.pathname} in=${parsed.inId || '-'} out=${parsed.outId || '-'} -> UNRESOLVED (static fallback)`,
    );
  }
  // Bare landing route, or unresolved pair — serve the static HTML as-is (prerendered or SPA shell).
  const { html } = await readAppHtml(url.pathname);
  return new Response(html, { headers: HTML_HEADERS });
}

function legacyPoolRedirect(url: URL): Response | null {
  const exchange = (url.searchParams.get('exchange') || '').toLowerCase();
  const poolAddress = (url.searchParams.get('poolAddress') || '').toLowerCase();
  const poolChainId = Number(url.searchParams.get('poolChainId') || 0);
  const slug = slugFromChainId(poolChainId);
  // Validate strictly: these are interpolated into the 301 Location, so a malformed value must not
  // craft an attacker-chosen path on the canonical domain.
  if (!EXCHANGE_RE.test(exchange) || !ADDRESS_RE.test(poolAddress) || !slug) return null;
  return Response.redirect(`${PUBLIC_BASE}/pools/${slug}/${exchange}/${poolAddress}`, 301);
}

async function handlePool(url: URL): Promise<Response> {
  if (url.pathname === '/pools/add-liquidity' || url.pathname === '/pools/add-liquidity/') {
    const redirect = legacyPoolRedirect(url);
    if (redirect) return redirect;
  }
  const parsed = parsePoolPath(url.pathname);
  if (parsed) {
    const meta = await buildPoolMeta(parsed);
    if (meta) {
      // A pool URL carrying query params -> noindex (avoid indexing param-variant duplicates).
      if (url.search) meta.robots = NOINDEX_ROBOTS;
      const { html, prerendered } = await readAppHtml(url.pathname);
      // Pool URLs aren't prerendered → SPA shell: swap in the pool-detail page-shell skeleton. (Guard on
      // `prerendered` for symmetry with handlePair — a prerendered file would already carry its skeleton.)
      const withHead = injectHead(html, meta);
      console.log(`[og] pool ${url.pathname} -> injected`);
      return new Response(prerendered ? withHead : await injectSkeleton(withHead, 'pool'), { headers: HTML_HEADERS });
    }
    console.log(`[og] pool ${url.pathname} -> UNRESOLVED (static fallback)`);
  }
  const { html } = await readAppHtml(url.pathname);
  return new Response(html, { headers: HTML_HEADERS });
}

// Fail-soft wrappers: an HTML route that throws still serves the page; an image route serves the default.
async function safeHtml(url: URL, fn: (u: URL) => Promise<Response>): Promise<Response> {
  try {
    return await fn(url);
  } catch {
    try {
      const { html } = await readAppHtml(url.pathname);
      return new Response(html, { headers: HTML_HEADERS });
    } catch {
      return new Response('', { status: 502 });
    }
  }
}
async function safeImg(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch {
    return defaultImage();
  }
}

const app = new Hono();
// Request log (skips /healthz noise): method, path, status, ms — surfaces every hit in `kubectl logs`.
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const { pathname } = new URL(c.req.url);
  if (pathname !== '/healthz') {
    console.log(`[og] ${c.req.method} ${pathname} -> ${c.res.status} (${Date.now() - start}ms)`);
  }
});
app.get('/healthz', c => c.text('ok'));
app.get('/og/swap', c => safeImg(() => ogSwapImage(new URL(c.req.url), 'swap')));
app.get('/og/limit', c => safeImg(() => ogSwapImage(new URL(c.req.url), 'limit')));
app.get('/og/pool', c => safeImg(() => ogPoolImage(new URL(c.req.url))));
app.get('/swap/*', c => safeHtml(new URL(c.req.url), handlePair));
app.get('/limit/*', c => safeHtml(new URL(c.req.url), handlePair));
app.get('/pools/*', c => safeHtml(new URL(c.req.url), handlePool));
// Only the routes above are handled; anything else -> 404 (don't blindly serve HTML).
app.all('*', c => c.text('not found', 404));

serve({ fetch: app.fetch, port: PORT }, info => {
  console.log(`og-service listening on :${info.port} (static: ${STATIC_DIR}, public: ${PUBLIC_BASE})`);
});
