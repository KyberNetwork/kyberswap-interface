import { ChainId } from '@kyber/schema';

/**
 * Additional chain IDs not in @kyber/schema
 */
const HYPEREVM = 999;
const PLASMA = 9745;
const RONIN = 2020;
const MONAD = 143;
const ETHERLINK = 42793;
const MEGAETH = 4326;

export const PUBLIC_RPC_ENDPOINTS: Record<number, string[]> = {
  [ChainId.Ethereum]: [
    'https://api.zan.top/eth-mainnet',
    'https://eth.drpc.org',
    'https://eth.blockrazor.xyz',
    'https://ethereum-rpc.publicnode.com',
    'https://mainnet.rpc.sentio.xyz',
    'https://eth-mainnet.public.blastapi.io',
    'https://ethereum.therpc.io',
  ],
  [ChainId.Bsc]: [
    'https://bsc-rpc.publicnode.com',
    'https://bsc-dataseed1.defibit.io',
    'https://bsc-dataseed3.defibit.io',
    'https://bsc-dataseed2.defibit.io',
    'https://bsc-dataseed1.ninicoin.io',
    'https://bsc-dataseed.bnbchain.org',
    'https://bsc-dataseed3.bnbchain.org',
    'https://bsc-dataseed2.bnbchain.org',
  ],
  [ChainId.PolygonPos]: [
    'https://polygon.drpc.org',
    'https://api.zan.top/polygon-mainnet',
    'https://polygon-bor-rpc.publicnode.com',
    'https://polygon-public.nodies.app',
    'https://polygon.gateway.tenderly.co',
    'https://rpc.private.mev-x.com/polygon',
    'https://poly.api.pocket.network',
  ],
  [ChainId.Arbitrum]: [
    'https://arbitrum-one-rpc.publicnode.com',
    'https://arbitrum-one-public.nodies.app',
    'https://arbitrum-one.public.blastapi.io',
    'https://arbitrum.public.blockpi.network/v1/rpc/public',
    'https://arbitrum.drpc.org',
    'https://api.zan.top/arb-one',
    'https://arb1.arbitrum.io/rpc',
    'https://arbitrum.gateway.tenderly.co',
  ],
  [ChainId.Avalanche]: [
    'https://avalanche-c-chain-rpc.publicnode.com',
    'https://avalanche.drpc.org',
    'https://api.zan.top/avax-mainnet/ext/bc/C/rpc',
    'https://avalanche.rpc.sentio.xyz',
    'https://api.avax.network/ext/bc/C/rpc',
    'https://avalanche.api.onfinality.io/public/ext/bc/C/rpc',
    'https://avax.api.pocket.network',
  ],
  [ChainId.Base]: [
    'https://api.zan.top/base-mainnet',
    'https://base-rpc.publicnode.com',
    'https://base.rpc.sentio.xyz',
    'https://base-mainnet.public.blastapi.io',
    'https://mainnet.base.org',
    'https://base.gateway.tenderly.co',
    'https://base-public.nodies.app',
  ],
  [ChainId.Optimism]: [
    'https://optimism.rpc.sentio.xyz',
    'https://optimism-rpc.publicnode.com',
    'https://optimism.drpc.org',
    'https://optimism-public.nodies.app',
    'https://api.zan.top/opt-mainnet',
    'https://mainnet.optimism.io',
    'https://optimism.gateway.tenderly.co',
    'https://public-op-mainnet.fastnode.io',
  ],
  [ChainId.Fantom]: [
    'https://fantom.api.onfinality.io/public',
    'https://fantom-public.nodies.app',
    'https://fantom.drpc.org',
    'https://fantom.api.pocket.network',
    'https://rpc2.fantom.network',
    'https://rpc.fantom.network',
    'https://rpc3.fantom.network',
    'https://rpcapi.fantom.network',
  ],
  [ChainId.Linea]: [
    'https://linea.drpc.org',
    'https://linea-rpc.publicnode.com',
    'https://rpc.linea.build',
    'https://linea.rpc.sentio.xyz',
    'https://linea.api.pocket.network',
  ],
  [ChainId.ZkSync]: [
    'https://rpc.ankr.com/zksync_era',
    'https://zksync.drpc.org',
    'https://mainnet.era.zksync.io',
    'https://api.zan.top/zksync-mainnet',
    'https://zksync-era.rpc.sentio.xyz',
    'https://zksync.api.onfinality.io/public',
    'https://zksync-era.api.pocket.network',
  ],
  [ChainId.Blast]: [
    'https://rpc.blast.io',
    'https://blast.drpc.org',
    'https://blast-rpc.publicnode.com',
    'https://blast-mainnet.rpc.sentio.xyz',
    'https://blast-public.nodies.app',
    'https://blast.api.pocket.network',
  ],
  [ChainId.Mantle]: [
    'https://mantle.drpc.org',
    'https://mantle-public.nodies.app',
    'https://mantle.api.onfinality.io/public',
    'https://mantle-rpc.publicnode.com',
    'https://rpc.mantle.xyz',
    'https://api.zan.top/mantle-mainnet',
    'https://mantle.api.pocket.network',
  ],
  [ChainId.Scroll]: [
    'https://rpc.scroll.io',
    'https://scroll.drpc.org',
    'https://scroll-public.nodies.app',
    'https://scroll-rpc.publicnode.com',
    'https://scroll.api.onfinality.io/public',
    'https://scroll.api.pocket.network',
  ],
  [ChainId.Berachain]: [
    'https://berachain.drpc.org',
    'https://rpc.berachain-apis.com',
    'https://berachain.rpc.sentio.xyz',
    'https://berachain-rpc.publicnode.com',
    'https://rpc.berachain.com',
  ],
  [ChainId.Sonic]: [
    'https://sonic.drpc.org',
    'https://sonic-mainnet.rpc.sentio.xyz',
    'https://sonic-rpc.publicnode.com',
    'https://sonic.api.pocket.network',
    'https://sonic-json-rpc.stakely.io',
    'https://rpc.soniclabs.com',
  ],
  [HYPEREVM]: [
    'https://hyperliquid.drpc.org',
    'https://hyperliquid.api.onfinality.io/evm/public',
    'https://hyperevm.rpc.sentio.xyz',
    'https://hyperliquid-json-rpc.stakely.io',
  ],
  [PLASMA]: [
    'https://plasma.drpc.org',
    'https://plasma.api.onfinality.io/public',
    'https://plasma.gateway.tenderly.co',
    'https://rpc.plasma.to',
  ],
  [RONIN]: ['https://ronin.drpc.org', 'https://ronin.gateway.tenderly.co', 'https://api.roninchain.com/rpc'],
  [MONAD]: [
    'https://rpc.monad.xyz',
    'https://rpc3.monad.xyz',
    'https://rpc-mainnet.monadinfra.com',
    'https://rpc1.monad.xyz',
    'https://monad.gateway.tenderly.co',
    'https://rpc2.monad.xyz',
    'https://monad.rpc.blxrbdn.com',
  ],
  [ETHERLINK]: [
    'https://node.mainnet.etherlink.com',
    'https://rpc.ankr.com/etherlink_mainnet',
    'https://42793.rpc.thirdweb.com',
  ],
  [MEGAETH]: [
    'https://megaeth.drpc.org',
    'https://mainnet.megaeth.com/rpc',
    'https://megaeth.gateway.tenderly.co',
    'https://4326.rpc.thirdweb.com',
  ],
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
