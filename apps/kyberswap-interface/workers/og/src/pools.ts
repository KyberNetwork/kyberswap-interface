// Pool resolution against the public KyberSwap earn-service explorer endpoint.
// Verified live: GET https://earn-service.kyberswap.com/api/v1/explorer/pools is anonymously callable
// and returns { code, message, data: { pools: [{ address, exchange, feeTier, tokens: [{ symbol,
// logoURI, address }] }] } }. This endpoint (unlike /v1/pools) carries token logoURI + feeTier, which
// is what the OG card needs. See src/services/zapEarn.ts (poolsExplorer) in the app.
import { CACHE_KEY_ORIGIN, EARN_SERVICE_POOLS } from '@/constants'

const ADDRESS_RE = /^0x[0-9a-f]{40}$/
const MAX_PROTOCOL_LEN = 48
const POOL_CACHE_TTL = 86400
const MISS_TTL = 600

export interface PoolToken {
  symbol: string
  logoURI?: string
}

export interface ResolvedPool {
  token0: PoolToken
  token1: PoolToken
  feeTier?: number
  exchange?: string
}

interface RawPoolToken {
  symbol?: string
  logoURI?: string
}

interface RawPool {
  exchange?: string
  feeTier?: number
  tokens?: RawPoolToken[]
}

interface PoolsResponse {
  data?: { pools?: RawPool[] }
}

function toResolved(pool: RawPool): ResolvedPool | null {
  const t0 = pool.tokens?.[0]
  const t1 = pool.tokens?.[1]
  if (!t0?.symbol || !t1?.symbol) return null
  return {
    token0: { symbol: t0.symbol, logoURI: t0.logoURI || undefined },
    token1: { symbol: t1.symbol, logoURI: t1.logoURI || undefined },
    feeTier: typeof pool.feeTier === 'number' ? pool.feeTier : undefined,
    exchange: pool.exchange || undefined,
  }
}

/**
 * Resolve a pool's two tokens (symbol + logo) + feeTier from (chainId, poolAddress). `protocol` is
 * optional — it only disambiguates the rare case of multiple pools at the same address. Edge-cached
 * (hits 1 day, misses 10 min). Returns null for a bad address or an unresolvable pool.
 */
export async function resolvePool(
  chainId: number,
  addressRaw: string,
  protocol: string,
  cache: Cache,
  ctx: ExecutionContext,
): Promise<ResolvedPool | null> {
  const address = (addressRaw || '').trim().toLowerCase()
  if (!ADDRESS_RE.test(address)) return null
  const proto = (protocol || '').trim().toLowerCase().slice(0, MAX_PROTOCOL_LEN)

  const cacheKey = new Request(`${CACHE_KEY_ORIGIN}/pool/${chainId}/${address}`)
  const cached = await cache.match(cacheKey)
  if (cached) {
    try {
      return (await cached.json()) as ResolvedPool | null
    } catch {
      /* fall through to refetch */
    }
  }

  let resolved: ResolvedPool | null = null
  try {
    const params = new URLSearchParams({ chainId: String(chainId), q: address, limit: '1' })
    if (proto) params.set('protocol', proto)
    const res = await fetch(`${EARN_SERVICE_POOLS}?${params.toString()}`, {
      cf: { cacheTtl: POOL_CACHE_TTL, cacheEverything: true },
      headers: { accept: 'application/json' },
    })
    if (res.ok) {
      const json = (await res.json()) as PoolsResponse
      const pool = json?.data?.pools?.[0]
      resolved = pool ? toResolved(pool) : null
    }
  } catch {
    resolved = null
  }

  ctx.waitUntil(
    cache.put(
      cacheKey,
      new Response(JSON.stringify(resolved ?? null), {
        headers: {
          'content-type': 'application/json',
          'cache-control': `public, max-age=${resolved ? POOL_CACHE_TTL : MISS_TTL}`,
        },
      }),
    ),
  )
  return resolved
}
