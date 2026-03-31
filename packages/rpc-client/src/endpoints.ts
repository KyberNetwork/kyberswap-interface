import { ChainId } from '@kyber/schema';

/**
 * Additional chain IDs not in @kyber/schema
 */
const HYPEREVM = 999;
const PLASMA = 9745;
const RONIN = 2020;
const MONAD = 143;

export const PUBLIC_RPC_ENDPOINTS: Record<number, string[]> = {
  [ChainId.Ethereum]: [
    'https://eth.llamarpc.com',
    'https://ethereum-rpc.publicnode.com',
    'https://1rpc.io/eth',
    'https://eth-mainnet.public.blastapi.io',
    'https://eth.drpc.org',
    'https://rpc.mevblocker.io',
  ],
  [ChainId.Bsc]: [
    'https://bsc-dataseed.bnbchain.org',
    'https://bsc-dataseed1.defibit.io',
    'https://bsc-dataseed1.ninicoin.io',
    'https://bsc-dataseed2.defibit.io',
    'https://bsc-dataseed1.bnbchain.org',
    'https://bsc-dataseed2.bnbchain.org',
    'https://bsc-dataseed3.bnbchain.org',
    'https://bsc-dataseed4.bnbchain.org',
    'https://bsc-rpc.publicnode.com',
    'https://bsc.drpc.org',
    'https://1rpc.io/bnb',
    'https://bsc-dataseed3.defibit.io',
  ],
  [ChainId.PolygonPos]: [
    'https://polygon-bor-rpc.publicnode.com',
    'https://polygon.drpc.org',
    'https://polygon.gateway.tenderly.co',
    'https://polygon-public.nodies.app',
    'https://1rpc.io/matic',
  ],
  [ChainId.Arbitrum]: [
    'https://arb1.arbitrum.io/rpc',
    'https://arbitrum-one-rpc.publicnode.com',
    'https://arbitrum-one.public.blastapi.io',
    'https://arbitrum.drpc.org',
    'https://arbitrum-one-public.nodies.app',
    'https://1rpc.io/arb',
    'https://arbitrum.gateway.tenderly.co',
  ],
  [ChainId.Avalanche]: [
    'https://api.avax.network/ext/bc/C/rpc',
    'https://avalanche-c-chain-rpc.publicnode.com',
    'https://1rpc.io/avax/c',
    'https://avalanche.drpc.org',
    'https://avalanche-public.nodies.app/ext/bc/C/rpc',
  ],
  [ChainId.Base]: [
    'https://mainnet.base.org',
    'https://base-rpc.publicnode.com',
    'https://1rpc.io/base',
    'https://base-mainnet.public.blastapi.io',
    'https://base.drpc.org',
    'https://base.gateway.tenderly.co',
    'https://base-public.nodies.app',
  ],
  [ChainId.Optimism]: [
    'https://mainnet.optimism.io',
    'https://optimism-rpc.publicnode.com',
    'https://optimism.drpc.org',
    'https://optimism-public.nodies.app',
    'https://optimism.gateway.tenderly.co',
    'https://1rpc.io/op',
  ],
  [ChainId.Fantom]: [
    'https://rpcapi.fantom.network',
    'https://1rpc.io/ftm',
    'https://fantom-public.nodies.app',
    'https://rpc.fantom.network',
    'https://rpc2.fantom.network',
    'https://fantom.drpc.org',
  ],
  [ChainId.Linea]: [
    'https://rpc.linea.build',
    'https://linea-rpc.publicnode.com',
    'https://1rpc.io/linea',
    'https://linea.drpc.org',
  ],
  [ChainId.ZkSync]: [
    'https://mainnet.era.zksync.io',
    'https://1rpc.io/zksync2-era',
    'https://zksync.drpc.org',
    'https://rpc.ankr.com/zksync_era',
  ],
  [ChainId.Blast]: [
    'https://rpc.blast.io',
    'https://blast-rpc.publicnode.com',
    'https://blast.drpc.org',
    'https://blast.gateway.tenderly.co',
    'https://blast-public.nodies.app',
  ],
  [ChainId.Mantle]: [
    'https://rpc.mantle.xyz',
    'https://mantle-rpc.publicnode.com',
    'https://1rpc.io/mantle',
    'https://mantle-public.nodies.app',
  ],
  [ChainId.Scroll]: [
    'https://rpc.scroll.io',
    'https://scroll-rpc.publicnode.com',
    'https://1rpc.io/scroll',
    'https://scroll.drpc.org',
  ],
  [ChainId.Berachain]: [
    'https://rpc.berachain.com',
    'https://berachain-rpc.publicnode.com',
    'https://rpc.berachain-apis.com',
    'https://berachain.drpc.org',
  ],
  [ChainId.Sonic]: ['https://rpc.soniclabs.com', 'https://sonic-rpc.publicnode.com', 'https://sonic.drpc.org'],
  [HYPEREVM]: [
    'https://rpc.hyperliquid.xyz/evm',
    'https://rpc.hypurrscan.io',
    'https://1rpc.io/hyperliquid',
    'https://rpc.countzero.xyz/evm',
    'https://hyperliquid.drpc.org',
  ],
  [PLASMA]: ['https://rpc.plasma.to', 'https://plasma.drpc.org', 'https://plasma.gateway.tenderly.co'],
  [RONIN]: [
    'https://api.roninchain.com/rpc',
    'https://ronin.drpc.org',
    'https://ronin.gateway.tenderly.co',
    'https://ronin.lgns.net/rpc',
  ],
  [MONAD]: ['https://rpc1.monad.xyz', 'https://rpc-mainnet.monadinfra.com', 'https://rpc.monad.xyz'],
};

export const KYBER_RPC_ENDPOINTS: Record<number, string> = {
  [ChainId.Ethereum]: 'https://ethereum-rpc.kyberswap.com',
  [ChainId.Bsc]: 'https://bsc-rpc.kyberswap.com',
  [ChainId.Arbitrum]: 'https://arbitrum-rpc.kyberswap.com',
  [ChainId.Avalanche]: 'https://avalanche-rpc.kyberswap.com',
  [ChainId.Base]: 'https://base-rpc.kyberswap.com',
};

// Track warned chains to avoid spamming console
const warnedChains = new Set<number>();

/**
 * Get all public RPC endpoints for a chain.
 *
 * @param chainId - The chain ID to get endpoints for
 * @returns Array of public RPC endpoint URLs (may be empty for unsupported chains)
 */
export function getRpcEndpoints(chainId: number): string[] {
  const publicEndpoints = PUBLIC_RPC_ENDPOINTS[chainId];
  if (!publicEndpoints && !warnedChains.has(chainId)) {
    warnedChains.add(chainId);
    console.warn(
      `[@kyber/rpc-client] No public RPC endpoints configured for chain ${chainId}. ` +
        'Using Kyber RPC fallback only (if available).',
    );
  }
  return publicEndpoints ? [...publicEndpoints] : [];
}

/**
 * Get Kyber fallback RPC endpoint for a chain.
 *
 * @param chainId - The chain ID to get Kyber endpoint for
 * @returns Kyber RPC endpoint URL, or undefined if not available
 */
export function getKyberRpcEndpoint(chainId: number): string | undefined {
  return KYBER_RPC_ENDPOINTS[chainId];
}

/**
 * Check if a chain is supported (has either public endpoints or Kyber fallback).
 *
 * @param chainId - The chain ID to check
 * @returns true if the chain has at least one configured endpoint
 */
export function isChainSupported(chainId: number): boolean {
  return chainId in PUBLIC_RPC_ENDPOINTS || chainId in KYBER_RPC_ENDPOINTS;
}

/**
 * Get all supported chain IDs.
 *
 * @returns Array of chain IDs that have configured endpoints
 */
export function getSupportedChainIds(): number[] {
  const chains = new Set<number>([
    ...Object.keys(PUBLIC_RPC_ENDPOINTS).map(Number),
    ...Object.keys(KYBER_RPC_ENDPOINTS).map(Number),
  ]);
  return Array.from(chains).sort((a, b) => a - b);
}
