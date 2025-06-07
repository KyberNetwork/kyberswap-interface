import { z } from 'zod';

import { POOL_CATEGORY } from '@/constants';
import { Univ2PoolType } from '@/schema/dex';
import { token } from '@/schema/token';

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
    }),
  ),
});

export const univ2PoolResponse = z.object({
  poolType: Univ2PoolType,
  data: z.object({
    pools: z.array(univ2Pool),
  }),
});

export const univ2PoolNormalize = z.object({
  poolType: Univ2PoolType,
  address: z.string(),
  token0: token,
  token1: token,
  fee: z.number(),
  reserves: z.tuple([z.string(), z.string()]),
  category: z.nativeEnum(POOL_CATEGORY),
});

export type UniV2Pool = z.infer<typeof univ2PoolNormalize>;
