// Cross-chain token resolution. The `/cross-chain` route's `tokenIn`/`tokenOut` can live on an EVM chain
// (resolved via ks-setting, same as swap/limit) OR on one of the three non-EVM chains. Each non-EVM chain
// needs its own public source — there is no single endpoint returning symbol+logo for every chain type:
//   - Bitcoin: a single hardcoded constant (mirrors the app's BitcoinToken).
//   - Solana:  Jupiter datapi (symbol + icon) by mint address.
//   - NEAR:    1click chaindefuser token list (symbol only — no logo field); the logo is best-effort
//              re-resolved from the underlying bridged asset (EVM via ks-setting / Solana via Jupiter).
// Values mirrored from the app (logo URLs, native symbols) are kept literal — this service doesn't import
// app code (see CLAUDE.md "Standalone constraint").
import { cache } from '@/cache';
import { BROWSER_UA, NATIVE_SENTINEL, readBoundedText } from '@/constants';
import type { ChainInfo } from '@/networks';
import { type ResolvedToken, resolveToken } from '@/tokens';

const CC_TOKEN_TTL_MS = 86_400_000; // 1 day
const CC_MISS_TTL_MS = 600_000; // 10 min — bound the blast radius of junk-id floods
const ONECLICK_TTL_MS = 600_000; // 10 min — the NEAR token list is small and changes slowly

// Cap on a cross-chain token id. Generous enough for NEAR assetIds (`nep141:…omft.near`), which are
// longer than an EVM address/symbol. Enforced on both the image route and the head-injection meta path.
export const MAX_CC_TOKEN_LEN = 96;

// Native-token sentinels carried in the cross-chain URL when no explicit token is chosen (mirror the
// app's getDefaultTokenForChain). EVM uses the EEE address sentinel resolveToken already understands.
const SOLANA_NATIVE = '11111111111111111111111111111111'; // 32 base58 ones
const WSOL_MINT = 'So11111111111111111111111111111111111111112';
const NEAR_NATIVE = 'near';

// Chain logos (Google-Storage CDN URLs the service already trusts) mirror the app's NonEvmChainInfo /
// BitcoinToken (adapters/types.ts). Used as the native-token logo for NEAR/Bitcoin.
const NEAR_LOGO =
  'https://storage.googleapis.com/ks-setting-1d682dca/000c677f-2ebc-44cc-8d76-e4c6d07627631744962669170.png';
const BITCOIN_LOGO =
  'https://storage.googleapis.com/ks-setting-1d682dca/285205e7-a16d-421c-a794-67439cd6b54f1751515894455.png';

// Public, anonymous non-EVM token endpoints (mirror useSolanaTokens / useNearTokens).
const JUPITER_SEARCH = 'https://datapi.jup.ag/v1/assets/search?query=';
const ONECLICK_TOKENS = 'https://1click.chaindefuser.com/v0/tokens';

// 1click `blockchain` codes → EVM chainId, for re-resolving a bridged NEAR asset's logo via ks-setting.
// Incomplete by design: a bridged asset from an unlisted chain just falls through to the letter circle.
const ONECLICK_EVM_CHAIN: Record<string, number> = {
  eth: 1,
  base: 8453,
  arb: 42161,
  bsc: 56,
  pol: 137,
  op: 10,
  avax: 43114,
  scroll: 534352,
  bera: 80094,
  monad: 143,
  plasma: 9745,
};

const SOLANA_MINT_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const EVM_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

/** The default native-token id for a chain when the cross-chain URL omits `tokenIn`/`tokenOut`. */
export function defaultTokenId(chain: ChainInfo): string {
  switch (chain.nonEvm) {
    case 'solana':
      return SOLANA_NATIVE;
    case 'near':
      return NEAR_NATIVE;
    case 'bitcoin':
      return 'btc';
    default:
      return NATIVE_SENTINEL; // EVM native (EEE sentinel)
  }
}

/** The id actually rendered/cached for a side: the URL value, or the chain's native token if absent. */
export function effectiveTokenId(chain: ChainInfo, raw: string): string {
  return (raw || '').trim() || defaultTokenId(chain);
}

interface JupiterAsset {
  id?: string;
  symbol?: string;
  name?: string;
  decimals?: number;
  icon?: string;
}

interface OneClickToken {
  assetId?: string;
  blockchain?: string;
  symbol?: string;
  decimals?: number;
  contractAddress?: string;
}

async function fetchJson(url: string, timeoutMs = 3000): Promise<unknown> {
  try {
    const res = await fetch(url, {
      headers: { accept: 'application/json', 'user-agent': BROWSER_UA },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    const body = await readBoundedText(res);
    return body ? JSON.parse(body) : null;
  } catch {
    return null;
  }
}

// Jupiter datapi returns a bare array; tolerate a `{tokens}`/`{data}` envelope just in case.
function asArray<T>(json: unknown): T[] {
  if (Array.isArray(json)) return json as T[];
  const obj = json as { tokens?: T[]; data?: T[] } | null;
  return obj?.tokens ?? obj?.data ?? [];
}

async function resolveSolanaUncached(mint: string, displaySymbol?: string): Promise<ResolvedToken | null> {
  if (!SOLANA_MINT_RE.test(mint)) return null;
  const items = asArray<JupiterAsset>(await fetchJson(`${JUPITER_SEARCH}${encodeURIComponent(mint)}`));
  // Require an EXACT mint match. Jupiter's search is fuzzy, so for a syntactically-valid but non-existent
  // mint items[0] is some unrelated token — returning it would render (and cache for a day) the wrong card.
  const item = items.find(t => t.id === mint);
  if (!item || !item.symbol) return null;
  return {
    symbol: displaySymbol ?? item.symbol,
    name: item.name ?? item.symbol,
    decimals: typeof item.decimals === 'number' ? item.decimals : 9,
    logoURI: item.icon || undefined,
    address: item.id ?? mint,
  };
}

async function resolveSolanaToken(idRaw: string): Promise<ResolvedToken | null> {
  const id = idRaw.trim();
  const cacheKey = `cc:sol:${id}`;
  const cached = cache.get<ResolvedToken | null>(cacheKey);
  if (cached !== undefined) return cached;
  // Native SOL is the all-ones sentinel → resolve its logo via WSOL but label it SOL; the explicit WSOL
  // mint stays WSOL (mirrors the app's useSolanaTokens relabeling, which distinguishes the two).
  let resolved: ResolvedToken | null;
  if (id === SOLANA_NATIVE) resolved = await resolveSolanaUncached(WSOL_MINT, 'SOL');
  else if (id === WSOL_MINT) resolved = await resolveSolanaUncached(WSOL_MINT, 'WSOL');
  else resolved = await resolveSolanaUncached(id);
  cache.set(cacheKey, resolved, resolved ? CC_TOKEN_TTL_MS : CC_MISS_TTL_MS);
  return resolved;
}

// Fetch the whole 1click token list once (it's small) and cache it — there is no per-token query param.
async function loadOneClickTokens(): Promise<OneClickToken[] | null> {
  const cacheKey = 'cc:oneclick:list';
  const cached = cache.get<OneClickToken[]>(cacheKey);
  if (cached) return cached;
  const items = asArray<OneClickToken>(await fetchJson(ONECLICK_TOKENS));
  if (!items.length) return null;
  cache.set(cacheKey, items, ONECLICK_TTL_MS);
  return items;
}

// 1click has no logo field, so best-effort re-resolve the bridged asset's real logo from its origin chain.
async function nearAssetLogo(item: OneClickToken): Promise<string | undefined> {
  const addr = item.contractAddress;
  if (!addr) return undefined;
  // Wrapped NEAR carries the NEAR logo. The app maps wNEAR to a CoinGecko URL, but CoinGecko's CDN 403s
  // datacenter/server fetches, so use the trusted GCS NEAR logo instead (1click has no logo field, and
  // wrap.near has no EVM/Solana origin to re-resolve a real one from).
  if (addr === 'wrap.near') return NEAR_LOGO;
  if (item.blockchain === 'sol' && SOLANA_MINT_RE.test(addr)) {
    return (await resolveSolanaToken(addr))?.logoURI;
  }
  const evmChainId = item.blockchain ? ONECLICK_EVM_CHAIN[item.blockchain] : undefined;
  if (evmChainId && EVM_ADDRESS_RE.test(addr)) {
    return (await resolveToken(evmChainId, addr.toLowerCase(), ''))?.logoURI;
  }
  return undefined;
}

async function resolveNearUncached(id: string): Promise<ResolvedToken | null> {
  // Only the synthetic native id ('near') is the native NEAR card. wNEAR (nep141:wrap.near) is a distinct
  // token in the 1click list and resolves to its own 'wNEAR' symbol below (mirrors the app).
  if (id === NEAR_NATIVE) {
    return { symbol: 'NEAR', name: 'NEAR', decimals: 24, logoURI: NEAR_LOGO, address: NEAR_NATIVE };
  }
  const items = await loadOneClickTokens();
  const item = items?.find(t => t.assetId === id);
  if (!item || !item.symbol) return null;
  return {
    symbol: item.symbol,
    name: item.symbol,
    decimals: typeof item.decimals === 'number' ? item.decimals : 24,
    logoURI: await nearAssetLogo(item),
    address: item.assetId ?? id,
  };
}

async function resolveNearToken(idRaw: string): Promise<ResolvedToken | null> {
  const id = idRaw.trim();
  const cacheKey = `cc:near:${id}`;
  const cached = cache.get<ResolvedToken | null>(cacheKey);
  if (cached !== undefined) return cached;
  const resolved = await resolveNearUncached(id);
  cache.set(cacheKey, resolved, resolved ? CC_TOKEN_TTL_MS : CC_MISS_TTL_MS);
  return resolved;
}

// Bitcoin is single-token — a fixed constant (mirrors the app's BitcoinToken), no API call.
function resolveBitcoinToken(): ResolvedToken {
  return { symbol: 'BTC', name: 'Bitcoin', decimals: 8, logoURI: BITCOIN_LOGO, address: 'btc' };
}

/**
 * Resolve a cross-chain token segment to its symbol + logo, branching on the side's chain type. `idRaw`
 * is the URL `tokenIn`/`tokenOut` (case preserved — Solana mints / NEAR assetIds are case-sensitive); an
 * empty value falls back to the chain's native token.
 */
export async function resolveCrossChainToken(chain: ChainInfo, idRaw: string): Promise<ResolvedToken | null> {
  const id = effectiveTokenId(chain, idRaw);
  switch (chain.nonEvm) {
    case 'bitcoin':
      return resolveBitcoinToken();
    case 'solana':
      return resolveSolanaToken(id);
    case 'near':
      return resolveNearToken(id);
    default:
      return resolveToken(chain.chainId, id.toLowerCase(), chain.nativeSymbol);
  }
}
