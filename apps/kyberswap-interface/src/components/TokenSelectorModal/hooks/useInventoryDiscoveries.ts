import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'

import { ETHER_ADDRESS } from 'constants/index'
import { TokenMap } from 'hooks/useTokens'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { WalletInventory } from 'state/walletInventory/hooks'

export type InventoryDiscoveries = {
  /** Held tokens that are neither whitelisted nor already imported, alphabetical by symbol. */
  tokens: WrappedTokenInfo[]
  /**
   * Addresses whose symbol also belongs to a whitelisted token at a different address — the shape an
   * airdropped impersonation takes. Covers both discovery rows and the user's imported tokens, so a
   * fake the user was already tricked into importing is flagged wherever it renders, not just here.
   */
  impersonators: Set<string>
}

const EMPTY: InventoryDiscoveries = { tokens: [], impersonators: new Set() }

/**
 * Pure computation behind `useInventoryDiscoveries`, separated so the whitelist/import/impersonator
 * set arithmetic is directly testable.
 *
 * Only inventory rows the service could describe are surfaced. A row without `decimals` cannot be
 * rendered as an amount at all — assuming 18 would misreport a 6-decimal holding by a factor of a
 * trillion — and these are overwhelmingly dust airdrops, so they are left out rather than shown as
 * bare addresses.
 */
export const computeInventoryDiscoveries = (
  inventory: WalletInventory,
  defaultTokens: TokenMap,
  tokenImports: Token[],
  chainId: ChainId,
): InventoryDiscoveries => {
  if (!inventory.active) return EMPTY

  // `defaultTokens` merges the user's imports into the whitelist, so symbol ownership must be taken
  // from the genuinely whitelisted entries only — otherwise an imported fake would count as the
  // "verified" owner of the symbol it stole. A symbol can legitimately belong to several whitelisted
  // addresses (bridged variants), hence a set per symbol rather than one address.
  const known = new Set<string>(Object.keys(defaultTokens))
  const whitelistedSymbols = new Map<string, Set<string>>()
  Object.values(defaultTokens).forEach(token => {
    if (!token.isWhitelisted || !token.symbol) return
    const symbol = token.symbol.toLowerCase()
    let owners = whitelistedSymbols.get(symbol)
    if (!owners) whitelistedSymbols.set(symbol, (owners = new Set()))
    owners.add(token.address)
  })

  const impersonates = (symbol: string | undefined, address: string): boolean => {
    if (!symbol) return false
    const owners = whitelistedSymbols.get(symbol.toLowerCase())
    return !!owners && !owners.has(address)
  }

  const tokens: WrappedTokenInfo[] = []
  const impersonators = new Set<string>()

  tokenImports.forEach(token => {
    known.add(token.address)
    if (impersonates(token.symbol, token.address)) impersonators.add(token.address)
  })

  Object.values(inventory.rows).forEach(row => {
    if (row.address === ETHER_ADDRESS || known.has(row.address) || row.decimals === undefined) return
    try {
      tokens.push(
        new WrappedTokenInfo({
          chainId,
          address: row.address,
          decimals: row.decimals,
          symbol: row.symbol || '',
          name: row.symbol || '',
        }),
      )
    } catch {
      return
    }
    if (impersonates(row.symbol, row.address)) impersonators.add(row.address)
  })

  // Alphabetical rather than by balance: airdropped impersonations are minted with enormous supplies,
  // so ranking on amount would hand the top of the group to whoever inflates hardest.
  tokens.sort((a, b) => (a.symbol || '').localeCompare(b.symbol || ''))

  return { tokens, impersonators }
}

/**
 * The tokens a wallet holds that the app would otherwise never show: everything in the inventory
 * minus the chain's whitelist and the user's own imports — plus the impersonator flags for every
 * non-whitelisted token being rendered.
 */
export const useInventoryDiscoveries = (
  inventory: WalletInventory,
  defaultTokens: TokenMap,
  tokenImports: Token[],
  chainId: ChainId,
): InventoryDiscoveries =>
  useMemo(
    () => computeInventoryDiscoveries(inventory, defaultTokens, tokenImports, chainId),
    [inventory, defaultTokens, tokenImports, chainId],
  )
