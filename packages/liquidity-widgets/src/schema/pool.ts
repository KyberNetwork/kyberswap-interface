import { z } from "zod";
import { Univ2PoolType, Univ3PoolType } from "@/schema/protocol";
import {
  univ3PoolResponse,
  univ3PoolNormalize,
  univ3Pool,
  UniV3Pool,
} from "@/schema/pools/uniswapv3";
import {
  univ2PoolNormalize,
  UniV2Pool,
  univ2Pool,
  univ2PoolResponse,
} from "@/schema/pools/uniswapv2";

export const pool = z.discriminatedUnion("poolType", [
  univ3PoolNormalize.extend({
    poolType: Univ3PoolType,
  }),
  univ2PoolNormalize.extend({
    poolType: Univ2PoolType,
  }),
]);

export type Pool = z.infer<typeof pool>;

export const poolResponse = z.discriminatedUnion("poolType", [
  univ3PoolResponse,
  univ2PoolResponse,
]);

export type PoolResponse = z.infer<typeof poolResponse>;

export { univ3PoolResponse, univ3PoolNormalize, univ3Pool };
export type { UniV3Pool };

export { univ2PoolResponse, univ2PoolNormalize, univ2Pool };
export type { UniV2Pool };
