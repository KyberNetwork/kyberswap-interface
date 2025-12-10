import { Exchange } from 'pages/Earns/constants'

export enum DexType {
  DexTypeUniswapV3 = 'DexTypeUniswapV3',
  DexTypeUniswapV4 = 'DexTypeUniswapV4',
  DexTypeUniswapV4FairFlow = 'DexTypeUniswapV4FairFlow',
  DexTypePancakeV3 = 'DexTypePancakeV3',
  DexTypePancakeInfinityCL = 'DexTypePancakeInfinityCL',
  DexTypePancakeInfinityCLFairFlow = 'DexTypePancakeInfinityCLFairFlow',
}

export enum SmartExitState {
  IDLE = 'idle',
  CREATING = 'creating',
  SUCCESS = 'success',
  ERROR = 'error',
}

export const DEX_TYPE_MAPPING: Partial<Record<Exchange, DexType>> = {
  [Exchange.DEX_UNISWAPV3]: DexType.DexTypeUniswapV3,
  [Exchange.DEX_UNISWAP_V4]: DexType.DexTypeUniswapV4,
  [Exchange.DEX_UNISWAP_V4_FAIRFLOW]: DexType.DexTypeUniswapV4FairFlow,
  [Exchange.DEX_PANCAKESWAPV3]: DexType.DexTypePancakeV3,
  [Exchange.DEX_PANCAKE_INFINITY_CL]: DexType.DexTypePancakeInfinityCL,
  [Exchange.DEX_PANCAKE_INFINITY_CL_FAIRFLOW]: DexType.DexTypePancakeInfinityCLFairFlow,
}
