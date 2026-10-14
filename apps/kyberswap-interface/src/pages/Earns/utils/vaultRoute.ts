import { SwapRouteDetail } from 'services/zap'

import { VaultRouteLeg } from 'pages/Earns/VaultDetail/ZapRouteStrip'
import { safeBigInt } from 'pages/Earns/utils/vault'
import { formatDisplayNumber } from 'utils/numbers'
import { formatUnits } from 'utils/viem'

/** What a token address has to resolve to before its leg can be written out. */
export type RouteTokenInfo = { symbol: string; decimals: number; logo?: string }

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
 * What the route spends, one leg per token it takes in. A deposit funded from several tokens is
 * several legs, each priced by the route itself rather than one combined figure.
 *
 * A vault deposit spends the vault's asset, part of which an earlier swap in the same route may have
 * produced; only the rest of it came from the wallet, so only that remainder is a leg of its own.
 *
 * A token the caller cannot name is skipped: a leg with no symbol says less than no leg at all.
 */
export const toRouteInputs = (
  route: SwapRouteDetail | undefined,
  tokens: Map<string, RouteTokenInfo>,
): VaultRouteLeg[] => {
  const actions = route?.zapDetails.actions || []
  const swaps = actions.flatMap(action => action.aggregatorSwap?.swaps || [])

  const swappedInto = new Map<string, bigint>()
  swaps.forEach(({ tokenOut }) => {
    const key = tokenOut.address.toLowerCase()
    swappedInto.set(key, (swappedInto.get(key) ?? 0n) + safeBigInt(tokenOut.amount))
  })

  const depositedDirectly = actions.flatMap(action => {
    if (!action.vaultDeposit) return []
    const { address, amount } = action.vaultDeposit.tokenIn
    const remainder = safeBigInt(amount) - (swappedInto.get(address.toLowerCase()) ?? 0n)
    return remainder > 0n ? [{ address, amount: remainder.toString() }] : []
  })

  return [...swaps.map(swap => swap.tokenIn), ...depositedDirectly]
    .map(token => toLeg(token, tokens))
    .filter((leg): leg is VaultRouteLeg => !!leg)
}

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
