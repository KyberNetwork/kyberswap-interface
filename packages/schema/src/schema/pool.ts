import { z } from 'zod';

import { univ2Types, univ3Types } from '@/schema/dex';
import { UniV2Pool, univ2Pool, univ2PoolNormalize, univ2PoolResponse } from '@/schema/pools/uniswapv2';
import { UniV3Pool, univ3Pool, univ3PoolNormalize, univ3PoolResponse } from '@/schema/pools/uniswapv3';

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

export type PoolResponse = z.infer<typeof poolResponse>;

export { univ3PoolResponse, univ3PoolNormalize, univ3Pool };
export type { UniV3Pool };

export { univ2PoolResponse, univ2PoolNormalize, univ2Pool };
export type { UniV2Pool };
