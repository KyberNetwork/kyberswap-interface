import { z } from "zod";

export enum ChainId {
  Ethereum = 1,
  Bsc = 56,
  PolygonPos = 137,
  Arbitrum = 42161,
  Avalanche = 43114,
  Base = 8453,
  Blast = 81457,
  Fantom = 250,
  Linea = 59144,
  Mantle = 5000,
  Optimism = 10,
  Scroll = 534352,
  ZkSync = 324,
}
export const chainId = z.nativeEnum(ChainId);

export enum PoolType {
  DEX_UNISWAPV3 = "DEX_UNISWAPV3",
  DEX_PANCAKESWAPV3 = "DEX_PANCAKESWAPV3",
  DEX_METAVAULTV3 = "DEX_METAVAULTV3",
  DEX_LINEHUBV3 = "DEX_LINEHUBV3",
  DEX_SWAPMODEV3 = "DEX_SWAPMODEV3",
  DEX_KOICL = "DEX_KOICL",
  DEX_THRUSTERV3 = "DEX_THRUSTERV3",
  DEX_SUSHISWAPV3 = "DEX_SUSHISWAPV3",

  DEX_PANCAKESWAPV2 = "DEX_PANCAKESWAPV2",
  DEX_UNISWAPV2 = "DEX_UNISWAPV2",
  DEX_PANGOLINSTANDARD = "DEX_PANGOLINSTANDARD",
  DEX_SUSHISWAPV2 = "DEX_SUSHISWAPV2",
  DEX_QUICKSWAPV2 = "DEX_QUICKSWAPV2",
  DEX_THRUSTERV2 = "DEX_THRUSTERV2",
  DEX_SWAPMODEV2 = "DEX_SWAPMODEV2",

  // algebraV1
  DEX_THENAFUSION = "DEX_THENAFUSION",
  DEX_QUICKSWAPV3ALGEBRA = "DEX_QUICKSWAPV3ALGEBRA",

  // algebraV19
  DEX_CAMELOTV3 = "DEX_CAMELOTV3",

  // algebra integral
  //DEX_BLADESWAP = "DEX_BLADESWAP",
}

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
] as const;
export const univ3PoolType = z.enum(univ3Types);

export const univ2Types = [
  PoolType.DEX_PANCAKESWAPV2,
  PoolType.DEX_UNISWAPV2,
  PoolType.DEX_PANGOLINSTANDARD,
  PoolType.DEX_SUSHISWAPV2,
  PoolType.DEX_QUICKSWAPV2,
  PoolType.DEX_THRUSTERV2,
  PoolType.DEX_SWAPMODEV2,
] as const;
export const univ2PoolType = z.enum(univ2Types);

export const poolType = univ3PoolType.or(univ2PoolType);

export const token = z.object({
  address: z.string(),
  symbol: z.string(),
  name: z.string(),
  decimals: z.number(),
  logo: z.string().optional(),
  price: z.number().optional(),
  isStable: z.boolean().optional(),
});
export type Token = z.infer<typeof token>;

export const chain = z.object({
  chainId,
  logo: z.string(),
  name: z.string(),
  scanLink: z.string(),
  multiCall: z.string(),
  nativeLogo: z.string(),
  wrappedToken: token,
  defaultRpc: z.string(),
  zapPath: z.string(),
});

export const dexInfo = z.object({
  icon: z.string(),
  name: z.string().or(z.record(z.number(), z.string())),
  nftManagerContract: z.string().or(z.record(z.number(), z.string())),
});
export type DexInfo = z.infer<typeof dexInfo>;

export type Chain = z.infer<typeof chain>;

export const tick = z.object({
  index: z.number(),
  liquidityGross: z.number(),
  liquidityNet: z.number(),
});
export type Tick = z.infer<typeof tick>;

export const univ3PoolNormalize = z.object({
  address: z.string(),
  token0: token,
  token1: token,
  fee: z.number(),
  tick: z.number(),
  liquidity: z.string(),
  sqrtPriceX96: z.string(),
  tickSpacing: z.number(),
  ticks: z.array(tick),
  minTick: z.number(),
  maxTick: z.number(),
  category: z.enum([
    "stablePair",
    "correlatedPair",
    "commonPair",
    "exoticPair",
    "highVolatilityPair",
  ]),
});
export type UniV3Pool = z.infer<typeof univ3PoolNormalize>;

export const univ2PoolNormalize = z.object({
  token0: token,
  token1: token,
  fee: z.number(),
  reserves: z.tuple([z.string(), z.string()]),
  category: z.enum([
    "stablePair",
    "correlatedPair",
    "commonPair",
    "exoticPair",
    "highVolatilityPair",
  ]),
});

export const pool = z.discriminatedUnion("poolType", [
  univ3PoolNormalize.extend({
    poolType: univ3PoolType,
  }),
  univ2PoolNormalize.extend({
    poolType: univ2PoolType,
  }),
]);

export type Pool = z.infer<typeof pool>;

export const univ3Position = z.object({
  id: z.number(),
  liquidity: z.bigint(),
  tickLower: z.number(),
  tickUpper: z.number(),
  amount0: z.bigint(),
  amount1: z.bigint(),
});
export type UniV3Position = z.infer<typeof univ3Position>;

export const univ2Position = z.object({
  liquidity: z.string(),
  amount0: z.bigint(),
  amount1: z.bigint(),
  totalSupply: z.bigint(),
});
export type UniV2Position = z.infer<typeof univ2Position>;

export const position = z.discriminatedUnion("poolType", [
  univ3Position.extend({
    poolType: univ3PoolType,
  }),
  univ2Position.extend({
    poolType: univ2PoolType,
  }),
]);

export type Position = z.infer<typeof position>;

// Create a mapping object for string to Dex enum
const dexMapping: Record<PoolType, string[]> = {
  // uni v3 forks
  [PoolType.DEX_UNISWAPV3]: ["uniswapv3"],
  [PoolType.DEX_PANCAKESWAPV3]: ["pancake-v3"],
  [PoolType.DEX_METAVAULTV3]: ["metavault-v3"],
  [PoolType.DEX_LINEHUBV3]: ["linehub-v3"],
  [PoolType.DEX_SWAPMODEV3]: ["baseswap-v3", "arbidex-v3", "superswap-v3"],
  [PoolType.DEX_KOICL]: ["koi-cl"],
  [PoolType.DEX_THRUSTERV3]: ["thruster-v3"],
  [PoolType.DEX_SUSHISWAPV3]: ["sushiswap-v3"],

  [PoolType.DEX_THENAFUSION]: ["thena-fusion"],
  [PoolType.DEX_CAMELOTV3]: ["camelot-v3"],
  [PoolType.DEX_QUICKSWAPV3ALGEBRA]: ["quickswap-v3"],
  //[PoolType.DEX_BLADESWAP]: ["blade"],

  // uni v2 forks
  [PoolType.DEX_PANCAKESWAPV2]: ["pancake"],
  [PoolType.DEX_UNISWAPV2]: ["uniswap"],
  [PoolType.DEX_PANGOLINSTANDARD]: ["pangolin"],
  [PoolType.DEX_SUSHISWAPV2]: ["sushiswap"],
  [PoolType.DEX_QUICKSWAPV2]: ["quickswap"],
  [PoolType.DEX_THRUSTERV2]: ["thruster-v2"],
  [PoolType.DEX_SWAPMODEV2]: ["baseswap, arbidex, superswap"],
} as const;

const dexValues = Object.values(dexMapping).flat();

export const univ3Pool = z.object({
  address: z.string(),
  swapFee: z.number(),
  exchange: z.enum(dexValues as [string, ...string[]]).transform((val) => {
    // Reverse lookup in the enum
    const dexEnumKey = Object.keys(dexMapping).find((key) =>
      dexMapping[key as PoolType].includes(val)
    );
    if (!dexEnumKey) {
      throw new Error(`No enum value for exchange: ${val}`);
    }
    return val;
  }),
  tokens: z.tuple([
    token.pick({ address: true }),
    token.pick({ address: true }),
  ]),
  positionInfo: z.object({
    liquidity: z.string(),
    sqrtPriceX96: z.string(),
    tickSpacing: z.number(),
    tick: z.number(),
    ticks: z.array(tick),
  }),
});

export const univ2Pool = z.object({
  address: z.string(),
  reserveUsd: z.string(),
  amplifiedTvl: z.string(),
  swapFee: z.number(),
  exchange: z.string(),
  type: z.string(),
  timestamp: z.number(),
  reserves: z.tuple([z.string(), z.string()]),
  tokens: z.array(
    z.object({
      address: z.string(),
      swappable: z.boolean(),
    })
  ),
  extraFields: z.object({
    fee: z.number(),
    feePrecision: z.number(),
  }),
});

export const univ3PoolResponse = z.object({
  poolType: univ3PoolType,
  data: z.object({
    pools: z.array(univ3Pool),
  }),
});

export const univ2PoolResponse = z.object({
  poolType: univ2PoolType,
  data: z.object({
    pools: z.array(univ2Pool),
  }),
});

export const poolResponse = z.discriminatedUnion("poolType", [
  univ3PoolResponse,
  univ2PoolResponse,
]);

export type PoolResponse = z.infer<typeof poolResponse>;
