// Pool resolution against the public earn-service explorer endpoint (carries token logoURI + feeTier).
import { cache } from '@/cache';
import { EARN_SERVICE_POOLS } from '@/config';
import { BROWSER_UA, readBoundedText } from '@/constants';

const ADDRESS_RE = /^0x[0-9a-f]{40}$/;
const MAX_PROTOCOL_LEN = 48;
const POOL_TTL_MS = 86_400_000; // 1 day
const MISS_TTL_MS = 600_000; // 10 min

export interface PoolToken {
  symbol: string;
  logoURI?: string;
}

export interface ResolvedPool {
  token0: PoolToken;
  token1: PoolToken;
  feeTier?: number;
  exchange?: string;
}

interface RawPoolToken {
  symbol?: string;
  logoURI?: string;
}

interface RawPool {
  exchange?: string;
  feeTier?: number;
  tokens?: RawPoolToken[];
}

interface PoolsResponse {
  data?: { pools?: RawPool[] };
}

function toResolved(pool: RawPool): ResolvedPool | null {
  const t0 = pool.tokens?.[0];
  const t1 = pool.tokens?.[1];
  if (!t0?.symbol || !t1?.symbol) return null;
  return {
    token0: { symbol: t0.symbol, logoURI: t0.logoURI || undefined },
    token1: { symbol: t1.symbol, logoURI: t1.logoURI || undefined },
    feeTier: typeof pool.feeTier === 'number' ? pool.feeTier : undefined,
    exchange: pool.exchange || undefined,
  };
}

/**
 * Resolve a pool's two tokens (symbol + logo) + feeTier from (chainId, poolAddress). `protocol` only
 * disambiguates the rare multiple-pools-at-one-address case. LRU-cached (hits 1 day, misses 10 min).
 */
export async function resolvePool(chainId: number, addressRaw: string, protocol: string): Promise<ResolvedPool | null> {
  const address = (addressRaw || '').trim().toLowerCase();
  if (!ADDRESS_RE.test(address)) return null;
  const proto = (protocol || '').trim().toLowerCase().slice(0, MAX_PROTOCOL_LEN);

  const cacheKey = `pool:${chainId}:${address}:${proto}`;
  const cached = cache.get<ResolvedPool | null>(cacheKey);
  if (cached !== undefined) return cached;

  let resolved: ResolvedPool | null = null;
  try {
    const params = new URLSearchParams({ chainId: String(chainId), q: address, limit: '1' });
    if (proto) params.set('protocol', proto);
    const res = await fetch(`${EARN_SERVICE_POOLS}?${params.toString()}`, {
      // Same WAF as ks-setting — needs a browser-like User-Agent.
      headers: { accept: 'application/json', 'user-agent': BROWSER_UA },
      // Generous: the explorer response is heavy (sparkline arrays), so a cold fetch can exceed 2s.
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const body = await readBoundedText(res);
      const json = body ? (JSON.parse(body) as PoolsResponse) : null;
      const pool = json?.data?.pools?.[0];
      resolved = pool ? toResolved(pool) : null;
    }
  } catch {
    resolved = null;
  }

  cache.set(cacheKey, resolved, resolved ? POOL_TTL_MS : MISS_TTL_MS);
  return resolved;
}
