// Standalone mainnet slug -> chain map. Derived from the app's NETWORKS_INFO[chainId].route +
// nativeToken.symbol. Kept literal here on purpose (this service does NOT import app code). Keep in
// sync if a new mainnet chain ships in the app.

/** The three non-EVM chains selectable in the cross-chain swap (mirrors the app's `NonEvmChain` enum). */
export type NonEvmKind = 'near' | 'solana' | 'bitcoin';

export interface ChainInfo {
  chainId: number;
  /** Native gas-token symbol, as it appears in a `/swap/<slug>/<sym>-to-...` URL (lowercased there). */
  nativeSymbol: string;
  /** Human display name used in the OG card caption ("on <name>"). */
  name: string;
  /** Set only for the three non-EVM cross-chain chains; absent ⇒ EVM (tokens resolve via ks-setting by chainId). */
  nonEvm?: NonEvmKind;
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
};

// The non-EVM cross-chain chains. Identified in the `/cross-chain?from=&to=` URL by a literal slug
// (not a numeric chainId), so they live outside SLUG_TO_CHAIN. The synthetic negative chainIds are
// never used for token resolution (that branches on `nonEvm`) — they only keep ChainInfo uniform.
// name/nativeSymbol mirror the app's NonEvmChainInfo / BitcoinToken (adapters/types.ts).
const NON_EVM_CHAINS: Record<NonEvmKind, ChainInfo> = {
  solana: { chainId: -1, nativeSymbol: 'SOL', name: 'Solana', nonEvm: 'solana' },
  near: { chainId: -2, nativeSymbol: 'NEAR', name: 'NEAR', nonEvm: 'near' },
  bitcoin: { chainId: -3, nativeSymbol: 'BTC', name: 'Bitcoin', nonEvm: 'bitcoin' },
};

export function chainFromSlug(slug: string): ChainInfo | undefined {
  return SLUG_TO_CHAIN[slug.toLowerCase()];
}

// Reverse map (chainId -> slug) for redirecting the legacy numeric-chainId pool URL to the slug form.
const CHAIN_TO_SLUG: Record<number, string> = Object.fromEntries(
  Object.entries(SLUG_TO_CHAIN).map(([slug, info]) => [info.chainId, slug]),
);

export function slugFromChainId(chainId: number): string | undefined {
  return CHAIN_TO_SLUG[chainId];
}

// Reverse map (chainId -> ChainInfo) so a numeric cross-chain `from`/`to` resolves to its chain.
const CHAIN_BY_ID: Record<number, ChainInfo> = Object.fromEntries(
  Object.values(SLUG_TO_CHAIN).map(info => [info.chainId, info]),
);

export function chainById(chainId: number): ChainInfo | undefined {
  return CHAIN_BY_ID[chainId];
}

// Resolve a cross-chain `from`/`to` value: a numeric EVM chainId string ("1", "8453"), or one of the
// non-EVM slugs ("near"/"solana"/"bitcoin"). Returns undefined for anything else.
export function chainFromAny(raw: string): ChainInfo | undefined {
  const v = (raw || '').trim().toLowerCase();
  if (!v) return undefined;
  if (/^\d+$/.test(v)) return chainById(Number(v));
  return NON_EVM_CHAINS[v as NonEvmKind];
}
