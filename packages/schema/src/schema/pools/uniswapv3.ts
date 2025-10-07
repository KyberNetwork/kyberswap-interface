import { z } from 'zod';

import { POOL_CATEGORY, dexMapping } from '@/constants';
import { PoolType, univ3Types } from '@/schema/dex';
import { tick } from '@/schema/tick';
import { token } from '@/schema/token';

const dexValues = Object.values(dexMapping).flat();
export const univ3RawPool = z.object({
  address: z.string(),
  swapFee: z.number(),
  exchange: z.enum(dexValues as [string, ...string[]]).transform(val => {
    // Reverse lookup in the enum
    const dexEnumKey = Object.keys(dexMapping).find(key => dexMapping[Number(key) as PoolType].includes(val));
    if (!dexEnumKey) {
      throw new Error(`No enum value for exchange: ${val}`);
    }
    return val;
  }),
  tokens: z.tuple([token.pick({ address: true }), token.pick({ address: true })]),
  positionInfo: z.object({
    liquidity: z.string(),
    sqrtPriceX96: z.string(),
    tickSpacing: z.number(),
    tick: z.number(),
    ticks: z.array(tick).optional(),
  }),
  poolStats: z.object({
    tvl: z.number(),
    volume24h: z.number(),
    fees24h: z.number(),
    apr: z.number(),
    kemLMApr: z.number().optional(),
    kemEGApr: z.number().optional(),
  }),
  programs: z.array(z.string()).optional(),
  staticExtra: z.string().optional(),
});

type Univ3PoolType = (typeof univ3Types)[number];
export const univ3PoolNormalize = z.object({
  address: z.string(),
  poolType: z.nativeEnum(PoolType).refine((val): val is Univ3PoolType => univ3Types.includes(val as Univ3PoolType)),
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
  isFarmingLm: z.boolean().optional(),
});
export type UniV3Pool = z.infer<typeof univ3PoolNormalize>;
