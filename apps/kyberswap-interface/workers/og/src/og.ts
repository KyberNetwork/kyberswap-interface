import { ImageResponse } from 'workers-og'

import { loadFont, FONT_FAMILY } from '@/font'
import type { ResolvedToken } from '@/tokens'

// ---- brand ----
const GREEN = '#31CB9E'
const BG = '#0D0D0D'
const WHITE = '#FFFFFF'
const SUBTEXT = '#A9A9A9'
const MUTED = '#7A7A7A'
const FALLBACK_CIRCLE = '#2A2A2A'

const WIDTH = 1200
const HEIGHT = 630
const LOGO_SIZE = 180

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function shortSymbol(sym: string): string {
  const s = sym.trim()
  return s.length > 12 ? `${s.slice(0, 11)}…` : s
}

const ALLOWED_LOGO_MIME = new Set(['image/png', 'image/jpeg'])
// Strict shape for an emitted data URI: known image mime + pure base64. Nothing matching this can
// contain a quote, so interpolating it into the card HTML attribute can't break out of the attribute.
const DATA_URI_RE = /^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/=]+$/
const LOGO_FETCH_TIMEOUT_MS = 1500

// `logoURI` ultimately comes from the ks-setting token list (community-influenced), so treat it as
// untrusted: only fetch plain https URLs on the default port with a real hostname. This stops the
// worker being used as an SSRF proxy (arbitrary ports / IP-literals / internal hosts) if a hostile
// logoURI ever lands in the list. We intentionally do NOT pin a CDN allowlist — token logos
// legitimately come from many CDNs — but https + default-port + non-IP host neutralizes the abuse.
function isSafeLogoUrl(url: string): boolean {
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return false
  }
  if (u.protocol !== 'https:') return false
  if (u.username || u.password) return false
  if (u.port && u.port !== '443') return false
  const host = u.hostname
  if (host === 'localhost' || host.startsWith('[') || host.includes(':')) return false // localhost / IPv6
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false // IPv4 literal
  return true
}

// Satori does NOT reliably fetch remote <img src> on the Workers runtime — fetch the bytes ourselves
// and inline as a base64 data URI. Spoof a browser UA (CDNs 403 bare worker fetches), allowlist the
// mime to PNG/JPEG (Satori can't decode WebP; remote SVG is fragile), chunk the base64 (btoa
// overflows on big inputs), and bound the fetch with a timeout so a hung CDN can't stall the render.
async function fetchLogoDataUri(url: string | undefined): Promise<string | null> {
  if (!url) return null
  // A data: URI is accepted only if it's already a safe png/jpeg base64 payload.
  if (url.startsWith('data:')) return DATA_URI_RE.test(url) ? url : null
  if (!isSafeLogoUrl(url)) return null
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        Accept: 'image/png,image/jpeg,image/*,*/*',
      },
      cf: { cacheTtl: 86400, cacheEverything: true },
      signal: AbortSignal.timeout(LOGO_FETCH_TIMEOUT_MS),
    })
    if (!res.ok) return null
    // Allowlist the mime (don't trust an arbitrary upstream content-type string).
    const mime = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
    if (!ALLOWED_LOGO_MIME.has(mime)) return null
    const buf = await res.arrayBuffer()
    // Guard against pathologically large logos blowing up the satori-html parser.
    if (buf.byteLength > 512 * 1024) return null
    const dataUri = `data:${mime};base64,${arrayBufferToBase64(buf)}`
    return DATA_URI_RE.test(dataUri) ? dataUri : null
  } catch {
    return null
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

function logoHtml(dataUri: string | null, symbol: string): string {
  if (dataUri) {
    return `<img src="${dataUri}" width="${LOGO_SIZE}" height="${LOGO_SIZE}" style="border-radius:9999px;background:${WHITE}" />`
  }
  const letter = escapeHtml((symbol[0] || '?').toUpperCase())
  return `<div style="display:flex;align-items:center;justify-content:center;width:${LOGO_SIZE}px;height:${LOGO_SIZE}px;border-radius:9999px;background:${FALLBACK_CIRCLE};color:${GREEN};font-size:84px;font-weight:700">${letter}</div>`
}

function tokenBlock(dataUri: string | null, symbol: string): string {
  return `<div style="display:flex;flex-direction:column;align-items:center;width:330px">
    ${logoHtml(dataUri, symbol)}
    <div style="display:flex;margin-top:28px;font-size:52px;font-weight:700;color:${WHITE}">${escapeHtml(shortSymbol(symbol))}</div>
  </div>`
}

export interface SwapOgInput {
  // A null side means a one-sided link (no second token) — the caller guarantees at least one side.
  inToken: ResolvedToken | null
  outToken: ResolvedToken | null
  networkName: string
  kind: 'swap' | 'limit'
}

/**
 * Render the 1200x630 swap-pair OG card as a PNG Response. Logos are inlined as data URIs (with a
 * div-circle fallback), so the card always renders even if a logo fetch fails.
 */
export async function renderSwapOg(input: SwapOgInput, ctx: ExecutionContext): Promise<Response> {
  const { inToken, outToken, networkName, kind } = input
  // Caller guarantees at least one side. With both, render "logo → logo"; with one, a single token.
  const present = [inToken, outToken].filter((t): t is ResolvedToken => t !== null)

  const [logos, font700, font400] = await Promise.all([
    Promise.all(present.map(t => fetchLogoDataUri(t.logoURI))),
    loadFont(700, ctx),
    loadFont(400, ctx),
  ])

  const syms = present.map(t => escapeHtml(shortSymbol(t.symbol)))
  const verbCap = kind === 'limit' ? 'Limit order' : 'Swap'
  const caption =
    present.length === 2
      ? kind === 'limit'
        ? `Place a limit order: ${syms[0]} → ${syms[1]} on KyberSwap`
        : `Swap ${syms[0]} for ${syms[1]} at the best rate across 20+ chains`
      : `${verbCap} ${syms[0]} on KyberSwap — best rates across 20+ chains`

  const arrow = `<div style="display:flex;align-items:center;justify-content:center;font-size:88px;color:${GREEN};margin:0 16px">→</div>`
  const center =
    present.length === 2
      ? `${tokenBlock(logos[0], present[0].symbol)}${arrow}${tokenBlock(logos[1], present[1].symbol)}`
      : tokenBlock(logos[0], present[0].symbol)

  const html = `<div style="display:flex;flex-direction:column;justify-content:space-between;width:${WIDTH}px;height:${HEIGHT}px;padding:72px 80px;background:${BG};font-family:'${FONT_FAMILY}'">
    <div style="display:flex;align-items:center;justify-content:space-between;width:100%">
      <div style="display:flex">
        <div style="color:${GREEN};font-size:48px;font-weight:700">Kyber</div>
        <div style="color:${WHITE};font-size:48px;font-weight:700">Swap</div>
      </div>
      <div style="display:flex;font-size:32px;color:${SUBTEXT}">on ${escapeHtml(networkName)}</div>
    </div>
    <div style="display:flex;align-items:center;justify-content:center;width:100%">
      ${center}
    </div>
    <div style="display:flex;font-size:32px;color:${MUTED}">${caption}</div>
  </div>`

  const fonts = [
    font700 ? { name: FONT_FAMILY, data: font700, weight: 700 as const, style: 'normal' as const } : null,
    font400 ? { name: FONT_FAMILY, data: font400, weight: 400 as const, style: 'normal' as const } : null,
  ].filter((f): f is NonNullable<typeof f> => f !== null)

  return new ImageResponse(html, {
    width: WIDTH,
    height: HEIGHT,
    // If both font loads failed, omit `fonts` so workers-og falls back to its bundled default rather
    // than rendering blank text.
    ...(fonts.length ? { fonts } : {}),
  })
}
