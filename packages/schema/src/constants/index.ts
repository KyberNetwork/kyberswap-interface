import { ChainId } from '@/schema/chain';
import { PoolType } from '@/schema/dex';

export * from './contracts';
export * from './dexes';
export * from './networks';
export * from './theme';

export const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export const CHAIN_ID_TO_CHAIN: { [chainId in ChainId]: string } = {
  [ChainId.Ethereum]: 'ethereum',
  [ChainId.PolygonPos]: 'polygon',
  [ChainId.Bsc]: 'bsc',
  [ChainId.Arbitrum]: 'arbitrum',
  [ChainId.Avalanche]: 'avalanche',
  [ChainId.Base]: 'base',
  [ChainId.Blast]: 'blast',
  [ChainId.Fantom]: 'fantom',
  [ChainId.Mantle]: 'mantle',
  [ChainId.Optimism]: 'optimism',
  [ChainId.Scroll]: 'scroll',
  [ChainId.Linea]: 'linea',
  [ChainId.ZkSync]: 'zksync',
  [ChainId.Berachain]: 'berachain',
  [ChainId.Sonic]: 'sonic',
};

export const API_URLS = {
  BFF_API: 'https://bff.kyberswap.com/api',
  KYBERSWAP_SETTING_API: 'https://ks-setting.kyberswap.com/api',
  ZAP_API: 'https://zap-api.kyberswap.com',
  // ZAP_API: 'https://pre-zap-api.kyberengineering.io',
  COINGECKO_API_URL: 'https://api.coingecko.com/api/v3',
  GO_PLUS_API: 'https://api.gopluslabs.io/api/v1/token_security',
  // ZAP_EARN_API: 'https://zap-earn-service-v3.kyberengineering.io/api',
  ZAP_EARN_API: 'https://pre-zap-earn-service.kyberengineering.io/api',
  TOKEN_API: 'https://token-api.kyberengineering.io/api',
  DOCUMENT: {
    ZAP_FEE_MODEL: 'https://docs.kyberswap.com/kyberswap-solutions/kyberswap-zap-as-a-service/zap-fee-model',
  },
};

export const dexMapping: Record<PoolType, string[]> = {
  [PoolType.DEX_UNISWAP_V4]: ['uniswap-v4'],
  [PoolType.DEX_UNISWAP_V4_FAIRFLOW]: ['uniswap-v4-fairflow'],
  [PoolType.DEX_PANCAKE_INFINITY_CL]: ['pancake-infinity-cl'],

  [PoolType.DEX_UNISWAPV3]: ['uniswapv3'],
  [PoolType.DEX_PANCAKESWAPV3]: ['pancake-v3'],
  [PoolType.DEX_METAVAULTV3]: ['metavault-v3'],
  [PoolType.DEX_LINEHUBV3]: ['linehub-v3'],
  [PoolType.DEX_SWAPMODEV3]: ['baseswap-v3', 'arbidex-v3', 'superswap-v3'],
  [PoolType.DEX_KOICL]: ['koi-cl'],
  [PoolType.DEX_THRUSTERV3]: ['thruster-v3'],
  [PoolType.DEX_SUSHISWAPV3]: ['sushiswap-v3'],

  [PoolType.DEX_PANCAKESWAPV2]: ['pancake'],
  [PoolType.DEX_UNISWAPV2]: ['uniswap'],
  [PoolType.DEX_PANGOLINSTANDARD]: ['pangolin'],
  [PoolType.DEX_SUSHISWAPV2]: ['sushiswap'],
  [PoolType.DEX_QUICKSWAPV2]: ['quickswap'],
  [PoolType.DEX_THRUSTERV2]: ['thruster-v2'],
  [PoolType.DEX_SWAPMODEV2]: ['baseswap, arbidex, superswap'],
  [PoolType.DEX_KODIAK_V3]: ['kodiak-v3'],
  [PoolType.DEX_KODIAK_V2]: ['kodiakcl'],
  [PoolType.DEX_SQUADSWAP_V3]: ['squadswap-v3'],
  [PoolType.DEX_SQUADSWAP_V2]: ['squadswap'],

  [PoolType.DEX_THENAFUSION]: ['thena-fusion'],
  [PoolType.DEX_CAMELOTV3]: ['camelot-v3'],
  [PoolType.DEX_QUICKSWAPV3ALGEBRA]: ['quickswap-v3'],
} as const;

export enum POOL_CATEGORY {
  STABLE_PAIR = 'stablePair',
  CORRELATED_PAIR = 'correlatedPair',
  COMMON_PAIR = 'commonPair',
  EXOTIC_PAIR = 'exoticPair',
  HIGH_VOLATILITY_PAIR = 'highVolatilityPair',
}

export enum FARMING_PROGRAM {
  EG = 'eg',
  LM = 'lm',
}
