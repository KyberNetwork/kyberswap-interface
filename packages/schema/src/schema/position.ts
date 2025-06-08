import { z } from 'zod';

import { univ2Types, univ3Types } from '@/schema/dex';

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

const createUniV3PositionSchemas = () =>
  univ3Types.map(poolType =>
    univ3Position.extend({
      poolType: z.literal(poolType),
    }),
  );

const createUniV2PositionSchemas = () =>
  univ2Types.map(poolType =>
    univ2Position.extend({
      poolType: z.literal(poolType),
    }),
  );

const uniV3Schemas = createUniV3PositionSchemas();
const uniV2Schemas = createUniV2PositionSchemas();

export const position = z.discriminatedUnion('poolType', [
  uniV3Schemas[0],
  ...uniV3Schemas.slice(1),
  uniV2Schemas[0],
  ...uniV2Schemas.slice(1),
]);

export type Position = z.infer<typeof position>;
