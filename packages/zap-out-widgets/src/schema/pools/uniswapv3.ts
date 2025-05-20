import { z } from "zod";
import { PoolType, Univ3PoolType } from "@/schema/dex";
import { token } from "@/schema/token";

const dexMapping: Record<PoolType, string[]> = {
  [PoolType.DEX_UNISWAP_V4]: ["uniswap-v4"],
  [PoolType.DEX_UNISWAP_V4_FAIRFLOW]: ["uniswap-v4-kem"],

  [PoolType.DEX_UNISWAPV3]: ["uniswapv3"],
  [PoolType.DEX_PANCAKESWAPV3]: ["pancake-v3"],
  [PoolType.DEX_METAVAULTV3]: ["metavault-v3"],
  [PoolType.DEX_LINEHUBV3]: ["linehub-v3"],
  [PoolType.DEX_SWAPMODEV3]: ["baseswap-v3", "arbidex-v3", "superswap-v3"],
  [PoolType.DEX_KOICL]: ["koi-cl"],
  [PoolType.DEX_THRUSTERV3]: ["thruster-v3"],
  [PoolType.DEX_SUSHISWAPV3]: ["sushiswap-v3"],

  [PoolType.DEX_PANCAKESWAPV2]: ["pancake"],
  [PoolType.DEX_UNISWAPV2]: ["uniswap"],
  [PoolType.DEX_PANGOLINSTANDARD]: ["pangolin"],
  [PoolType.DEX_SUSHISWAPV2]: ["sushiswap"],
  [PoolType.DEX_QUICKSWAPV2]: ["quickswap"],
  [PoolType.DEX_THRUSTERV2]: ["thruster-v2"],
  [PoolType.DEX_SWAPMODEV2]: ["baseswap, arbidex, superswap"],
  [PoolType.DEX_KODIAK_V3]: ["kodiak-v3"],
  [PoolType.DEX_KODIAK_V2]: ["kodiak"],
  [PoolType.DEX_SQUADSWAP_V3]: ["squadswap-v3"],
  [PoolType.DEX_SQUADSWAP_V2]: ["squadswap"],

  [PoolType.DEX_THENAFUSION]: ["thena-fusion"],
  [PoolType.DEX_CAMELOTV3]: ["camelot-v3"],
  [PoolType.DEX_QUICKSWAPV3ALGEBRA]: ["quickswap-v3"],
  //[PoolType.DEX_BLADESWAP]: ["blade"],
};

const dexValues = Object.values(dexMapping).flat();

const tick = z.object({
  index: z.number(),
  liquidityGross: z.number(),
  liquidityNet: z.number(),
});

export const univ3PoolNormalize = z.object({
  address: z.string(),
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
  category: z.enum([
    "stablePair",
    "correlatedPair",
    "commonPair",
    "exoticPair",
    "highVolatilityPair",
  ]),
});

export type UniV3Pool = z.infer<typeof univ3PoolNormalize>;

export const univ3Pool = z.object({
  address: z.string(),
  swapFee: z.number(),
  exchange: z.enum(dexValues as [string, ...string[]]).transform((val) => {
    // Reverse lookup in the enum
    const dexEnumKey = Object.keys(dexMapping).find((key) =>
      dexMapping[key as PoolType].includes(val)
    );
    if (!dexEnumKey) {
      throw new Error(`No enum value for exchange: ${val}`);
    }
    return val;
  }),
  tokens: z.tuple([
    token.pick({ address: true }),
    token.pick({ address: true }),
  ]),
  positionInfo: z.object({
    liquidity: z.string(),
    sqrtPriceX96: z.string(),
    tickSpacing: z.number(),
    tick: z.number(),
    ticks: z.array(tick).optional(),
  }),
});

export const univ3PoolResponse = z.object({
  poolType: Univ3PoolType,
  data: z.object({
    pools: z.array(univ3Pool),
  }),
});
