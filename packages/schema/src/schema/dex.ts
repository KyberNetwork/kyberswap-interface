import { z } from 'zod';

export enum PoolType {
  DEX_UNISWAP_V4 = 68,
  DEX_UNISWAP_V4_FAIRFLOW = 73,
  DEX_PANCAKE_INFINITY_CL = 75,

  DEX_UNISWAPV3 = 2,
  DEX_PANCAKESWAPV3 = 3,
  DEX_METAVAULTV3 = 8,
  DEX_LINEHUBV3 = 35,
  DEX_SWAPMODEV3 = 46,
  DEX_KOICL = 38,
  DEX_THRUSTERV3 = 12,
  DEX_SUSHISWAPV3 = 11,
  DEX_KODIAK_V3 = 58,
  DEX_SQUADSWAP_V3 = 66,

  DEX_PANCAKESWAPV2 = 16,
  DEX_UNISWAPV2 = 4,
  DEX_PANGOLINSTANDARD = 18,
  DEX_SUSHISWAPV2 = 5,
  DEX_QUICKSWAPV2 = 19,
  DEX_THRUSTERV2 = 20,
  DEX_SWAPMODEV2 = 44,
  DEX_KODIAK_V2 = 57,
  DEX_SQUADSWAP_V2 = 65,

  DEX_THENAFUSION = 15,
  DEX_QUICKSWAPV3ALGEBRA = 14,
  DEX_CAMELOTV3 = 13,
}

export const univ4Types = [PoolType.DEX_UNISWAP_V4, PoolType.DEX_UNISWAP_V4_FAIRFLOW, PoolType.DEX_PANCAKE_INFINITY_CL];

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
  PoolType.DEX_PANCAKE_INFINITY_CL,
] as const;
export type Univ3PoolType = (typeof univ3Types)[number];

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
export type Univ2PoolType = (typeof univ2Types)[number];

// export const poolType = Univ3PoolType.or(Univ2PoolType);

export const dexInfo = z.object({
  icon: z.string(),
  name: z.string().or(z.record(z.number(), z.string())),
  nftManagerContract: z.string().or(z.record(z.number(), z.string())),
});
export type DexInfo = z.infer<typeof dexInfo>;
