import { z } from "zod";

export enum ChainId {
  Ethereum = 1,
  Bsc = 56,
  PolygonPos = 137,
  Arbitrum = 42161,
  Avalanche = 43114,
  Base = 8453,
  Blast = 81457,
  // Fantom = 250,
  Linea = 59144,
  // Mantle = 5000,
  Optimism = 10,
  Scroll = 534352,
  ZkSync = 324,
  Berachain = 80094,
  Sonic = 146,
}

export const chainId = z.nativeEnum(ChainId);

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

export enum Dex {
  DEX_UNISWAPV3 = 2,
  DEX_PANCAKESWAPV3 = 3,
  DEX_SUSHISWAPV3 = 11,
  DEX_METAVAULTV3 = 8,
  DEX_LINEHUBV3 = 35,
  DEX_SWAPMODEV3 = 46,
  DEX_KOICL = 38,
  DEX_THRUSTERV3 = 12,
  DEX_KODIAK_V3 = 58,

  DEX_THENAFUSION = 15,

  DEX_CAMELOTV3 = 13,
  DEX_QUICKSWAPV3ALGEBRA = 14,
  DEX_SQUADSWAP_V3 = 66,

  DEX_UNISWAPV2 = 4,
  DEX_SQUADSWAP_V2 = 65,

  DEX_UNISWAP_V4 = 68,
  DEX_UNISWAP_V4_FAIRFLOW = 73,
}

export const dex = z.nativeEnum(Dex);

export const dexInfo = z.object({
  icon: z.string(),
  name: z.string().or(z.record(z.number(), z.string())),
  nftManagerContract: z.string().or(z.record(z.number(), z.string())),
});

export type DexInfo = z.infer<typeof dexInfo>;

export const dexFrom = z.object({
  dex: dex,
  poolId: z.string(),
  positionId: z.union([z.string(), z.number()]),
  liquidityOut: z.string().optional(),
});

export type DexFrom = z.infer<typeof dexFrom>;

export const dexTo = z.object({
  dex: dex,
  poolId: z.string(),
  positionId: z.union([z.string(), z.number()]).optional(),
  tickLower: z.number().optional(),
  tickUpper: z.number().optional(),
});

export type DexTo = z.infer<typeof dexTo>;

export type Chain = z.infer<typeof chain>;

export const tick = z.object({
  index: z.number(),
  liquidityGross: z.number(),
  liquidityNet: z.number(),
});
export type Tick = z.infer<typeof tick>;

export const univ3PoolCommonField = z.object({
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
export type UniV3Pool = z.infer<typeof univ3PoolCommonField>;

export const univ2PoolNormalize = z.object({
  address: z.string(),
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
  totalSupply: z.bigint().optional(),
});
export type UniV2Pool = z.infer<typeof univ2PoolNormalize>;

export const algebraTypes: Dex[] = [
  Dex.DEX_THENAFUSION,
  Dex.DEX_CAMELOTV3,
  Dex.DEX_QUICKSWAPV3ALGEBRA,
] as const;

export const univ4Dexes: Dex[] = [
  Dex.DEX_UNISWAP_V4,
  Dex.DEX_UNISWAP_V4_FAIRFLOW,
] as const;

export const univ3Dexes: Dex[] = [
  Dex.DEX_UNISWAPV3,
  Dex.DEX_PANCAKESWAPV3,
  Dex.DEX_METAVAULTV3,
  Dex.DEX_LINEHUBV3,
  Dex.DEX_SWAPMODEV3,
  Dex.DEX_KOICL,
  Dex.DEX_THRUSTERV3,
  Dex.DEX_SUSHISWAPV3,
  Dex.DEX_THENAFUSION,
  Dex.DEX_CAMELOTV3,
  Dex.DEX_QUICKSWAPV3ALGEBRA,
  Dex.DEX_KODIAK_V3,
  Dex.DEX_SQUADSWAP_V3,
  Dex.DEX_UNISWAP_V4,
  Dex.DEX_UNISWAP_V4_FAIRFLOW,
] as const;
export type Univ3Dex = (typeof univ3Dexes)[number];

export const univ2Dexes: Dex[] = [
  Dex.DEX_UNISWAPV2,
  Dex.DEX_SQUADSWAP_V2,
] as const;
export type Univ2Dex = (typeof univ2Dexes)[number];

// Create the discriminated union with the correct structure
export const pool = z.discriminatedUnion("dex", [
  univ3PoolCommonField.extend({
    dex: z.literal(univ3Dexes[0]),
  }),
  ...univ3Dexes.slice(1).map((dex) =>
    univ3PoolCommonField.extend({
      dex: z.literal(dex),
    })
  ),
  univ2PoolNormalize.extend({
    dex: z.literal(univ2Dexes[0]),
  }),
  ...univ2Dexes.slice(1).map((dex) =>
    univ2PoolNormalize.extend({
      dex: z.literal(dex),
    })
  ),
]);
export type Pool = z.infer<typeof pool>;

const univ3Position = z.object({
  id: z.number(),
  liquidity: z.bigint(),
  tickLower: z.number(),
  tickUpper: z.number(),
});
export type UniV3Position = z.infer<typeof univ3Position>;

const univ2Position = z.object({
  id: z.string(),
  liquidity: z.string(),
  totalSupply: z.string(),
});
export type UniV2Position = z.infer<typeof univ2Position>;

const createUniV3PositionSchemas = () =>
  univ3Dexes.map((dex) =>
    univ3Position.extend({
      dex: z.literal(dex),
    })
  );

const createUniV2PositionSchemas = () =>
  univ2Dexes.map((dex) =>
    univ2Position.extend({
      dex: z.literal(dex),
    })
  );

const uniV3Schemas = createUniV3PositionSchemas();
const uniV2Schemas = createUniV2PositionSchemas();

export const position = z.discriminatedUnion("dex", [
  uniV3Schemas[0],
  ...uniV3Schemas.slice(1),
  uniV2Schemas[0],
  ...uniV2Schemas.slice(1),
]);

export type Position = z.infer<typeof position>;
