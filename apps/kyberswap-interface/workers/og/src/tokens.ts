// Token metadata resolution against the public KyberSwap ks-setting token-list API.
// Verified live: GET https://ks-setting.kyberswap.com/api/v1/tokens is anonymously callable
// (no auth) and returns { code, message, data: { tokens: [{ symbol, name, decimals, logoURI,
// address, chainId }], pagination } }. The native gas token resolves directly via the EEE sentinel
// address on every chain. See src/services/ksSetting.ts + src/hooks/Tokens.ts in the app.

import { CACHE_KEY_ORIGIN, KS_SETTING_TOKENS, NATIVE_SENTINEL, ZERO_ADDRESS } from '@/constants'

const ADDRESS_RE = /^0x[0-9a-f]{40}$/

export interface ResolvedToken {
  symbol: string
  name: string
  decimals: number
  logoURI?: string
  address: string
}

interface RawToken {
  symbol?: string
  name?: string
  decimals?: number
  logoURI?: string
  address?: string
  isWhitelisted?: boolean
}

interface TokenListResponse {
  data?: { tokens?: RawToken[] }
}

// Cache resolved token metadata in the per-PoP edge cache for a day. Logos/symbols change rarely, and
// this keeps the hot path (and the image endpoint) from re-hitting ks-setting on every request.
const TOKEN_CACHE_TTL = 86400
// Negatively cache misses for a short window so a flood of junk ids (random `out=` values) can't
// amplify load against ks-setting — each distinct miss hits upstream at most once per MISS_TTL per PoP.
const MISS_TTL = 600
// Reject absurdly long ids before doing any work (an address is 42 chars; symbols are short).
const MAX_ID_LEN = 64

function toResolved(t: RawToken): ResolvedToken | null {
  if (!t || !t.symbol) return null
  return {
    symbol: t.symbol,
    name: t.name ?? t.symbol,
    decimals: typeof t.decimals === 'number' ? t.decimals : 18,
    logoURI: t.logoURI || undefined,
    address: (t.address ?? '').toLowerCase(),
  }
}

async function fetchJson(url: string): Promise<TokenListResponse | null> {
  try {
    const res = await fetch(url, {
      // Edge-cache the upstream API response too (belt-and-suspenders with the resolved-token cache).
      cf: { cacheTtl: TOKEN_CACHE_TTL, cacheEverything: true },
      headers: { accept: 'application/json' },
    })
    if (!res.ok) return null
    return (await res.json()) as TokenListResponse
  } catch {
    return null
  }
}

async function resolveByAddress(chainId: number, address: string): Promise<ResolvedToken | null> {
  const url = `${KS_SETTING_TOKENS}?chainIds=${chainId}&addresses=${address}`
  const json = await fetchJson(url)
  const token = json?.data?.tokens?.[0]
  return token ? toResolved(token) : null
}

async function resolveBySymbol(chainId: number, symbol: string): Promise<ResolvedToken | null> {
  const url = `${KS_SETTING_TOKENS}?chainIds=${chainId}&query=${encodeURIComponent(symbol)}&page=1&pageSize=20`
  const json = await fetchJson(url)
  const tokens = json?.data?.tokens ?? []
  if (!tokens.length) return null
  const wanted = symbol.toLowerCase()
  // Prefer an exact (case-insensitive) symbol match, whitelisted first; else fall back to the top hit.
  const exact = tokens.filter(t => (t.symbol ?? '').toLowerCase() === wanted)
  const pick = exact.find(t => t.isWhitelisted) ?? exact[0] ?? tokens.find(t => t.isWhitelisted) ?? tokens[0]
  return pick ? toResolved(pick) : null
}

/**
 * Resolve a single token segment from a swap URL (`<in>` or `<out>` of `<in>-to-<out>`) to its
 * symbol + logo. `idRaw` is either a lowercased ERC-20 address or a token symbol (native or
 * whitelisted), exactly as it appears in the path. `nativeSymbol` is the chain's gas-token symbol.
 * Result is edge-cached. Returns null if the token can't be resolved.
 */
export async function resolveToken(
  chainId: number,
  idRaw: string,
  nativeSymbol: string,
  cache: Cache,
  ctx: ExecutionContext,
): Promise<ResolvedToken | null> {
  const id = (idRaw || '').trim().toLowerCase()
  if (!id || id.length > MAX_ID_LEN) return null

  const cacheKey = new Request(`${CACHE_KEY_ORIGIN}/token/${chainId}/${encodeURIComponent(id)}`)
  const cached = await cache.match(cacheKey)
  if (cached) {
    try {
      // A negatively-cached miss is stored as JSON `null` and returns null here (no refetch).
      return (await cached.json()) as ResolvedToken | null
    } catch {
      /* fall through to refetch */
    }
  }

  let resolved: ResolvedToken | null
  const isAddress = ADDRESS_RE.test(id)
  const native = nativeSymbol.toLowerCase()
  // Treat the bare 'eth' symbol as native only on ETH-native chains — on e.g. BNB Chain, 'eth' is the
  // bridged ERC-20, not the gas token, so it must resolve via the symbol path.
  const isNative = id === NATIVE_SENTINEL || id === ZERO_ADDRESS || id === native || (id === 'eth' && native === 'eth')

  if (isNative) {
    resolved = await resolveByAddress(chainId, NATIVE_SENTINEL)
  } else if (isAddress) {
    resolved = await resolveByAddress(chainId, id)
  } else {
    resolved = await resolveBySymbol(chainId, id)
  }

  // Cache both hits (1 day) and misses (short) so junk ids can't repeatedly hammer ks-setting.
  ctx.waitUntil(
    cache.put(
      cacheKey,
      new Response(JSON.stringify(resolved ?? null), {
        headers: {
          'content-type': 'application/json',
          'cache-control': `public, max-age=${resolved ? TOKEN_CACHE_TTL : MISS_TTL}`,
        },
      }),
    ),
  )
  return resolved
}
