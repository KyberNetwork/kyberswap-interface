import { z } from "zod";
import { PoolType, Univ3PoolType } from "@/schema/protocol";
import { token } from "@/schema/token";
import { tick } from "@/schema/tick";
import { dexValues, dexMapping } from "@/constants";

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

export const univ3PoolResponse = z.object({
  poolType: Univ3PoolType,
  data: z.object({
    pools: z.array(univ3Pool),
  }),
});
