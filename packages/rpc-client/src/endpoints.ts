import { ChainId } from '@kyber/schema';

/**
 * Additional chain IDs not in @kyber/schema
 */
const POLYGON_ZKEVM = 1101;
const HYPEREVM = 999;

export const PUBLIC_RPC_ENDPOINTS: Record<number, string[]> = {
  [ChainId.Ethereum]: [
    'https://eth.llamarpc.com',
    'https://ethereum-rpc.publicnode.com',
    'https://1rpc.io/eth',
    'https://rpc.mevblocker.io',
    'https://rpc.flashbots.net',
    'https://cloudflare-eth.com',
    'https://eth-mainnet.public.blastapi.io',
    'https://api.securerpc.com/v1',
    'https://ethereum.blockpi.network/v1/rpc/public',
    'https://rpc.payload.de',
  ],
  [ChainId.Bsc]: [
    'https://binance.llamarpc.com',
    'https://bsc-dataseed.bnbchain.org',
    'https://bsc-dataseed1.defibit.io',
    'https://bsc-dataseed1.ninicoin.io',
    'https://bsc-dataseed2.defibit.io',
    'https://bsc-dataseed1.bnbchain.org',
    'https://bsc-dataseed2.bnbchain.org',
    'https://bsc-dataseed3.bnbchain.org',
    'https://bsc-dataseed4.bnbchain.org',
    'https://bsc-rpc.publicnode.com',
  ],
  [ChainId.PolygonPos]: [
    'https://polygon-rpc.com',
    'https://polygon-bor-rpc.publicnode.com',
    'https://1rpc.io/matic',
    'https://polygon-mainnet.public.blastapi.io',
    'https://rpc.ankr.com/polygon',
    'https://polygon.drpc.org',
    'https://polygon.api.onfinality.io/public',
    'https://polygon.gateway.tenderly.co',
    'https://polygon-public.nodies.app',
    'https://polygon.meowrpc.com',
  ],
  [ChainId.Arbitrum]: [
    'https://arb1.arbitrum.io/rpc',
    'https://1rpc.io/arb',
    'https://arbitrum-one-rpc.publicnode.com',
    'https://arbitrum-one.public.blastapi.io',
    'https://arbitrum.drpc.org',
    'https://rpc.arb1.arbitrum.gateway.fm',
    'https://arbitrum-one-public.nodies.app',
    'https://arbitrum.meowrpc.com',
    'https://rpc.ankr.com/arbitrum',
    'https://arbitrum.blockpi.network/v1/rpc/public',
  ],
  [ChainId.Avalanche]: [
    'https://api.avax.network/ext/bc/C/rpc',
    'https://avalanche-c-chain-rpc.publicnode.com',
    'https://1rpc.io/avax/c',
    'https://ava-mainnet.public.blastapi.io/ext/bc/C/rpc',
    'https://avalanche.drpc.org',
    'https://avalanche-public.nodies.app/ext/bc/C/rpc',
    'https://avax.meowrpc.com',
    'https://endpoints.omniatech.io/v1/avax/mainnet/public',
    'https://avalanche.api.onfinality.io/public/ext/bc/C/rpc',
    'https://rpc.ankr.com/avalanche',
  ],
  [ChainId.Base]: [
    'https://base.llamarpc.com',
    'https://mainnet.base.org',
    'https://base-rpc.publicnode.com',
    'https://1rpc.io/base',
    'https://base-mainnet.public.blastapi.io',
    'https://base.drpc.org',
    'https://base.meowrpc.com',
    'https://base.gateway.tenderly.co',
    'https://base-public.nodies.app',
    'https://base.blockpi.network/v1/rpc/public',
  ],
  [ChainId.Optimism]: [
    'https://mainnet.optimism.io',
    'https://optimism-rpc.publicnode.com',
    'https://1rpc.io/op',
    'https://optimism-mainnet.public.blastapi.io',
    'https://optimism.drpc.org',
    'https://optimism-public.nodies.app',
    'https://optimism.meowrpc.com',
    'https://rpc.optimism.gateway.fm',
    'https://optimism.gateway.tenderly.co',
    'https://optimism.blockpi.network/v1/rpc/public',
  ],
  [ChainId.Fantom]: [
    'https://rpcapi.fantom.network',
    'https://fantom-rpc.publicnode.com',
    'https://1rpc.io/ftm',
    'https://fantom-mainnet.public.blastapi.io',
    'https://fantom.drpc.org',
    'https://rpc.ftm.tools',
    'https://fantom-public.nodies.app',
    'https://rpc.fantom.network',
    'https://rpc2.fantom.network',
    'https://fantom.api.onfinality.io/public',
  ],
  [ChainId.Linea]: [
    'https://rpc.linea.build',
    'https://linea-rpc.publicnode.com',
    'https://1rpc.io/linea',
    'https://linea.drpc.org',
    'https://linea.decubate.com',
    'https://linea.blockpi.network/v1/rpc/public',
  ],
  [ChainId.ZkSync]: [
    'https://mainnet.era.zksync.io',
    'https://1rpc.io/zksync2-era',
    'https://zksync.drpc.org',
    'https://zksync.meowrpc.com',
    'https://rpc.ankr.com/zksync_era',
    'https://zksync.api.onfinality.io/public',
    'https://endpoints.omniatech.io/v1/zksync-era/mainnet/public',
  ],
  [POLYGON_ZKEVM]: [
    'https://zkevm-rpc.com',
    'https://rpc.polygon-zkevm.gateway.fm',
    'https://1rpc.io/polygon/zkevm',
    'https://polygon-zkevm-mainnet.public.blastapi.io',
    'https://polygon-zkevm.drpc.org',
    'https://polygon-zkevm-public.nodies.app',
    'https://endpoints.omniatech.io/v1/polygon-zkevm/mainnet/public',
  ],
  [ChainId.Blast]: [
    'https://rpc.blast.io',
    'https://blast-rpc.publicnode.com',
    'https://blastl2-mainnet.public.blastapi.io',
    'https://blast.drpc.org',
    'https://rpc.ankr.com/blast',
    'https://blast.gateway.tenderly.co',
    'https://blast-public.nodies.app',
    'https://endpoints.omniatech.io/v1/blast/mainnet/public',
  ],
  [ChainId.Mantle]: [
    'https://rpc.mantle.xyz',
    'https://mantle-rpc.publicnode.com',
    'https://1rpc.io/mantle',
    'https://mantle-mainnet.public.blastapi.io',
    'https://mantle.drpc.org',
    'https://mantle-public.nodies.app',
    'https://mantle.api.onfinality.io/public',
    'https://endpoints.omniatech.io/v1/mantle/mainnet/public',
  ],
  [ChainId.Scroll]: [
    'https://rpc.scroll.io',
    'https://scroll-rpc.publicnode.com',
    'https://1rpc.io/scroll',
    'https://scroll-mainnet.public.blastapi.io',
    'https://scroll.drpc.org',
    'https://rpc.ankr.com/scroll',
    'https://scroll-public.nodies.app',
    'https://scroll.api.onfinality.io/public',
    'https://scroll-mainnet.chainstacklabs.com',
    'https://endpoints.omniatech.io/v1/scroll/mainnet/public',
  ],
  [ChainId.Berachain]: [
    'https://rpc.berachain.com',
    'https://berachain-rpc.publicnode.com',
    'https://berachain.drpc.org',
    'https://rpc.berachain-apis.com',
    'https://berachain.therpc.io',
  ],
  [ChainId.Sonic]: [
    'https://rpc.soniclabs.com',
    'https://sonic-rpc.publicnode.com',
    'https://sonic.drpc.org',
    'https://rpc.ankr.com/sonic_mainnet',
    'https://sonic.api.onfinality.io/public',
  ],
  [HYPEREVM]: ['https://rpc.hyperliquid.xyz/evm'],
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
