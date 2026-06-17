import { decode as decodeWebp } from '@cwasm/webp';
import decodeAvif, { init as initAvifDecoder } from '@jsquash/avif/decode.js';
import { Resvg } from '@resvg/resvg-js';
import { encode as encodePng } from 'fast-png';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
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

// WebAssembly is a Node global but isn't in the ES2022 lib (and we avoid the DOM lib to keep its globals
// out of this Node service). Declare the one method used to compile the AVIF decoder wasm.
declare const WebAssembly: { compile(bytes: Uint8Array | ArrayBuffer): Promise<unknown> };

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

// WebP is decoded + re-encoded to PNG (satori/resvg don't read WebP), so an embedded data URI is always
// PNG or JPEG — DATA_URI_RE stays png|jpeg.
const DATA_URI_RE = /^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/=]+$/;
const LOGO_FETCH_TIMEOUT_MS = 1500;
const MAX_LOGO_BYTES = 512 * 1024;
// Reject a WebP that decodes to an absurd resolution (a decompression bomb): token logos are tiny, and a
// huge intermediate RGBA buffer (width*height*4) would otherwise be allocated before the downscale.
const MAX_LOGO_DIM = 2048;
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

// Only logos heavy enough to bloat the satori SVG (e.g. the ~157KB native-ETH logo, which satori would
// decode in JS — slow) need shrinking. Below this, downscaling only HURTS: it upscales a tiny source
// (many logos are 32–64px) to LOGO_RENDER_W and double-resamples it, softening it.
const DOWNSCALE_MIN_DATA_URI_LEN = 48 * 1024;

// Re-rasterize a heavy PNG/JPEG logo (data URI) down to LOGO_RENDER_W via resvg so it doesn't bloat the
// satori SVG (satori decodes embedded rasters in JS). Small logos pass through unchanged — a single
// resample at final render is sharper than upscaling to LOGO_RENDER_W and downscaling again. On any
// failure, returns the input unchanged.
function downscaleLogoDataUri(dataUri: string): string {
  if (dataUri.length < DOWNSCALE_MIN_DATA_URI_LEN) return dataUri;
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

// Read the WebP RIFF header (VP8 lossy / VP8L lossless / VP8X extended) for the canvas dimensions WITHOUT
// decoding pixels — a cheap pre-check so a decompression-bomb logo (huge dimensions in a tiny file) is
// rejected before decodeWebp() allocates its width*height*4 RGBA buffer. Null if not parseable (the caller
// then relies on the post-decode size guard as a backstop).
function webpDimensions(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 16 || buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null;
  const id = buf.toString('ascii', 12, 16);
  // VP8 lossy: 14-bit width/height stored directly. VP8L/VP8X store (dimension - 1).
  if (id === 'VP8 ' && buf.length >= 30)
    return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  if (id === 'VP8L' && buf.length >= 25) {
    const b = buf.readUInt32LE(21);
    return { width: (b & 0x3fff) + 1, height: ((b >>> 14) & 0x3fff) + 1 };
  }
  if (id === 'VP8X' && buf.length >= 30) {
    return {
      width: (buf[24] | (buf[25] << 8) | (buf[26] << 16)) + 1,
      height: (buf[27] | (buf[28] << 8) | (buf[29] << 16)) + 1,
    };
  }
  return null;
}

// Token logos are increasingly WebP, which neither satori nor resvg decodes. Decode it to raw RGBA
// (@cwasm/webp, WASM) and re-encode as PNG (fast-png) so the rest of the pipeline embeds a PNG. Returns
// null on a decode failure or an oversized image; the caller then falls back to the letter circle.
function webpToPng(webp: Buffer): Buffer | null {
  try {
    // Reject a decompression bomb from the header before decodeWebp() allocates the full RGBA buffer.
    const dims = webpDimensions(webp);
    if (dims && (dims.width > MAX_LOGO_DIM || dims.height > MAX_LOGO_DIM)) return null;
    const img = decodeWebp(webp);
    if (!img.width || !img.height || img.width > MAX_LOGO_DIM || img.height > MAX_LOGO_DIM) return null;
    // fast-png wants a Uint8Array; @cwasm/webp returns RGBA as a Uint8ClampedArray — re-view the bytes.
    const data = new Uint8Array(img.data.buffer, img.data.byteOffset, img.data.byteLength);
    const png = encodePng({ width: img.width, height: img.height, data, channels: 4, depth: 8 });
    return Buffer.from(png);
  } catch {
    return null;
  }
}

// @jsquash/avif decodes via WASM; in Node we compile + init the ~1MB decoder module ourselves (its
// browser path fetch()es it). Memoized so it compiles once, lazily on the first AVIF logo. The shipped
// types declare init()'s first arg as options, but at runtime it is the WebAssembly.Module — hence the cast.
const requireFromHere = createRequire(import.meta.url);
let avifInit: Promise<void> | undefined;
function ensureAvifDecoder(): Promise<void> {
  if (!avifInit) {
    avifInit = (async () => {
      const wasm = await WebAssembly.compile(
        await readFile(requireFromHere.resolve('@jsquash/avif/codec/dec/avif_dec.wasm')),
      );
      await (initAvifDecoder as unknown as (m: unknown) => Promise<void>)(wasm);
    })().catch(e => {
      avifInit = undefined; // don't memoize a transient init failure
      throw e;
    });
  }
  return avifInit;
}

// AVIF canvas dimensions from the ISOBMFF `ispe` box (4-byte version/flags, then 32-bit BE width + height)
// without decoding — a cheap pre-check that rejects a decompression-bomb AVIF before the AV1 decode runs.
function avifDimensions(buf: Buffer): { width: number; height: number } | null {
  const i = buf.indexOf('ispe', 0, 'latin1');
  if (i < 0 || i + 16 > buf.length) return null;
  const width = buf.readUInt32BE(i + 8);
  const height = buf.readUInt32BE(i + 12);
  return width && height ? { width, height } : null;
}

// Decode an AVIF logo (satori/resvg can't read AVIF) to PNG: WASM AV1 decode -> RGBA -> fast-png. Null on
// failure or an oversized image; the caller falls back to the letter circle. AV1 decode is the heaviest
// path, so it is gated by the dimension guard above and the per-URL logo cache (decodes once per logo).
async function avifToPng(avif: Buffer): Promise<Buffer | null> {
  try {
    const dims = avifDimensions(avif);
    if (dims && (dims.width > MAX_LOGO_DIM || dims.height > MAX_LOGO_DIM)) return null;
    await ensureAvifDecoder();
    const ab = avif.buffer.slice(avif.byteOffset, avif.byteOffset + avif.byteLength) as ArrayBuffer;
    const img = (await decodeAvif(ab)) as { width: number; height: number; data: Uint8ClampedArray } | null;
    if (!img || !img.width || !img.height || img.width > MAX_LOGO_DIM || img.height > MAX_LOGO_DIM) return null;
    const data = new Uint8Array(img.data.buffer, img.data.byteOffset, img.data.byteLength);
    const png = encodePng({ width: img.width, height: img.height, data, channels: 4, depth: 8 });
    return Buffer.from(png);
  } catch {
    return null;
  }
}

// The real image format from the file's magic bytes. Token-logo CDNs sometimes serve a PNG/JPEG/WebP/AVIF
// as `application/octet-stream` (or another wrong Content-Type), so the header isn't reliable — browsers
// sniff the bytes, and so do we. Null if the bytes aren't a supported image.
function sniffImageMime(buf: Buffer): 'image/png' | 'image/jpeg' | 'image/webp' | 'image/avif' | null {
  if (buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP')
    return 'image/webp';
  // AVIF (ISOBMFF): an `ftyp` box whose major or compatible brand list contains `avif`.
  if (
    buf.length >= 12 &&
    buf.toString('ascii', 4, 8) === 'ftyp' &&
    buf.toString('latin1', 8, Math.min(buf.length, 40)).includes('avif')
  )
    return 'image/avif';
  return null;
}

// Satori can't fetch remote <img> reliably, so inline the bytes as a base64 data URI. Hardened:
// browser UA (CDNs 403 bare fetches), PNG/JPEG/WebP/AVIF only (WebP+AVIF re-encoded to PNG), size-bounded, timeout,
// and — crucially for an origin deployment — `redirect: 'manual'` so a vetted host can't 302 us to an
// internal IP (SSRF).
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
    // Stream-bounded read: aborts past MAX_LOGO_BYTES instead of buffering an unbounded (community-
    // influenced) body first — readBoundedArrayBuffer throws over the cap, caught below as a null logo.
    const buf = await readBoundedArrayBuffer(res, MAX_LOGO_BYTES);
    let bytes = Buffer.from(buf);
    // Trust the magic bytes, not the Content-Type header (logo CDNs mislabel images as octet-stream).
    const sniffed = sniffImageMime(bytes);
    if (!sniffed) return null;
    // satori/resvg can't read WebP/AVIF — convert them to PNG so the embedded data URI is always PNG/JPEG.
    let outMime: string = sniffed;
    if (sniffed === 'image/webp') {
      const png = webpToPng(bytes);
      if (!png) return null;
      bytes = png;
      outMime = 'image/png';
    } else if (sniffed === 'image/avif') {
      const png = await avifToPng(bytes);
      if (!png) return null;
      bytes = png;
      outMime = 'image/png';
    }
    const dataUri = `data:${outMime};base64,${bytes.toString('base64')}`;
    return DATA_URI_RE.test(dataUri) ? dataUri : null;
  } catch {
    return null;
  }
}

function logoHtml(dataUri: string | null, symbol: string): string {
  if (dataUri) {
    return `<img src="${dataUri}" width="${LOGO_SIZE}" height="${LOGO_SIZE}" style="border-radius:9999px" />`;
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

export interface RenderResult {
  png: Buffer;
  /** false when a token that HAS a logoURI fell back to the letter circle (a transient logo-fetch miss),
   *  so the caller can cache the degraded image briefly instead of for the full image TTL. */
  complete: boolean;
}

export interface SwapOgInput {
  inToken: ResolvedToken | null;
  outToken: ResolvedToken | null;
  networkName: string;
  kind: 'swap' | 'limit';
}

/** Render the 1200x630 swap/limit pair OG card. Caller guarantees ≥1 token present. */
export async function renderSwapOg(input: SwapOgInput): Promise<RenderResult> {
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

  // A token with a logoURI that resolved to null fell back to the letter circle (transient fetch miss).
  const complete = present.every((t, i) => !t.logoURI || logos[i] !== null);
  const png = await renderCardPng(cardHtml(networkName, center, caption, brandLogo), fontsOption(font700, font400));
  return { png, complete };
}

export interface PoolOgInput {
  token0: PoolToken;
  token1: PoolToken;
  networkName: string;
  feeTier?: number;
}

/** Render the 1200x630 pool OG card (both token logos + a "/" + fee caption). */
export async function renderPoolOg(input: PoolOgInput): Promise<RenderResult> {
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

  // A token with a logoURI that resolved to null fell back to the letter circle (transient fetch miss).
  const complete = [token0, token1].every((t, i) => !t.logoURI || logos[i] !== null);
  const png = await renderCardPng(cardHtml(networkName, center, caption, brandLogo), fontsOption(font700, font400));
  return { png, complete };
}
