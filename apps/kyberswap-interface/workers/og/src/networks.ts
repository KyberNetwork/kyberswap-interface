// Standalone mainnet slug -> chain map. Derived from the app's NETWORKS_INFO[chainId].route +
// nativeToken.symbol (src/constants/networks/*). Kept as a literal here on purpose: the worker is a
// separate deployable and must NOT import app code. Covers every slug used in `/swap/<slug>/...`
// (the 22 entries in MAINNET_NETWORKS). Keep in sync if a new mainnet chain ships in the app.

export interface ChainInfo {
  chainId: number
  /** Native gas-token symbol, as it appears in a `/swap/<slug>/<sym>-to-...` URL (lowercased there). */
  nativeSymbol: string
  /** Human display name used in the OG card caption ("on <name>"). */
  name: string
}

export const SLUG_TO_CHAIN: Record<string, ChainInfo> = {
  ethereum: { chainId: 1, nativeSymbol: 'ETH', name: 'Ethereum' },
  arbitrum: { chainId: 42161, nativeSymbol: 'ETH', name: 'Arbitrum' },
  optimism: { chainId: 10, nativeSymbol: 'ETH', name: 'Optimism' },
  linea: { chainId: 59144, nativeSymbol: 'ETH', name: 'Linea' },
  polygon: { chainId: 137, nativeSymbol: 'POL', name: 'Polygon' },
  zksync: { chainId: 324, nativeSymbol: 'ETH', name: 'zkSync Era' },
  base: { chainId: 8453, nativeSymbol: 'ETH', name: 'Base' },
  scroll: { chainId: 534352, nativeSymbol: 'ETH', name: 'Scroll' },
  bnb: { chainId: 56, nativeSymbol: 'BNB', name: 'BNB Chain' },
  avalanche: { chainId: 43114, nativeSymbol: 'AVAX', name: 'Avalanche' },
  fantom: { chainId: 250, nativeSymbol: 'FTM', name: 'Fantom' },
  blast: { chainId: 81457, nativeSymbol: 'ETH', name: 'Blast' },
  mantle: { chainId: 5000, nativeSymbol: 'MNT', name: 'Mantle' },
  sonic: { chainId: 146, nativeSymbol: 'S', name: 'Sonic' },
  berachain: { chainId: 80094, nativeSymbol: 'BERA', name: 'Berachain' },
  ronin: { chainId: 2020, nativeSymbol: 'RONIN', name: 'Ronin' },
  unichain: { chainId: 130, nativeSymbol: 'ETH', name: 'Unichain' },
  hyperevm: { chainId: 999, nativeSymbol: 'HYPE', name: 'HyperEVM' },
  etherlink: { chainId: 42793, nativeSymbol: 'XTZ', name: 'Etherlink' },
  plasma: { chainId: 9745, nativeSymbol: 'XPL', name: 'Plasma' },
  monad: { chainId: 143, nativeSymbol: 'MON', name: 'Monad' },
  megaeth: { chainId: 4326, nativeSymbol: 'ETH', name: 'MegaETH' },
}

export function chainFromSlug(slug: string): ChainInfo | undefined {
  return SLUG_TO_CHAIN[slug.toLowerCase()]
}

// Reverse map (chainId -> slug) for redirecting the legacy numeric-chainId pool URL to the slug form.
const CHAIN_TO_SLUG: Record<number, string> = Object.fromEntries(
  Object.entries(SLUG_TO_CHAIN).map(([slug, info]) => [info.chainId, slug]),
)

export function slugFromChainId(chainId: number): string | undefined {
  return CHAIN_TO_SLUG[chainId]
}
