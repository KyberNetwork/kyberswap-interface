import { z } from 'zod';

import { POOL_CATEGORY } from '@/constants';
import { PoolType, univ2Types } from '@/schema/dex';
import { token } from '@/schema/token';

export const univ2RawPool = z.object({
  address: z.string(),
  reserveUsd: z.string(),
  amplifiedTvl: z.string(),
  swapFee: z.number(),
  exchange: z.string(),
  type: z.string().optional(),
  timestamp: z.number(),
  reserves: z.tuple([z.string(), z.string()]),
  tokens: z.array(
    z.object({
      address: z.string(),
      swappable: z.boolean(),
    }),
  ),
  poolStats: z.object({
    tvl: z.number().optional(),
    volume24h: z.number().optional(),
    fees24h: z.number().optional(),
    apr: z.number().optional(),
    apr24h: z.number().optional(),
    apr30d: z.number().optional(),
    kemLMApr24h: z.number().optional(),
    kemLMApr30d: z.number().optional(),
    kemEGApr24h: z.number().optional(),
    kemEGApr30d: z.number().optional(),
  }),
  programs: z.array(z.string()).optional(),
});

type Univ2PoolType = (typeof univ2Types)[number];
export const univ2PoolNormalize = z.object({
  poolType: z.nativeEnum(PoolType).refine((val): val is Univ2PoolType => univ2Types.includes(val as Univ2PoolType)),
  address: z.string(),
  token0: token,
  token1: token,
  fee: z.number(),
  reserves: z.tuple([z.string(), z.string()]),
  category: z.nativeEnum(POOL_CATEGORY),
  stats: z.object({
    tvl: z.number(),
    volume24h: z.number(),
    fees24h: z.number(),
    apr: z.number(),
    apr24h: z.number(),
    apr30d: z.number(),
    kemLMApr24h: z.number(),
    kemLMApr30d: z.number(),
    kemEGApr24h: z.number(),
    kemEGApr30d: z.number(),
  }),
  isFarming: z.boolean().optional(),
  isFarmingLm: z.boolean().optional(),
});
export type UniV2Pool = z.infer<typeof univ2PoolNormalize>;
