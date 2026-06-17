import { Resvg } from '@resvg/resvg-js';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import satori from 'satori';
import { html as toVNode } from 'satori-html';

import { cache } from '@/cache';
import { STATIC_DIR } from '@/config';
import { BROWSER_UA, readBoundedArrayBuffer } from '@/constants';
import { FONT_FAMILY, loadFont } from '@/font';
import { formatFeeTier } from '@/meta';
import type { PoolToken } from '@/pools';
import { isPublicHost } from '@/ssrf';
import type { ResolvedToken } from '@/tokens';

// Satori's `fonts` option type, derived from its signature (avoids importing an unstable named type).
type SatoriFonts = NonNullable<Parameters<typeof satori>[1]>['fonts'];

// satori-html's `html()` returns its own `VNode` — what Satori actually renders, but nominally distinct
// from Satori's `ReactNode` element param (newer `@types/react` make `ReactPortal` require key/children).
// Cast through Satori's own signature to bridge the two without depending on `react` types here.
type SatoriElement = Parameters<typeof satori>[0];

// ---- brand ----
const GREEN = '#31CB9E';
const BG = '#0D0D0D';
const WHITE = '#FFFFFF';
const SUBTEXT = '#A9A9A9';
const MUTED = '#7A7A7A';
const FALLBACK_CIRCLE = '#2A2A2A';

const WIDTH = 1200;
const HEIGHT = 630;
const LOGO_SIZE = 180;
const LOGO_RENDER_W = LOGO_SIZE * 2; // rasterize token logos at 2x display size for retina crispness
const LOGO_CACHE_TTL_MS = 86_400_000; // 1 day — hot logos (USDC/ETH) recur across many pairs
const BRAND_LOGO_W = 160;
const BRAND_LOGO_H = 53; // logo-dark.svg viewBox is 160x53

// Brand wordmark for the card header. Reads public/logo-dark.svg from the baked interface build (white text +
// green K, suits the dark card) and rasterizes it once to a PNG data URI — satori embeds PNG reliably, and
// resvg renders this simple (solid-fill) logo correctly. Memoized; null -> cardHtml falls back to text.
let logoPromise: Promise<string | null> | undefined;
function loadBrandLogo(): Promise<string | null> {
  if (!logoPromise) {
    logoPromise = readFile(join(STATIC_DIR, 'logo-dark.svg'), 'utf8')
      .then(svg => {
        const png = new Resvg(svg, { fitTo: { mode: 'width', value: BRAND_LOGO_W * 2 } }).render().asPng();
        return `data:image/png;base64,${png.toString('base64')}`;
      })
      .catch(() => {
        logoPromise = undefined; // don't memoize a miss — retry on a later request
        return null;
      });
  }
  return logoPromise;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function shortSymbol(sym: string): string {
  const s = sym.trim();
  return s.length > 12 ? `${s.slice(0, 11)}…` : s;
}

const ALLOWED_LOGO_MIME = new Set(['image/png', 'image/jpeg']);
const DATA_URI_RE = /^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/=]+$/;
const LOGO_FETCH_TIMEOUT_MS = 1500;
const MAX_LOGO_BYTES = 512 * 1024;
// Cap an inline `data:` logo by its string length too — base64 is ~4/3 the byte size, so this bounds
// the decoded image to ~MAX_LOGO_BYTES without decoding it (an unbounded URI would feed straight into satori).
const MAX_DATA_URI_LEN = Math.ceil((MAX_LOGO_BYTES * 4) / 3) + 64; // +64 slack for the `data:<mime>;base64,` prefix

// `logoURI` comes from the community-influenced ks-setting token list, so treat it as untrusted: only
// fetch plain https URLs on the default port with a real (non-IP, non-localhost) hostname. At an
// origin deployment this also matters because an SSRF could otherwise reach internal services.
function isSafeLogoUrl(url: string): boolean {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  if (u.protocol !== 'https:') return false;
  if (u.username || u.password) return false;
  if (u.port && u.port !== '443') return false;
  const host = u.hostname;
  if (host === 'localhost' || host.startsWith('[') || host.includes(':')) return false; // localhost / IPv6
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false; // IPv4 literal
  return true;
}

// Re-rasterize a validated PNG/JPEG logo (data URI) down to LOGO_RENDER_W via resvg. A heavy source
// (e.g. the ~157KB native-ETH logo) otherwise bloats the satori SVG and balloons render time, because
// satori decodes embedded rasters in JS. resvg decodes it once here (native, fast) and emits a small
// PNG. On any failure, returns the input unchanged — it still renders, just heavier.
function downscaleLogoDataUri(dataUri: string): string {
  try {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${LOGO_RENDER_W}" height="${LOGO_RENDER_W}"><image href="${dataUri}" width="${LOGO_RENDER_W}" height="${LOGO_RENDER_W}" preserveAspectRatio="none"/></svg>`;
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: LOGO_RENDER_W } }).render().asPng();
    return `data:image/png;base64,${png.toString('base64')}`;
  } catch {
    return dataUri;
  }
}

// Resolve a token's logo to a small embeddable PNG data URI: fetch (hardened) -> downscale -> cache by
// URL (the resize is the new per-render cost, so memoize hot logos like USDC/ETH). Null if unavailable.
async function fetchLogoDataUri(url: string | undefined): Promise<string | null> {
  if (!url) return null;
  const cacheKey = `logo:${url}`;
  const cached = cache.get<string>(cacheKey);
  if (cached) return cached;

  const raw = await fetchRawLogoDataUri(url);
  if (!raw) return null;
  const small = downscaleLogoDataUri(raw);
  cache.set(cacheKey, small, LOGO_CACHE_TTL_MS);
  return small;
}

// Satori can't fetch remote <img> reliably, so inline the bytes as a base64 data URI. Hardened:
// browser UA (CDNs 403 bare fetches), PNG/JPEG only, size-bounded, timeout, and — crucially for an
// origin deployment — `redirect: 'manual'` so a vetted host can't 302 us to an internal IP (SSRF).
async function fetchRawLogoDataUri(url: string | undefined): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith('data:')) return url.length <= MAX_DATA_URI_LEN && DATA_URI_RE.test(url) ? url : null;
  if (!isSafeLogoUrl(url)) return null;
  // Block hostnames that DNS-resolve to a private/internal IP (SSRF) before connecting.
  if (!(await isPublicHost(new URL(url).hostname))) return null;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': BROWSER_UA, Accept: 'image/png,image/jpeg,image/*,*/*' },
      redirect: 'manual', // SSRF guard: never follow a redirect (could point at an internal IP)
      signal: AbortSignal.timeout(LOGO_FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null; // 3xx (manual redirect) is not ok -> rejected here too
    const mime = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!ALLOWED_LOGO_MIME.has(mime)) return null;
    // Stream-bounded read: aborts past MAX_LOGO_BYTES instead of buffering an unbounded (community-
    // influenced) body first — readBoundedArrayBuffer throws over the cap, caught below as a null logo.
    const buf = await readBoundedArrayBuffer(res, MAX_LOGO_BYTES);
    const dataUri = `data:${mime};base64,${Buffer.from(buf).toString('base64')}`;
    return DATA_URI_RE.test(dataUri) ? dataUri : null;
  } catch {
    return null;
  }
}

function logoHtml(dataUri: string | null, symbol: string): string {
  if (dataUri) {
    return `<img src="${dataUri}" width="${LOGO_SIZE}" height="${LOGO_SIZE}" style="border-radius:9999px;background:${WHITE}" />`;
  }
  const letter = escapeHtml((symbol[0] || '?').toUpperCase());
  return `<div style="display:flex;align-items:center;justify-content:center;width:${LOGO_SIZE}px;height:${LOGO_SIZE}px;border-radius:9999px;background:${FALLBACK_CIRCLE};color:${GREEN};font-size:84px;font-weight:700">${letter}</div>`;
}

function tokenBlock(dataUri: string | null, symbol: string): string {
  return `<div style="display:flex;flex-direction:column;align-items:center;width:330px">
    ${logoHtml(dataUri, symbol)}
    <div style="display:flex;margin-top:28px;font-size:52px;font-weight:700;color:${WHITE}">${escapeHtml(shortSymbol(symbol))}</div>
  </div>`;
}

// Shared card chrome: brand header (Kyber + Swap + "on <network>"), a center row, and a caption.
// NB: every <div> with >1 child needs explicit display:flex (a Satori requirement).
function cardHtml(networkName: string, center: string, caption: string, logoUri: string | null): string {
  // Brand mark: the KyberSwap logo image when available, otherwise the text wordmark.
  const brand = logoUri
    ? `<img src="${logoUri}" width="${BRAND_LOGO_W}" height="${BRAND_LOGO_H}" />`
    : `<div style="display:flex"><div style="display:flex;color:${GREEN};font-size:48px;font-weight:700">Kyber</div><div style="display:flex;color:${WHITE};font-size:48px;font-weight:700">Swap</div></div>`;
  return `<div style="display:flex;flex-direction:column;justify-content:space-between;width:${WIDTH}px;height:${HEIGHT}px;padding:72px 80px;background:${BG};font-family:'${FONT_FAMILY}'">
    <div style="display:flex;align-items:center;justify-content:space-between;width:100%">
      ${brand}
      <div style="display:flex;font-size:32px;color:${SUBTEXT}">on ${escapeHtml(networkName)}</div>
    </div>
    <div style="display:flex;align-items:center;justify-content:center;width:100%">
      ${center}
    </div>
    <div style="display:flex;font-size:32px;color:${MUTED}">${caption}</div>
  </div>`;
}

// Build Satori's `fonts` option from the loaded weights, dropping any that failed to load.
function fontsOption(font700: Buffer | null, font400: Buffer | null): SatoriFonts {
  const fonts: SatoriFonts = [];
  if (font700) fonts.push({ name: FONT_FAMILY, data: font700, weight: 700, style: 'normal' });
  if (font400) fonts.push({ name: FONT_FAMILY, data: font400, weight: 400, style: 'normal' });
  return fonts;
}

// Right-arrow as inline SVG (not the '→' glyph) so it renders regardless of whether the brand font
// (Work Sans) includes U+2192 — Latin text fonts often omit arrows.
// Both the arrow and the slash align to the vertical center of the LOGOS, not the center of the whole
// logo+symbol block: each is wrapped in a LOGO_SIZE-tall box pinned to the top of the row
// (align-self:flex-start), so the glyph centers within the logo band rather than dipping toward the symbol.
const ARROW = `<div style="display:flex;align-items:center;justify-content:center;align-self:flex-start;height:${LOGO_SIZE}px;margin:0 8px"><svg width="88" height="88" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="${GREEN}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`;
const SLASH = `<div style="display:flex;align-items:center;justify-content:center;align-self:flex-start;height:${LOGO_SIZE}px;font-size:72px;color:${GREEN};margin:0 24px">/</div>`;

// Cap concurrent renders: satori + resvg rasterization is synchronous CPU work that blocks the Node event
// loop, so an attacker cycling unique valid pairs/pools could saturate it and degrade every route. Excess
// renders queue (FIFO); a freed slot transfers directly to the next waiter so the active count is exact.
const MAX_CONCURRENT_RENDERS = 4;
// Bound the wait queue too: without this, a flood of requests piles up unbounded promises (memory DoS).
// Past the cap we reject fast; the caller (server.ts) catches and serves the static default image.
const MAX_QUEUED_RENDERS = 32;
let activeRenders = 0;
const renderWaiters: Array<() => void> = [];

async function withRenderSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (activeRenders >= MAX_CONCURRENT_RENDERS) {
    if (renderWaiters.length >= MAX_QUEUED_RENDERS) throw new Error('render queue full');
    await new Promise<void>(resolve => renderWaiters.push(resolve)); // a freed slot is handed to us
  } else {
    activeRenders++;
  }
  try {
    return await fn();
  } finally {
    const next = renderWaiters.shift();
    if (next)
      next(); // hand our slot to the next waiter — do not decrement
    else activeRenders--;
  }
}

// Rasterize a card HTML string to a PNG buffer: HTML -> Satori (SVG, glyphs embedded as paths) ->
// resvg (PNG). Throws if no font loaded (Satori needs ≥1) — the caller falls back to the default card.
async function renderCardPng(cardHtmlStr: string, fonts: SatoriFonts): Promise<Buffer> {
  if (!fonts.length) throw new Error('no font available for render');
  return withRenderSlot(async () => {
    const t0 = Date.now();
    const svg = await satori(toVNode(cardHtmlStr) as unknown as SatoriElement, { width: WIDTH, height: HEIGHT, fonts });
    const tSatori = Date.now() - t0;
    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH }, font: { loadSystemFonts: false } });
    const png = resvg.render().asPng();
    console.log(
      `[og] render satori=${tSatori}ms resvg=${Date.now() - t0 - tSatori}ms svgKB=${Math.round(svg.length / 1024)}`,
    );
    return png;
  });
}

export interface SwapOgInput {
  inToken: ResolvedToken | null;
  outToken: ResolvedToken | null;
  networkName: string;
  kind: 'swap' | 'limit';
}

/** Render the 1200x630 swap/limit pair OG card as a PNG buffer. Caller guarantees ≥1 token present. */
export async function renderSwapOg(input: SwapOgInput): Promise<Buffer> {
  const { inToken, outToken, networkName, kind } = input;
  const present = [inToken, outToken].filter((t): t is ResolvedToken => t !== null);

  const [logos, font700, font400, brandLogo] = await Promise.all([
    Promise.all(present.map(t => fetchLogoDataUri(t.logoURI))),
    loadFont(700),
    loadFont(400),
    loadBrandLogo(),
  ]);

  const syms = present.map(t => escapeHtml(shortSymbol(t.symbol)));
  const verbCap = kind === 'limit' ? 'Limit order' : 'Swap';
  const caption =
    present.length === 2
      ? kind === 'limit'
        ? `Place a limit order: ${syms[0]} → ${syms[1]} on KyberSwap`
        : `Swap ${syms[0]} for ${syms[1]} at the best rate across 20+ chains`
      : `${verbCap} ${syms[0]} on KyberSwap — best rates across 20+ chains`;

  const center =
    present.length === 2
      ? `${tokenBlock(logos[0], present[0].symbol)}${ARROW}${tokenBlock(logos[1], present[1].symbol)}`
      : tokenBlock(logos[0], present[0].symbol);

  return renderCardPng(cardHtml(networkName, center, caption, brandLogo), fontsOption(font700, font400));
}

export interface PoolOgInput {
  token0: PoolToken;
  token1: PoolToken;
  networkName: string;
  feeTier?: number;
}

/** Render the 1200x630 pool OG card as a PNG buffer (both token logos + a "/" + fee caption). */
export async function renderPoolOg(input: PoolOgInput): Promise<Buffer> {
  const { token0, token1, networkName, feeTier } = input;

  const [logos, font700, font400, brandLogo] = await Promise.all([
    Promise.all([fetchLogoDataUri(token0.logoURI), fetchLogoDataUri(token1.logoURI)]),
    loadFont(700),
    loadFont(400),
    loadBrandLogo(),
  ]);

  const feeText = typeof feeTier === 'number' ? ` · ${formatFeeTier(feeTier)}% fee` : '';
  const caption = `Provide liquidity & earn${feeText} on KyberSwap`;
  const center = `${tokenBlock(logos[0], token0.symbol)}${SLASH}${tokenBlock(logos[1], token1.symbol)}`;

  return renderCardPng(cardHtml(networkName, center, caption, brandLogo), fontsOption(font700, font400));
}
