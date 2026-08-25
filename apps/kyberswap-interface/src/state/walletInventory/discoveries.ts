import { ChainId, Token } from '@kyberswap/ks-sdk-core'

import { ETHER_ADDRESS } from 'constants/index'
import { TokenMap } from 'hooks/useTokens'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { WalletInventory } from 'state/walletInventory/resolve'

export type InventoryDiscoveries = {
  /** Held tokens that are neither whitelisted nor imported, alphabetical by symbol. */
  tokens: WrappedTokenInfo[]
  /**
   * Addresses whose symbol also belongs to a whitelisted token at a different address — the shape an
   * airdropped impersonation takes. Covers both discovery rows and the user's imported tokens, so a
   * fake the user was already tricked into importing is flagged wherever it renders.
   */
  impersonators: Set<string>
}

export const EMPTY_DISCOVERIES: InventoryDiscoveries = { tokens: [], impersonators: new Set() }

// One `WrappedTokenInfo` per (chain, address) for the session. Constructing one runs the SDK's address
// validation, and a spam-heavy wallet has hundreds of discovery rows that would otherwise be rebuilt on
// every inventory or native-balance change; a stable instance also lets every downstream memo and row
// key treat "same token" as "same object". Metadata the indexer later corrects replaces the instance
// rather than adding a second one.
const discoveryTokens = new Map<string, WrappedTokenInfo>()

const discoveryToken = (chainId: ChainId, address: string, decimals: number, symbol: string) => {
  const key = `${chainId}:${address}`
  const cached = discoveryTokens.get(key)
  if (cached && cached.decimals === decimals && cached.symbol === symbol) return cached
  const token = new WrappedTokenInfo({ chainId, address, decimals, symbol, name: symbol })
  discoveryTokens.set(key, token)
  return token
}

type WhitelistIndex = {
  /** Every address in the map — whitelist and imports alike. */
  known: Set<string>
  /** Lowercased symbol → whitelisted addresses that legitimately carry it. */
  whitelistedSymbols: Map<string, Set<string>>
}

// The token map only changes when a list loads or the user imports; the inventory changes far more
// often (every native-balance move rebuilds it). Indexing the map once per identity keeps each
// recompute proportional to the wallet's holdings rather than to the whole whitelist.
const whitelistIndexes = new WeakMap<TokenMap, WhitelistIndex>()

const indexWhitelist = (defaultTokens: TokenMap): WhitelistIndex => {
  const cached = whitelistIndexes.get(defaultTokens)
  if (cached) return cached
  const known = new Set<string>()
  const whitelistedSymbols = new Map<string, Set<string>>()
  Object.values(defaultTokens).forEach(token => {
    known.add(token.address)
    if (!token.isWhitelisted || !token.symbol) return
    const symbol = token.symbol.toLowerCase()
    let owners = whitelistedSymbols.get(symbol)
    if (!owners) whitelistedSymbols.set(symbol, (owners = new Set()))
    owners.add(token.address)
  })
  const index = { known, whitelistedSymbols }
  whitelistIndexes.set(defaultTokens, index)
  return index
}

/**
 * The tokens a wallet holds that the app would otherwise never show: everything in the inventory
 * minus the chain's whitelist and the user's own imports — plus the impersonator flags for every
 * non-whitelisted token being rendered. React-free so the set arithmetic is directly testable.
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
  if (!inventory.active) return EMPTY_DISCOVERIES

  // `defaultTokens` merges the user's imports into the whitelist, so symbol ownership is taken from
  // the genuinely whitelisted entries only — otherwise an imported fake would count as the "verified"
  // owner of the symbol it stole. A symbol can legitimately belong to several whitelisted addresses
  // (bridged variants), hence a set per symbol rather than one address.
  const { known: knownInMap, whitelistedSymbols } = indexWhitelist(defaultTokens)
  const known = new Set(knownInMap)

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
      tokens.push(discoveryToken(chainId, row.address, row.decimals, row.symbol || ''))
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
