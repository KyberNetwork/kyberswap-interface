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
  type: z.string(),
  timestamp: z.number(),
  reserves: z.tuple([z.string(), z.string()]),
  tokens: z.array(
    z.object({
      address: z.string(),
      swappable: z.boolean(),
    }),
  ),
  poolStats: z.object({
    tvl: z.number(),
    volume24h: z.number(),
    fees24h: z.number(),
    apr: z.number(),
    kemLMApr: z.number().optional(),
    kemEGApr: z.number().optional(),
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
    kemLMApr: z.number(),
    kemEGApr: z.number(),
  }),
  isFarming: z.boolean().optional(),
});
