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
    'https://eth.drpc.org',
    'https://eth.blockrazor.xyz',
    'https://api.zan.top/eth-mainnet',
    'https://ethereum-rpc.publicnode.com',
    'https://eth-mainnet.public.blastapi.io',
    'https://ethereum.therpc.io',
    'https://mainnet.rpc.sentio.xyz',
    'https://0xrpc.io/eth',
  ],
  [ChainId.Bsc]: [
    'https://bsc-dataseed2.defibit.io',
    'https://bsc-dataseed1.ninicoin.io',
    'https://bsc-dataseed3.defibit.io',
    'https://bsc-dataseed1.defibit.io',
    'https://bsc-dataseed.bnbchain.org',
    'https://bsc-dataseed3.bnbchain.org',
    'https://bsc-dataseed1.bnbchain.org',
    'https://bsc-dataseed4.bnbchain.org',
  ],
  [ChainId.PolygonPos]: [
    'https://polygon.drpc.org',
    'https://api.zan.top/polygon-mainnet',
    'https://polygon-bor-rpc.publicnode.com',
    'https://polygon-public.nodies.app',
    'https://matic.rpc.sentio.xyz',
    'https://rpc.sentio.xyz/matic',
    'https://polygon.gateway.tenderly.co',
    'https://poly.api.pocket.network',
  ],
  [ChainId.Arbitrum]: [
    'https://arbitrum.drpc.org',
    'https://api.zan.top/arb-one',
    'https://arbitrum-one-rpc.publicnode.com',
    'https://arbitrum-one-public.nodies.app',
    'https://arbitrum-one.public.blastapi.io',
    'https://arb1.arbitrum.io/rpc',
    'https://arbitrum.gateway.tenderly.co',
  ],
  [ChainId.Avalanche]: [
    'https://avalanche.drpc.org',
    'https://avalanche-c-chain-rpc.publicnode.com',
    'https://api.zan.top/avax-mainnet/ext/bc/C/rpc',
    'https://avalanche-public.nodies.app/ext/bc/C/rpc',
    'https://avalanche.rpc.sentio.xyz',
    'https://avalanche.api.onfinality.io/public/ext/bc/C/rpc',
    'https://api.avax.network/ext/bc/C/rpc',
    'https://avax.api.pocket.network',
  ],
  [ChainId.Base]: [
    'https://api.zan.top/base-mainnet',
    'https://base.rpc.sentio.xyz',
    'https://base-rpc.publicnode.com',
    'https://base-mainnet.public.blastapi.io',
    'https://base.gateway.tenderly.co',
    'https://mainnet.base.org',
    'https://base-public.nodies.app',
  ],
  [ChainId.Optimism]: [
    'https://optimism.drpc.org',
    'https://api.zan.top/opt-mainnet',
    'https://optimism.rpc.sentio.xyz',
    'https://optimism-rpc.publicnode.com',
    'https://optimism.gateway.tenderly.co',
    'https://optimism-public.nodies.app',
    'https://optimism.public.blockpi.network/v1/rpc/public',
    'https://mainnet.optimism.io',
  ],
  [ChainId.Fantom]: [
    'https://api.zan.top/ftm-mainnet',
    'https://fantom.api.onfinality.io/public',
    'https://fantom-public.nodies.app',
    'https://rpc.fantom.network',
    'https://rpc2.fantom.network',
    'https://rpcapi.fantom.network',
    'https://rpc3.fantom.network',
    'https://fantom.api.pocket.network',
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
    'https://mainnet.era.zksync.io',
    'https://zksync.drpc.org',
    'https://api.zan.top/zksync-mainnet',
    'https://zksync.api.onfinality.io/public',
    'https://zksync-era.rpc.sentio.xyz',
    'https://zksync-era.api.pocket.network',
  ],
  [ChainId.Blast]: [
    'https://rpc.blast.io',
    'https://blast.drpc.org',
    'https://blast-mainnet.rpc.sentio.xyz',
    'https://blast-rpc.publicnode.com',
    'https://blast-public.nodies.app',
    'https://blast.api.pocket.network',
  ],
  [ChainId.Mantle]: [
    'https://rpc.mantle.xyz',
    'https://mantle.drpc.org',
    'https://api.zan.top/mantle-mainnet',
    'https://mantle-rpc.publicnode.com',
    'https://mantle-public.nodies.app',
    'https://mantle.api.pocket.network',
    'https://mantle.api.onfinality.io/public',
  ],
  [ChainId.Scroll]: [
    'https://rpc.scroll.io',
    'https://scroll.drpc.org',
    'https://scroll-rpc.publicnode.com',
    'https://scroll-public.nodies.app',
    'https://scroll.api.onfinality.io/public',
    'https://scroll.api.pocket.network',
  ],
  [ChainId.Berachain]: [
    'https://berachain.drpc.org',
    'https://rpc.berachain-apis.com',
    'https://berachain-rpc.publicnode.com',
    'https://berachain.rpc.sentio.xyz',
    'https://rpc.berachain.com',
  ],
  [ChainId.Sonic]: [
    'https://sonic.drpc.org',
    'https://sonic-mainnet.rpc.sentio.xyz',
    'https://sonic-rpc.publicnode.com',
    'https://sonic-json-rpc.stakely.io',
    'https://rpc.soniclabs.com',
    'https://sonic.api.pocket.network',
  ],
  [HYPEREVM]: [
    'https://rpc.hyperliquid.xyz/evm',
    'https://rpc.hypurrscan.io',
    'https://hyperliquid.api.onfinality.io/evm/public',
    'https://hyperliquid.drpc.org',
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
    'https://rpc2.monad.xyz',
    'https://monad.gateway.tenderly.co',
    'https://monad.rpc.blxrbdn.com',
    'https://gm.monad.at.htw.tech',
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
