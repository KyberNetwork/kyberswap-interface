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
  PolygonZkEVM = 1101,
  // ZkSync = 324,
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
  Uniswapv3 = 2,
  Pancakev3 = 3,
  Sushiv3 = 11,
  //Uniswapv2 = 4,
  //Sushiv2 = 5,
  //Curve = 6,
  //Balancer = 7,
}

export const dex = z.nativeEnum(Dex);

export const dexInfo = z.object({
  icon: z.string(),
  name: z.string(),
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
    if (
      (data.dex === Dex.Uniswapv3 ||
        data.dex === Dex.Pancakev3 ||
        data.dex === Dex.Sushiv3) &&
      typeof data.positionId !== "number"
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Position ID must be a number for Uniswapv3 or Pancakev3 or Sushiv3",
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
      (data.dex === Dex.Pancakev3 ||
        data.dex === Dex.Uniswapv3 ||
        data.dex === Dex.Sushiv3) &&
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

export const pool = z.discriminatedUnion("dex", [
  univ3PoolCommonField.extend({
    dex: z.literal(Dex.Uniswapv3),
  }),

  univ3PoolCommonField.extend({
    dex: z.literal(Dex.Pancakev3),
  }),

  univ3PoolCommonField.extend({
    dex: z.literal(Dex.Sushiv3),
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
    dex: z.literal(Dex.Uniswapv3),
  }),
  univ3Position.extend({
    dex: z.literal(Dex.Pancakev3),
  }),
  univ3Position.extend({
    dex: z.literal(Dex.Sushiv3),
  }),
]);

export type Position = z.infer<typeof position>;
