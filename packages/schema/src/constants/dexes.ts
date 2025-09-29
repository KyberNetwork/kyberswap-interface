import camelotv3 from '@/constants/dexes/camelotv3';
import kodiakv2 from '@/constants/dexes/kodiakv2';
// import bladeswap from "@/constants/dexes/bladeswap";
import kodiakv3 from '@/constants/dexes/kodiakv3';
import koicl from '@/constants/dexes/koicl';
import linehubv3 from '@/constants/dexes/linehubv3';
import metavaultv3 from '@/constants/dexes/metavaultv3';
import pancakeInfinityCl from '@/constants/dexes/pancake-infinity-cl';
import pancakeswapv2 from '@/constants/dexes/pancakeswapv2';
import pancakeswapv3 from '@/constants/dexes/pancakeswapv3';
import pangolinstandard from '@/constants/dexes/pangolinstandard';
import quickswapv2 from '@/constants/dexes/quickswapv2';
import quickswapv3algebra from '@/constants/dexes/quickswapv3algebra';
import squadswapv2 from '@/constants/dexes/squadswapv2';
import squadswapv3 from '@/constants/dexes/squadswapv3';
import sushiswapv2 from '@/constants/dexes/sushiswapv2';
import sushiswapv3 from '@/constants/dexes/sushiswapv3';
import swapmodev2 from '@/constants/dexes/swapmodev2';
import swapmodev3 from '@/constants/dexes/swapmodev3';
import thenafusion from '@/constants/dexes/thenafusion';
import thrusterv2 from '@/constants/dexes/thrusterv2';
import thrusterv3 from '@/constants/dexes/thrusterv3';
import uniswapv2 from '@/constants/dexes/uniswapv2';
import uniswapv3 from '@/constants/dexes/uniswapv3';
import uniswapv4 from '@/constants/dexes/uniswapv4';
import { DexInfo, PoolType } from '@/schema/dex';

export const DEXES_INFO: Record<PoolType, DexInfo> = {
  [PoolType.DEX_UNISWAP_V4]: uniswapv4,
  [PoolType.DEX_UNISWAP_V4_FAIRFLOW]: {
    ...uniswapv4,
    name: 'Uniswap V4 FairFlow',
  },
  [PoolType.DEX_PANCAKE_INFINITY_CL]: pancakeInfinityCl,
  [PoolType.DEX_PANCAKE_INFINITY_CL_FAIRFLOW]: {
    ...pancakeInfinityCl,
    name: 'Pancake ∞ CL FairFlow',
  },
  [PoolType.DEX_UNISWAPV3]: uniswapv3,
  [PoolType.DEX_PANCAKESWAPV3]: pancakeswapv3,
  [PoolType.DEX_METAVAULTV3]: metavaultv3,
  [PoolType.DEX_LINEHUBV3]: linehubv3,
  [PoolType.DEX_SWAPMODEV3]: swapmodev3,
  [PoolType.DEX_KOICL]: koicl,
  [PoolType.DEX_THRUSTERV3]: thrusterv3,
  [PoolType.DEX_SUSHISWAPV3]: sushiswapv3,
  [PoolType.DEX_PANCAKESWAPV2]: pancakeswapv2,
  [PoolType.DEX_UNISWAPV2]: uniswapv2,
  [PoolType.DEX_PANGOLINSTANDARD]: pangolinstandard,
  [PoolType.DEX_SUSHISWAPV2]: sushiswapv2,
  [PoolType.DEX_QUICKSWAPV2]: quickswapv2,
  [PoolType.DEX_THRUSTERV2]: thrusterv2,
  [PoolType.DEX_SWAPMODEV2]: swapmodev2,
  [PoolType.DEX_KODIAK_V2]: kodiakv2,
  [PoolType.DEX_THENAFUSION]: thenafusion,
  [PoolType.DEX_CAMELOTV3]: camelotv3,
  [PoolType.DEX_QUICKSWAPV3ALGEBRA]: quickswapv3algebra,
  // [PoolType.DEX_BLADESWAP]: bladeswap,
  [PoolType.DEX_KODIAK_V3]: kodiakv3,
  [PoolType.DEX_SQUADSWAP_V3]: squadswapv3,
  [PoolType.DEX_SQUADSWAP_V2]: squadswapv2,
};

export const defaultDexInfo = { icon: '', name: '' };
