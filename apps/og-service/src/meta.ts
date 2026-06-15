// Per-route <head> meta builders for swap/limit pairs and pool-detail pages. Pure data — the actual
// HTML rewrite lives in headInject.ts.
import { PUBLIC_BASE } from '@/config';
import { INDEX_ROBOTS, NOINDEX_ROBOTS } from '@/constants';
import { type ChainInfo, chainFromSlug } from '@/networks';
import { resolvePool } from '@/pools';
import { resolveToken } from '@/tokens';

const POOL_ADDRESS_RE = /^0x[0-9a-f]{40}$/;
const MAX_PROTOCOL_LEN = 64;

// Trim float-representation noise from a fee-tier percentage to match the app (significantDigits: 4).
export function formatFeeTier(fee: number): string {
  return parseFloat(fee.toPrecision(4)).toString();
}

export interface HeadMeta {
  title: string;
  description: string;
  image: string;
  url: string;
  imageAlt: string;
  // Always set by the meta builders so injectHead writes them explicitly — the served HTML is often the
  // SPA home shell (no prerendered file for a pair/pool path), whose root canonical + index-robots would
  // otherwise leak onto the page. Pool = self-canonical + index; swap/limit pair = noindex + canonical to
  // the bare network landing (mirrors src/components/Seo/seoConfig.ts). Optional only so a caller *can*
  // omit them to keep the served HTML's existing tags.
  canonical?: string;
  robots?: string;
}

export interface ParsedPair {
  kind: 'swap' | 'limit';
  slug: string;
  chain: ChainInfo;
  inId: string;
  outId: string;
}

/** Match a swap/limit *pair* URL: path form `/swap/<net>/<in>-to-<out>` or legacy `?inputCurrency=`. */
export function parsePairPath(pathname: string, searchParams: URLSearchParams): ParsedPair | null {
  const segs = pathname.split('/').filter(Boolean);
  if (segs.length < 2) return null;
  const kind = segs[0];
  if (kind !== 'swap' && kind !== 'limit') return null;

  const chain = chainFromSlug(segs[1]);
  if (!chain) return null;

  let inId = '';
  let outId = '';
  const currency = segs[2];
  if (currency && currency.includes('-to-')) {
    const [from, to] = currency.split('-to-');
    inId = (from || '').toLowerCase();
    outId = (to || '').toLowerCase();
  } else {
    inId = (searchParams.get('inputCurrency') || '').toLowerCase();
    outId = (searchParams.get('outputCurrency') || '').toLowerCase();
  }

  if (!inId && !outId) return null;
  if (inId && inId === outId) outId = ''; // app clears the output when both sides match

  return { kind, slug: segs[1].toLowerCase(), chain, inId, outId };
}

/** Resolve both tokens and build the per-pair head meta. Returns null if a provided side won't resolve. */
export async function buildPairMeta(parsed: ParsedPair): Promise<HeadMeta | null> {
  const { chain, slug, kind, inId, outId } = parsed;

  const [inToken, outToken] = await Promise.all([
    inId ? resolveToken(chain.chainId, inId, chain.nativeSymbol) : Promise.resolve(null),
    outId ? resolveToken(chain.chainId, outId, chain.nativeSymbol) : Promise.resolve(null),
  ]);

  if ((inId && !inToken) || (outId && !outToken)) return null;
  if (!inToken && !outToken) return null;

  const verb = kind === 'limit' ? 'Limit order' : 'Swap';
  let title: string;
  let description: string;
  let imageAlt: string;
  if (inToken && outToken) {
    title = `${verb} ${inToken.symbol} → ${outToken.symbol} | KyberSwap`;
    description = `${verb} ${inToken.symbol} for ${outToken.symbol} on KyberSwap, the best-rate DeFi aggregator on ${chain.name} and 20+ chains.`;
    imageAlt = `${verb} ${inToken.symbol} to ${outToken.symbol} on KyberSwap`;
  } else {
    const soleSym = (inToken ?? outToken)?.symbol ?? 'Token';
    title = `${verb} ${soleSym} | KyberSwap`;
    description = `${verb} ${soleSym} on KyberSwap, the best-rate DeFi aggregator on ${chain.name} and 20+ chains.`;
    imageAlt = `${verb} ${soleSym} on KyberSwap`;
  }

  const url = `${PUBLIC_BASE}/${kind}/${slug}/${inId}-to-${outId}`;
  const imgParams = new URLSearchParams({ chain: slug, in: inId, out: outId });
  const image = `${PUBLIC_BASE}/og/${kind === 'limit' ? 'limit' : 'swap'}?${imgParams.toString()}`;
  // Pair permutations are unbounded → noindex, and canonical-consolidate to the indexable bare network
  // landing (/swap/<net> or /limit/<net>), exactly as seoConfig.ts resolves a swap/limit pair path.
  const canonical = `${PUBLIC_BASE}/${kind}/${slug}`;

  return { title, description, image, url, imageAlt, canonical, robots: NOINDEX_ROBOTS };
}

export interface ParsedPool {
  slug: string;
  chain: ChainInfo;
  protocol: string;
  address: string;
}

/** Match `/pools/<chain>/<protocol>/<address>`. Returns null for the legacy 2-seg form or a bad address. */
export function parsePoolPath(pathname: string): ParsedPool | null {
  const segs = pathname.split('/').filter(Boolean);
  if (segs.length !== 4 || segs[0] !== 'pools') return null;
  const chain = chainFromSlug(segs[1]);
  if (!chain) return null;
  const protocol = segs[2].toLowerCase();
  const address = segs[3].toLowerCase();
  if (!protocol || protocol.length > MAX_PROTOCOL_LEN || !POOL_ADDRESS_RE.test(address)) return null;
  return { slug: segs[1].toLowerCase(), chain, protocol, address };
}

/** Resolve a pool's tokens and build its head meta (self-canonical + index). Null if unresolvable. */
export async function buildPoolMeta(parsed: ParsedPool): Promise<HeadMeta | null> {
  const { chain, slug, protocol, address } = parsed;
  const pool = await resolvePool(chain.chainId, address, protocol);
  if (!pool) return null;

  const s0 = pool.token0.symbol;
  const s1 = pool.token1.symbol;
  const feeText = typeof pool.feeTier === 'number' ? ` ${formatFeeTier(pool.feeTier)}%` : '';

  const title = `${s0}/${s1}${feeText} Pool | KyberSwap`;
  const description = `Provide liquidity in the ${s0}/${s1}${feeText} pool on KyberSwap (${chain.name}) and earn fees across 20+ chains.`;
  const imageAlt = `${s0}/${s1} liquidity pool on KyberSwap`;
  const url = `${PUBLIC_BASE}/pools/${slug}/${protocol}/${address}`;
  const imgParams = new URLSearchParams({ chain: slug, address, protocol });
  const image = `${PUBLIC_BASE}/og/pool?${imgParams.toString()}`;

  return { title, description, image, url, imageAlt, canonical: url, robots: INDEX_ROBOTS };
}
