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
import { readAppHtml } from '@/static';
import { resolveToken } from '@/tokens';

const MAX_PARAM_LEN = 64;
const IMG_TTL_MS = 31_536_000_000; // 1 year
const ADDRESS_RE = /^0x[0-9a-f]{40}$/;
const EXCHANGE_RE = /^[a-z0-9_-]{1,60}$/;
const PNG_HEADERS = { 'content-type': 'image/png', 'cache-control': 'public, max-age=31536000, immutable' };
const HTML_HEADERS = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=60' };

// ---- default (fallback) card ----
// Served when a pair/pool can't be resolved. Read from the static build (a real file), so there's no
// confusing cross-origin redirect; falls back to fetching the public asset, then a last-resort 302.
// Loaded once and memoized via a shared promise so a concurrent burst at startup doesn't all fetch.
let defaultImagePromise: Promise<Buffer | null> | undefined;
function loadDefaultImage(): Promise<Buffer | null> {
  if (!defaultImagePromise) {
    defaultImagePromise = (async () => {
      try {
        return await readFile(join(STATIC_DIR, 'kyberswap-og-image.png'));
      } catch {
        try {
          const r = await fetch(DEFAULT_OG_IMAGE);
          return r.ok ? Buffer.from(await r.arrayBuffer()) : null;
        } catch {
          return null;
        }
      }
    })();
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
  if ((inId && !inTok) || (outId && !outTok) || (!inTok && !outTok)) return defaultImage();

  try {
    const png = await renderSwapOg({ inToken: inTok, outToken: outTok, networkName: chain.name, kind });
    cache.set(cacheKey, png, IMG_TTL_MS);
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

  const cacheKey = `img:pool:${slug}:${address}`;
  const hit = cache.get<Buffer>(cacheKey);
  if (hit) return new Response(hit, { headers: PNG_HEADERS });

  const pool = await resolvePool(chain.chainId, address, protocol);
  if (!pool) return defaultImage();

  try {
    const png = await renderPoolOg({
      token0: pool.token0,
      token1: pool.token1,
      networkName: chain.name,
      feeTier: pool.feeTier,
    });
    cache.set(cacheKey, png, IMG_TTL_MS);
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
      const { html } = await readAppHtml(url.pathname);
      return new Response(injectHead(html, meta), { headers: HTML_HEADERS });
    }
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
      const { html } = await readAppHtml(url.pathname);
      return new Response(injectHead(html, meta), { headers: HTML_HEADERS });
    }
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
