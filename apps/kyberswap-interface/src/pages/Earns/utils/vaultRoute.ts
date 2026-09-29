import { SwapRouteDetail } from 'services/zap'

import { VaultRouteLeg } from 'pages/Earns/VaultDetail/ZapRouteStrip'
import { formatDisplayNumber } from 'utils/numbers'
import { formatUnits } from 'utils/viem'

/** What a token address has to resolve to before its leg can be written out. */
export type RouteTokenInfo = { symbol: string; decimals: number; logo?: string }

/** One leg the aggregator quotes: what it spends and what that leg alone returns. */
export type VaultRouteSwap = { from: VaultRouteLeg; to: VaultRouteLeg }

const AGGREGATOR_SWAP = 'ACTION_TYPE_AGGREGATOR_SWAP'

const toLeg = (
  { address, amount }: { address: string; amount: string },
  lookup: Map<string, RouteTokenInfo>,
): VaultRouteLeg | undefined => {
  const token = lookup.get(address.toLowerCase())
  if (!token) return undefined
  return {
    amount: formatDisplayNumber(formatUnits(BigInt(amount), token.decimals), { significantDigits: 6 }),
    symbol: token.symbol,
    logo: token.logo,
  }
}

/**
 * The swaps the route actually performs, one per leg the aggregator quotes. A deposit funded from
 * several tokens is several swaps, each with its own rate, rather than one combined figure — which
 * is what the route returns and so what the strip shows.
 *
 * A token the caller cannot name is skipped: a leg with no symbol says less than no leg at all.
 */
export const toRouteSwaps = (
  route: SwapRouteDetail | undefined,
  tokens: Map<string, RouteTokenInfo>,
): VaultRouteSwap[] =>
  (route?.zapDetails.actions || [])
    .filter(action => action.type === AGGREGATOR_SWAP)
    .flatMap(action => action.aggregatorSwap?.swaps || [])
    .map(swap => {
      const from = toLeg(swap.tokenIn, tokens)
      const to = toLeg(swap.tokenOut, tokens)
      return from && to ? { from, to } : undefined
    })
    .filter((swap): swap is VaultRouteSwap => !!swap)

/** Keyed on the lowercased address, since the route spells one token both ways across its actions. */
export const toRouteTokenMap = (
  entries: ({ address?: string; symbol?: string; decimals?: number; logo?: string } | undefined)[],
): Map<string, RouteTokenInfo> => {
  const map = new Map<string, RouteTokenInfo>()
  entries.forEach(entry => {
    if (!entry?.address || !entry.symbol || entry.decimals === undefined) return
    map.set(entry.address.toLowerCase(), { symbol: entry.symbol, decimals: entry.decimals, logo: entry.logo })
  })
  return map
}
