import { z } from 'zod';

import { dexMapping } from '@/constants';
import { PoolType, univ2Types, univ3Types } from '@/schema/dex';
import { UniV2Pool, univ2PoolNormalize, univ2RawPool } from '@/schema/pools/uniswapv2';
import { UniV3Pool, univ3PoolNormalize, univ3RawPool } from '@/schema/pools/uniswapv3';

type Univ2PoolType = (typeof univ2Types)[number];
type Univ3PoolType = (typeof univ3Types)[number];

const univ2PoolResponse = z.object({
  poolType: z.nativeEnum(PoolType).refine((val): val is Univ2PoolType => univ2Types.includes(val as Univ2PoolType)),
  data: univ2RawPool,
});

const univ3PoolResponse = z.object({
  poolType: z.nativeEnum(PoolType).refine((val): val is Univ3PoolType => univ3Types.includes(val as Univ3PoolType)),
  data: univ3RawPool,
});

export const pool = z.discriminatedUnion('poolType', [
  univ3PoolNormalize.extend({
    poolType: z.literal(univ3Types[0]),
  }),
  ...univ3Types.slice(1).map(poolType =>
    univ3PoolNormalize.extend({
      poolType: z.literal(poolType),
    }),
  ),
  univ2PoolNormalize.extend({
    poolType: z.literal(univ2Types[0]),
  }),
  ...univ2Types.slice(1).map(poolType =>
    univ2PoolNormalize.extend({
      poolType: z.literal(poolType),
    }),
  ),
]);
export type Pool = z.infer<typeof pool>;

export const poolResponse = z.discriminatedUnion('poolType', [
  univ3PoolResponse.extend({
    poolType: z.literal(univ3Types[0]),
  }),
  ...univ3Types.slice(1).map(poolType =>
    univ3PoolResponse.extend({
      poolType: z.literal(poolType),
    }),
  ),
  univ2PoolResponse.extend({
    poolType: z.literal(univ2Types[0]),
  }),
  ...univ2Types.slice(1).map(poolType =>
    univ2PoolResponse.extend({
      poolType: z.literal(poolType),
    }),
  ),
]);

export {
  univ2RawPool,
  univ2PoolNormalize,
  type UniV2Pool,
  univ3RawPool,
  univ3PoolNormalize,
  type UniV3Pool,
  dexMapping,
};
