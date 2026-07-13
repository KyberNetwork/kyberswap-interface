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
const UNICHAIN = 130;
const ROBINHOOD = 4663;

export const PUBLIC_RPC_ENDPOINTS: Record<number, string[]> = {
  [ChainId.Ethereum]: [
    'https://eth.blockrazor.xyz',
    'https://eth.drpc.org',
    'https://api.zan.top/eth-mainnet',
    'https://ethereum-rpc.publicnode.com',
    'https://mainnet.rpc.sentio.xyz',
    'https://ethereum-public.nodies.app',
    'https://mainnet.gateway.tenderly.co',
    'https://eth-mainnet.public.blastapi.io',
    'https://ethereum.public.blockpi.network/v1/rpc/public',
    'https://0xrpc.io/eth',
  ],
  [ChainId.Bsc]: [
    'https://bsc-dataseed.bnbchain.org',
    'https://bsc-dataseed2.bnbchain.org',
    'https://bsc-dataseed3.bnbchain.org',
    'https://bsc-dataseed4.bnbchain.org',
    'https://bsc-dataseed1.ninicoin.io',
    'https://bsc-dataseed4.ninicoin.io',
    'https://bsc-dataseed3.defibit.io',
    'https://bsc-dataseed2.defibit.io',
    'https://bsc-dataseed1.defibit.io',
    'https://bsc-rpc.publicnode.com',
  ],
  [ChainId.PolygonPos]: [
    'https://polygon.drpc.org',
    'https://polygon-bor-rpc.publicnode.com',
    'https://api.zan.top/polygon-mainnet',
    'https://polygon-public.nodies.app',
    'https://rpc.satelink.network/rpc/polygon',
    'https://polygon.gateway.tenderly.co',
    'https://polygon.api.onfinality.io/public',
    'https://poly.api.pocket.network',
    'https://rpc.private.mev-x.com/polygon',
  ],
  [ChainId.Arbitrum]: [
    'https://arbitrum-one-rpc.publicnode.com',
    'https://api.zan.top/arb-one',
    'https://arbitrum.drpc.org',
    'https://arbitrum-one-public.nodies.app',
    'https://arbitrum.gateway.tenderly.co',
    'https://arbitrum-one.public.blastapi.io',
    'https://arb1.arbitrum.io/rpc',
    'https://arb-one.api.pocket.network',
    'https://public-arb-mainnet.fastnode.io',
  ],
  [ChainId.Avalanche]: [
    'https://avalanche-c-chain-rpc.publicnode.com',
    'https://avalanche.drpc.org',
    'https://api.zan.top/avax-mainnet/ext/bc/C/rpc',
    'https://avalanche.rpc.sentio.xyz',
    'https://avalanche.api.onfinality.io/public/ext/bc/C/rpc',
    'https://api.avax.network/ext/bc/C/rpc',
    'https://avax.api.pocket.network',
  ],
  [ChainId.Base]: [
    'https://base-rpc.publicnode.com',
    'https://api.zan.top/base-mainnet',
    'https://base.gateway.tenderly.co',
    'https://base-mainnet.public.blastapi.io',
    'https://mainnet.base.org',
    'https://base.public.blockpi.network/v1/rpc/public',
    'https://base.rpc.sentio.xyz',
    'https://base-public.nodies.app',
    'https://rpc.baseazul.dev',
  ],
  [ChainId.Optimism]: [
    'https://optimism-rpc.publicnode.com',
    'https://api.zan.top/opt-mainnet',
    'https://optimism.rpc.sentio.xyz',
    'https://optimism-public.nodies.app',
    'https://optimism.gateway.tenderly.co',
    'https://optimism.api.onfinality.io/public',
    'https://mainnet.optimism.io',
    'https://optimism.public.blockpi.network/v1/rpc/public',
    'https://public-op-mainnet.fastnode.io',
  ],
  [ChainId.Fantom]: [
    'https://fantom.api.onfinality.io/public',
    'https://fantom.api.pocket.network',
    'https://rpc2.fantom.network',
    'https://rpc.fantom.network',
    'https://rpcapi.fantom.network',
    'https://rpc3.fantom.network',
  ],
  [ChainId.Linea]: [
    'https://linea-rpc.publicnode.com',
    'https://linea.drpc.org',
    'https://rpc.linea.build',
    'https://linea.rpc.sentio.xyz',
    'https://linea.api.pocket.network',
  ],
  [ChainId.ZkSync]: [
    'https://rpc.ankr.com/zksync_era',
    'https://api.zan.top/zksync-mainnet',
    'https://zksync.drpc.org',
    'https://zksync-era.rpc.sentio.xyz',
    'https://mainnet.era.zksync.io',
    'https://zksync.api.onfinality.io/public',
    'https://zksync-era.api.pocket.network',
  ],
  [ChainId.Blast]: [
    'https://rpc.blast.io',
    'https://blast-rpc.publicnode.com',
    'https://blast.drpc.org',
    'https://blast-mainnet.rpc.sentio.xyz',
    'https://blast.api.pocket.network',
  ],
  [ChainId.Mantle]: [
    'https://api.zan.top/mantle-mainnet',
    'https://rpc.mantle.xyz',
    'https://mantle-rpc.publicnode.com',
    'https://mantle.drpc.org',
    'https://mantle.api.onfinality.io/public',
  ],
  [ChainId.Scroll]: [
    'https://rpc.scroll.io',
    'https://scroll-rpc.publicnode.com',
    'https://scroll.drpc.org',
    'https://scroll-public.nodies.app',
    'https://scroll.api.onfinality.io/public',
    'https://scroll.api.pocket.network',
  ],
  [ChainId.Berachain]: [
    'https://rpc.berachain-apis.com',
    'https://berachain-rpc.publicnode.com',
    'https://berachain.rpc.sentio.xyz',
    'https://rpc.berachain.com',
  ],
  [ChainId.Sonic]: [
    'https://sonic-rpc.publicnode.com',
    'https://sonic-mainnet.rpc.sentio.xyz',
    'https://sonic.drpc.org',
    'https://sonic.api.pocket.network',
    'https://sonic-json-rpc.stakely.io',
    'https://rpc.soniclabs.com',
  ],
  [HYPEREVM]: [
    'https://rpc.hypurrscan.io',
    'https://rpc.hyperliquid.xyz/evm',
    'https://hyperliquid.api.onfinality.io/evm/public',
  ],
  [PLASMA]: ['https://plasma.api.onfinality.io/public', 'https://plasma.gateway.tenderly.co', 'https://rpc.plasma.to'],
  [RONIN]: ['https://ronin.drpc.org', 'https://ronin.gateway.tenderly.co', 'https://api.roninchain.com/rpc'],
  [MONAD]: [
    'https://rpc.monad.xyz',
    'https://rpc3.monad.xyz',
    'https://rpc1.monad.xyz',
    'https://rpc-mainnet.monadinfra.com',
    'https://monad-mainnet.api.onfinality.io/public',
    'https://monad-mainnet.drpc.org',
    'https://monad-mainnet.rpc.sentio.xyz',
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
  [UNICHAIN]: [
    'https://unichain.drpc.org',
    'https://unichain-rpc.publicnode.com',
    'https://unichain.api.onfinality.io/public',
    'https://unichain.gateway.tenderly.co',
    'https://mainnet.unichain.org',
  ],
  [ROBINHOOD]: ['https://rpc.mainnet.chain.robinhood.com'],
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
