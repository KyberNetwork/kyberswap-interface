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

  DEX_THENAFUSION = 15,

  DEX_CAMELOTV3 = 13,
  DEX_QUICKSWAPV3ALGEBRA = 14,
}

export const dex = z.nativeEnum(Dex);

export const dexInfo = z.object({
  icon: z.string(),
  name: z.string().or(z.record(z.number(), z.string())),
  nftManagerContract: z.string().or(z.record(z.number(), z.string())),
});

export type DexInfo = z.infer<typeof dexInfo>;

export const dexFrom = z
  .object({
    dex: dex,
    poolId: z.string(),
    positionId: z.union([z.string(), z.number()]),
    liquidityOut: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (univ3Dexes.includes(data.dex) && typeof data.positionId !== "number") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Position ID must be a number for univ3 pool type",
        path: ["positionId"],
      });
    }
  });

export type DexFrom = z.infer<typeof dexFrom>;

export const dexTo = z
  .object({
    dex: dex,
    poolId: z.string(),
    positionId: z.union([z.string(), z.number()]).optional(),
    tickLower: z.number().optional(),
    tickUpper: z.number().optional(),
  })
  .superRefine((data, ctx) => {
    // If dex is Pancakev3 or Uniswapv3, positionId should be a number
    if (
      univ3Dexes.includes(data.dex) &&
      data.positionId &&
      typeof data.positionId !== "number"
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Position ID must be a number for Pancakev3 or Uniswapv3",
        path: ["positionId"],
      });
    }

    // If positionId exists, tickLower and tickUpper should not exist
    if (
      data.positionId &&
      (data.tickLower !== undefined || data.tickUpper !== undefined)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "tickLower and tickUpper should not be provided when positionId exists",
        path: ["tickLower", "tickUpper"], // attaching error to tickLower for example, could also be tickUpper
      });
    }
  });

export type DexTo = z.infer<typeof dexTo>;

export type Chain = z.infer<typeof chain>;

export const tick = z.object({
  index: z.number(),
  liquidityGross: z.number(),
  liquidityNet: z.number(),
});
export type Tick = z.infer<typeof tick>;

const univ3PoolCommonField = z.object({
  address: z.string(),
  token0: token,
  token1: token,
  fee: z.number(),
  tick: z.number(),
  liquidity: z.string(),
  sqrtPriceX96: z.string(),
  tickSpacing: z.number(),
  ticks: z.array(tick),
  category: z.enum([
    "stablePair",
    "correlatedPair",
    "commonPair",
    "exoticPair",
    "highVolatilityPair",
  ]),
});

export const algebraTypes: Dex[] = [
  Dex.DEX_THENAFUSION,
  Dex.DEX_CAMELOTV3,
  Dex.DEX_QUICKSWAPV3ALGEBRA,
] as const;

export const univ3Dexes = [
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
] as const;

// Create the discriminated union with the correct structure
export const pool = z.discriminatedUnion("dex", [
  univ3PoolCommonField.extend({
    dex: z.literal(Dex.DEX_UNISWAPV3),
  }),
  univ3PoolCommonField.extend({
    dex: z.literal(Dex.DEX_PANCAKESWAPV3),
  }),
  univ3PoolCommonField.extend({
    dex: z.literal(Dex.DEX_METAVAULTV3),
  }),
  univ3PoolCommonField.extend({
    dex: z.literal(Dex.DEX_LINEHUBV3),
  }),
  univ3PoolCommonField.extend({
    dex: z.literal(Dex.DEX_SWAPMODEV3),
  }),
  univ3PoolCommonField.extend({
    dex: z.literal(Dex.DEX_KOICL),
  }),
  univ3PoolCommonField.extend({
    dex: z.literal(Dex.DEX_THRUSTERV3),
  }),
  univ3PoolCommonField.extend({
    dex: z.literal(Dex.DEX_SUSHISWAPV3),
  }),
  univ3PoolCommonField.extend({
    dex: z.literal(Dex.DEX_THENAFUSION),
  }),
  univ3PoolCommonField.extend({
    dex: z.literal(Dex.DEX_CAMELOTV3),
  }),
  univ3PoolCommonField.extend({
    dex: z.literal(Dex.DEX_QUICKSWAPV3ALGEBRA),
  }),
]);
export type Pool = z.infer<typeof pool>;

const univ3Position = z.object({
  id: z.number(),
  liquidity: z.bigint(),
  tickLower: z.number(),
  tickUpper: z.number(),
});

export const position = z.discriminatedUnion("dex", [
  univ3Position.extend({
    dex: z.literal(Dex.DEX_UNISWAPV3),
  }),
  univ3Position.extend({
    dex: z.literal(Dex.DEX_PANCAKESWAPV3),
  }),
  univ3Position.extend({
    dex: z.literal(Dex.DEX_METAVAULTV3),
  }),
  univ3Position.extend({
    dex: z.literal(Dex.DEX_LINEHUBV3),
  }),
  univ3Position.extend({
    dex: z.literal(Dex.DEX_SWAPMODEV3),
  }),
  univ3Position.extend({
    dex: z.literal(Dex.DEX_KOICL),
  }),
  univ3Position.extend({
    dex: z.literal(Dex.DEX_THRUSTERV3),
  }),
  univ3Position.extend({
    dex: z.literal(Dex.DEX_SUSHISWAPV3),
  }),
  univ3Position.extend({
    dex: z.literal(Dex.DEX_THENAFUSION),
  }),
  univ3Position.extend({
    dex: z.literal(Dex.DEX_CAMELOTV3),
  }),
  univ3Position.extend({
    dex: z.literal(Dex.DEX_QUICKSWAPV3ALGEBRA),
  }),
]);

export type Position = z.infer<typeof position>;
