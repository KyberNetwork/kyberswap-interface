import { z } from 'zod';

import { ChainId } from '@/schema/chain';

export enum EarnDex {
  DEX_UNISWAP_V4 = 'Uniswap V4',
  DEX_UNISWAP_V4_FAIRFLOW = 'Uniswap V4 FairFlow',
  DEX_UNISWAPV3 = 'Uniswap V3',
  DEX_PANCAKESWAPV3 = 'PancakeSwap V3',
  DEX_SUSHISWAPV3 = 'SushiSwap V3',
  DEX_QUICKSWAPV3ALGEBRA = 'QuickSwap V3',
  DEX_CAMELOTV3 = 'Camelot V3',
  DEX_THENAFUSION = 'THENA',
  DEX_KODIAK_V3 = 'Kodiak Concentrated',
  DEX_UNISWAPV2 = 'Uniswap V2',
}

export enum EarnChain {
  MAINNET = ChainId.Ethereum,
  BASE = ChainId.Base,
  BSC = ChainId.Bsc,
  ARBITRUM = ChainId.Arbitrum,
  AVAX = ChainId.Avalanche,
  OPTIMISM = ChainId.Optimism,
  MATIC = ChainId.PolygonPos,
  BERA = ChainId.Berachain,
}

const univ2Dexes = [EarnDex.DEX_UNISWAPV2] as const;
export const Univ2EarnDex = z.enum(univ2Dexes);

const univ3Dexes = [
  EarnDex.DEX_UNISWAPV3,
  EarnDex.DEX_PANCAKESWAPV3,
  EarnDex.DEX_SUSHISWAPV3,
  EarnDex.DEX_KODIAK_V3,
  EarnDex.DEX_THENAFUSION,
  EarnDex.DEX_CAMELOTV3,
  EarnDex.DEX_QUICKSWAPV3ALGEBRA,

  EarnDex.DEX_UNISWAP_V4,
  EarnDex.DEX_UNISWAP_V4_FAIRFLOW,
] as const;
export const Univ3EarnDex = z.enum(univ3Dexes);
