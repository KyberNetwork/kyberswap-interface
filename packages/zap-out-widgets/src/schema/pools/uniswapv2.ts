import { z } from "zod";
import { token } from "@/schema/token";
import { Univ2PoolType } from "@/schema/protocol";

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

export type UniV2Pool = z.infer<typeof univ2PoolNormalize>;

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
  //extraFields: z.object({
  //  fee: z.number(),
  //  feePrecision: z.number(),
  //}),
});

export const univ2PoolResponse = z.object({
  poolType: Univ2PoolType,
  data: z.object({
    pools: z.array(univ2Pool),
  }),
});
