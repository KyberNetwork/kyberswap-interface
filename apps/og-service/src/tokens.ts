// Token metadata resolution against the public ks-setting token-list API. Native gas token resolves
// via the EEE sentinel address; ERC-20s by address; whitelisted tokens by symbol. Results (and
// negative misses) are LRU-cached.
import { cache } from '@/cache';
import { KS_SETTING_TOKENS } from '@/config';
import { BROWSER_UA, NATIVE_SENTINEL, ZERO_ADDRESS, readBoundedText } from '@/constants';

const ADDRESS_RE = /^0x[0-9a-f]{40}$/;
const TOKEN_TTL_MS = 86_400_000; // 1 day
const MISS_TTL_MS = 600_000; // 10 min — bound the blast radius of junk-id floods
const MAX_ID_LEN = 64;

export interface ResolvedToken {
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  address: string;
}

interface RawToken {
  symbol?: string;
  name?: string;
  decimals?: number;
  logoURI?: string;
  address?: string;
  isWhitelisted?: boolean;
}

interface TokenListResponse {
  data?: { tokens?: RawToken[] };
}

function toResolved(t: RawToken): ResolvedToken | null {
  if (!t || !t.symbol) return null;
  return {
    symbol: t.symbol,
    name: t.name ?? t.symbol,
    decimals: typeof t.decimals === 'number' ? t.decimals : 18,
    logoURI: t.logoURI || undefined,
    address: (t.address ?? '').toLowerCase(),
  };
}

async function fetchJson(url: string): Promise<TokenListResponse | null> {
  try {
    const res = await fetch(url, {
      // ks-setting WAF 403s requests without a browser-like User-Agent.
      headers: { accept: 'application/json', 'user-agent': BROWSER_UA },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const body = await readBoundedText(res);
    return body ? (JSON.parse(body) as TokenListResponse) : null;
  } catch {
    return null;
  }
}

async function resolveByAddress(chainId: number, address: string): Promise<ResolvedToken | null> {
  const json = await fetchJson(`${KS_SETTING_TOKENS}?chainIds=${chainId}&addresses=${address}`);
  const token = json?.data?.tokens?.[0];
  return token ? toResolved(token) : null;
}

async function resolveBySymbol(chainId: number, symbol: string): Promise<ResolvedToken | null> {
  const url = `${KS_SETTING_TOKENS}?chainIds=${chainId}&query=${encodeURIComponent(symbol)}&page=1&pageSize=20`;
  const json = await fetchJson(url);
  const tokens = json?.data?.tokens ?? [];
  if (!tokens.length) return null;
  const wanted = symbol.toLowerCase();
  // Prefer an exact (case-insensitive) symbol match, whitelisted first; else fall back to the top hit.
  const exact = tokens.filter(t => (t.symbol ?? '').toLowerCase() === wanted);
  const pick = exact.find(t => t.isWhitelisted) ?? exact[0] ?? tokens.find(t => t.isWhitelisted) ?? tokens[0];
  return pick ? toResolved(pick) : null;
}

/**
 * Resolve a single token segment (`<in>` or `<out>`) to its symbol + logo. `idRaw` is a lowercased
 * ERC-20 address or a token symbol. `nativeSymbol` is the chain's gas-token symbol. LRU-cached.
 */
export async function resolveToken(
  chainId: number,
  idRaw: string,
  nativeSymbol: string,
): Promise<ResolvedToken | null> {
  const id = (idRaw || '').trim().toLowerCase();
  if (!id || id.length > MAX_ID_LEN) return null;

  const cacheKey = `tok:${chainId}:${id}`;
  const cached = cache.get<ResolvedToken | null>(cacheKey);
  if (cached !== undefined) return cached; // a cached `null` is a valid negative hit

  const isAddress = ADDRESS_RE.test(id);
  const native = nativeSymbol.toLowerCase();
  // Treat bare 'eth' as native only on ETH-native chains — on e.g. BNB Chain 'eth' is the bridged ERC-20.
  const isNative = id === NATIVE_SENTINEL || id === ZERO_ADDRESS || id === native || (id === 'eth' && native === 'eth');

  let resolved: ResolvedToken | null;
  if (isNative) resolved = await resolveByAddress(chainId, NATIVE_SENTINEL);
  else if (isAddress) resolved = await resolveByAddress(chainId, id);
  else resolved = await resolveBySymbol(chainId, id);

  cache.set(cacheKey, resolved, resolved ? TOKEN_TTL_MS : MISS_TTL_MS);
  return resolved;
}
