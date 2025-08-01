import { z } from 'zod';

export enum PoolType {
  DEX_UNISWAP_V4 = 'DEX_UNISWAP_V4',
  DEX_UNISWAP_V4_FAIRFLOW = 'DEX_UNISWAP_V4_FAIRFLOW',

  DEX_UNISWAPV3 = 'DEX_UNISWAPV3',
  DEX_PANCAKESWAPV3 = 'DEX_PANCAKESWAPV3',
  DEX_METAVAULTV3 = 'DEX_METAVAULTV3',
  DEX_LINEHUBV3 = 'DEX_LINEHUBV3',
  DEX_SWAPMODEV3 = 'DEX_SWAPMODEV3',
  DEX_KOICL = 'DEX_KOICL',
  DEX_THRUSTERV3 = 'DEX_THRUSTERV3',
  DEX_SUSHISWAPV3 = 'DEX_SUSHISWAPV3',
  DEX_KODIAK_V3 = 'DEX_KODIAK_V3',
  DEX_SQUADSWAP_V3 = 'DEX_SQUADSWAP_V3',

  DEX_PANCAKESWAPV2 = 'DEX_PANCAKESWAPV2',
  DEX_UNISWAPV2 = 'DEX_UNISWAPV2',
  DEX_PANGOLINSTANDARD = 'DEX_PANGOLINSTANDARD',
  DEX_SUSHISWAPV2 = 'DEX_SUSHISWAPV2',
  DEX_QUICKSWAPV2 = 'DEX_QUICKSWAPV2',
  DEX_THRUSTERV2 = 'DEX_THRUSTERV2',
  DEX_SWAPMODEV2 = 'DEX_SWAPMODEV2',
  DEX_KODIAK_V2 = 'DEX_KODIAK_V2',
  DEX_SQUADSWAP_V2 = 'DEX_SQUADSWAP_V2',

  // algebraV1
  DEX_THENAFUSION = 'DEX_THENAFUSION',
  DEX_QUICKSWAPV3ALGEBRA = 'DEX_QUICKSWAPV3ALGEBRA',
  // algebraV19
  DEX_CAMELOTV3 = 'DEX_CAMELOTV3',
  // algebra integral
  //DEX_BLADESWAP = "DEX_BLADESWAP",
}

export const univ4Types = [PoolType.DEX_UNISWAP_V4, PoolType.DEX_UNISWAP_V4_FAIRFLOW];

export const algebraTypes = [
  PoolType.DEX_THENAFUSION,
  PoolType.DEX_QUICKSWAPV3ALGEBRA,
  PoolType.DEX_CAMELOTV3,
  //PoolType.DEX_BLADESWAP,
];

export const univ3Types = [
  PoolType.DEX_UNISWAPV3,
  PoolType.DEX_PANCAKESWAPV3,
  PoolType.DEX_METAVAULTV3,
  PoolType.DEX_LINEHUBV3,
  PoolType.DEX_SWAPMODEV3,
  PoolType.DEX_KOICL,
  PoolType.DEX_THRUSTERV3,
  PoolType.DEX_SUSHISWAPV3,
  PoolType.DEX_THENAFUSION,
  PoolType.DEX_CAMELOTV3,
  PoolType.DEX_QUICKSWAPV3ALGEBRA,
  //PoolType.DEX_BLADESWAP,
  PoolType.DEX_KODIAK_V3,
  PoolType.DEX_SQUADSWAP_V3,
  PoolType.DEX_UNISWAP_V4,
  PoolType.DEX_UNISWAP_V4_FAIRFLOW,
] as const;
export const Univ3PoolType = z.enum(univ3Types);

export const univ2Types = [
  PoolType.DEX_PANCAKESWAPV2,
  PoolType.DEX_UNISWAPV2,
  PoolType.DEX_PANGOLINSTANDARD,
  PoolType.DEX_SUSHISWAPV2,
  PoolType.DEX_QUICKSWAPV2,
  PoolType.DEX_THRUSTERV2,
  PoolType.DEX_SWAPMODEV2,
  PoolType.DEX_KODIAK_V2,
  PoolType.DEX_SQUADSWAP_V2,
] as const;
export const Univ2PoolType = z.enum(univ2Types);

export const poolType = Univ3PoolType.or(Univ2PoolType);

export const dexInfo = z.object({
  icon: z.string(),
  name: z.string().or(z.record(z.number(), z.string())),
  nftManagerContract: z.string().or(z.record(z.number(), z.string())),
});
export type DexInfo = z.infer<typeof dexInfo>;
