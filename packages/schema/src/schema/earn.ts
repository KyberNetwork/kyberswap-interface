import { z } from 'zod';

import { ChainId } from '@/schema/chain';

export enum Exchange {
  DEX_UNISWAP_V4 = 'uniswap-v4',
  DEX_UNISWAP_V4_FAIRFLOW = 'uniswap-v4-fairflow',
  DEX_UNISWAPV3 = 'uniswapv3',
  DEX_PANCAKESWAPV3 = 'pancake-v3',
  DEX_SUSHISWAPV3 = 'sushiswap-v3',
  DEX_QUICKSWAPV3ALGEBRA = 'quickswap-v3',
  DEX_CAMELOTV3 = 'camelot-v3',
  DEX_THENAFUSION = 'thena-fusion',
  DEX_KODIAK_V3 = 'kodiakcl',
  DEX_UNISWAPV2 = 'uniswapv2',
  DEX_PANCAKE_INFINITY_CL = 'pancake-infinity-cl',
  DEX_PANCAKE_INFINITY_CL_FAIRFLOW = 'pancake-infinity-cl-fairflow',
}

export const DEX_NAME: Record<Exchange, string> = {
  [Exchange.DEX_UNISWAP_V4]: 'Uniswap V4',
  [Exchange.DEX_UNISWAP_V4_FAIRFLOW]: 'Uniswap V4 FairFlow',
  [Exchange.DEX_UNISWAPV3]: 'Uniswap V3',
  [Exchange.DEX_PANCAKESWAPV3]: 'PancakeSwap V3',
  [Exchange.DEX_SUSHISWAPV3]: 'SushiSwap V3',
  [Exchange.DEX_QUICKSWAPV3ALGEBRA]: 'QuickSwap V3',
  [Exchange.DEX_CAMELOTV3]: 'Camelot V3',
  [Exchange.DEX_THENAFUSION]: 'THENA',
  [Exchange.DEX_KODIAK_V3]: 'Kodiak Concentrated',
  [Exchange.DEX_UNISWAPV2]: 'Uniswap V2',
  [Exchange.DEX_PANCAKE_INFINITY_CL]: 'Pancake ∞ CL',
  [Exchange.DEX_PANCAKE_INFINITY_CL_FAIRFLOW]: 'Pancake ∞ CL FairFlow',
};

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

const univ2Dexes = [Exchange.DEX_UNISWAPV2] as const;
export const Univ2EarnDex = z.enum(univ2Dexes);

const univ3Dexes = [
  Exchange.DEX_UNISWAPV3,
  Exchange.DEX_PANCAKESWAPV3,
  Exchange.DEX_SUSHISWAPV3,
  Exchange.DEX_KODIAK_V3,
  Exchange.DEX_THENAFUSION,
  Exchange.DEX_CAMELOTV3,
  Exchange.DEX_QUICKSWAPV3ALGEBRA,

  Exchange.DEX_UNISWAP_V4,
  Exchange.DEX_UNISWAP_V4_FAIRFLOW,
  Exchange.DEX_PANCAKE_INFINITY_CL,
  Exchange.DEX_PANCAKE_INFINITY_CL_FAIRFLOW,
] as const;
export const Univ3EarnDex = z.enum(univ3Dexes);
