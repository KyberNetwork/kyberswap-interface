import { ChainId } from '@/schema/chain';

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
