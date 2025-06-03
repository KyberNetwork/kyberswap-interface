import { PoolType as ZapInDex } from "@kyberswap/liquidity-widgets";
import { Dex as ZapMigrationDex } from "@kyberswap/zap-migration-widgets";
import { PoolType as ZapOutDex } from "@kyberswap/zap-out-widgets";
import { PoolType as PancakeZapInDex } from "@kyberswap/pancake-liquidity-widgets";

export const zapInDexMapping: Record<ZapInDex, string> = {
  [ZapInDex.DEX_UNISWAP_V4]: "Uniswap V4",
  [ZapInDex.DEX_KEM_UNISWAP_V4_FAIRFLOW]: "Uniswap V4 FairFlow",
  [ZapInDex.DEX_UNISWAPV3]: "Uniswap V3",
  [ZapInDex.DEX_PANCAKESWAPV3]: "PancakeSwap V3",
  [ZapInDex.DEX_METAVAULTV3]: "MetaVault V3",
  [ZapInDex.DEX_SUSHISWAPV3]: "SushiSwap V3",
  [ZapInDex.DEX_LINEHUBV3]: "LineHub V3",
  [ZapInDex.DEX_SWAPMODEV3]: "SwapMode V3",
  [ZapInDex.DEX_KOICL]: "KOI CL",
  [ZapInDex.DEX_THRUSTERV3]: "Thruster V3",
  [ZapInDex.DEX_PANCAKESWAPV2]: "PancakeSwap V2",
  [ZapInDex.DEX_UNISWAPV2]: "Uniswap V2",
  [ZapInDex.DEX_SUSHISWAPV2]: "SushiSwap V2",
  [ZapInDex.DEX_QUICKSWAPV2]: "QuickSwap V2",
  [ZapInDex.DEX_THRUSTERV2]: "Thruster V2",
  [ZapInDex.DEX_SWAPMODEV2]: "SwapMode V2",
  [ZapInDex.DEX_THENAFUSION]: "Thena",
  [ZapInDex.DEX_CAMELOTV3]: "Camelot V3",
  [ZapInDex.DEX_QUICKSWAPV3ALGEBRA]: "QuickSwap",
  [ZapInDex.DEX_PANGOLINSTANDARD]: "Pangolin Standard",
  [ZapInDex.DEX_KODIAK_V3]: "Kodiak V3",
  [ZapInDex.DEX_KODIAK_V2]: "Kodiak V2",
  [ZapInDex.DEX_SQUADSWAP_V3]: "Squad Swap V3",
  [ZapInDex.DEX_SQUADSWAP_V2]: "Squad Swap V2",
};

export const zapMigrationDexMapping: Record<ZapMigrationDex, string> = {
  [ZapMigrationDex.DEX_UNISWAP_V4]: "Uniswap V4",
  [ZapMigrationDex.DEX_KEM_UNISWAP_V4_FAIRFLOW]: "Uniswap V4 FairFlow",
  [ZapMigrationDex.DEX_UNISWAPV3]: "Uniswap V3",
  [ZapMigrationDex.DEX_PANCAKESWAPV3]: "PancakeSwap V3",
  [ZapMigrationDex.DEX_METAVAULTV3]: "MetaVault V3",
  [ZapMigrationDex.DEX_SUSHISWAPV3]: "SushiSwap V3",
  [ZapMigrationDex.DEX_LINEHUBV3]: "LineHub V3",
  [ZapMigrationDex.DEX_SWAPMODEV3]: "SwapMode V3",
  [ZapMigrationDex.DEX_KOICL]: "KOI CL",
  [ZapMigrationDex.DEX_THRUSTERV3]: "Thruster V3",
  [ZapMigrationDex.DEX_UNISWAPV2]: "Uniswap V2",
  [ZapMigrationDex.DEX_KODIAK_V3]: "Kodiak V3",
  [ZapMigrationDex.DEX_SQUADSWAP_V3]: "Squad Swap V3",
  [ZapMigrationDex.DEX_SQUADSWAP_V2]: "Squad Swap V2",
  [ZapMigrationDex.DEX_THENAFUSION]: "Thena",
  [ZapMigrationDex.DEX_CAMELOTV3]: "Camelot V3",
  [ZapMigrationDex.DEX_QUICKSWAPV3ALGEBRA]: "QuickSwap",
};

export const zapOutDexMapping: Record<ZapOutDex, string> = {
  [ZapOutDex.DEX_UNISWAP_V4]: "Uniswap V4",
  [ZapOutDex.DEX_KEM_UNISWAP_V4_FAIRFLOW]: "Uniswap V4 FairFlow",
  [ZapOutDex.DEX_UNISWAPV3]: "Uniswap V3",
  [ZapOutDex.DEX_PANCAKESWAPV3]: "PancakeSwap V3",
  [ZapOutDex.DEX_METAVAULTV3]: "MetaVault V3",
  [ZapOutDex.DEX_SUSHISWAPV3]: "SushiSwap V3",
  [ZapOutDex.DEX_LINEHUBV3]: "LineHub V3",
  [ZapOutDex.DEX_SWAPMODEV3]: "SwapMode V3",
  [ZapOutDex.DEX_KOICL]: "KOI CL",
  [ZapOutDex.DEX_THRUSTERV3]: "Thruster V3",
  [ZapOutDex.DEX_PANCAKESWAPV2]: "PancakeSwap V2",
  [ZapOutDex.DEX_UNISWAPV2]: "Uniswap V2",
  [ZapOutDex.DEX_SUSHISWAPV2]: "SushiSwap V2",
  [ZapOutDex.DEX_QUICKSWAPV2]: "QuickSwap V2",
  [ZapOutDex.DEX_THRUSTERV2]: "Thruster V2",
  [ZapOutDex.DEX_SWAPMODEV2]: "SwapMode V2",
  [ZapOutDex.DEX_THENAFUSION]: "Thena",
  [ZapOutDex.DEX_CAMELOTV3]: "Camelot V3",
  [ZapOutDex.DEX_QUICKSWAPV3ALGEBRA]: "QuickSwap",
  [ZapOutDex.DEX_PANGOLINSTANDARD]: "Pangolin Standard",
  [ZapOutDex.DEX_KODIAK_V3]: "Kodiak V3",
  [ZapOutDex.DEX_KODIAK_V2]: "Kodiak V2",
  [ZapOutDex.DEX_SQUADSWAP_V3]: "Squad Swap V3",
  [ZapOutDex.DEX_SQUADSWAP_V2]: "Squad Swap V2",
};

export const pancakeZapInDexMapping: Record<PancakeZapInDex, string> = {
  [PancakeZapInDex.DEX_PANCAKESWAPV3]: "PancakeSwap V3",
  [PancakeZapInDex.DEX_PANCAKE_INFINITY_CL]: "Infinity CL",
};