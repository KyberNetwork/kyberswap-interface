import { z } from 'zod';

import { Univ2PoolType, Univ3PoolType } from '@/schema/protocol';

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

export const position = z.discriminatedUnion('poolType', [
  univ3Position.extend({
    poolType: Univ3PoolType,
  }),
  univ2Position.extend({
    poolType: Univ2PoolType,
  }),
]);

export type Position = z.infer<typeof position>;
