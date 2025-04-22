import { PoolType } from "@/schema/protocol";

export const dexMapping: Record<PoolType, string[]> = {
  [PoolType.DEX_UNISWAP_V4]: ["uniswap-v4"],

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

export const dexValues = Object.values(dexMapping).flat(); 