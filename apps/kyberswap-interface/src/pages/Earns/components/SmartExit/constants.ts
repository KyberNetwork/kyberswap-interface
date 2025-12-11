import { TIMES_IN_SECS } from 'constants/index'
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

// Smart Exit Constants
export const FOREVER_YEARS = 50
export const FOREVER_EXPIRE_TIME = TIMES_IN_SECS.ONE_DAY * 365 * FOREVER_YEARS

// Standard expire time presets (in seconds)
export const EXPIRE_TIME_PRESETS = {
  SEVEN_DAYS: 7 * TIMES_IN_SECS.ONE_DAY,
  THIRTY_DAYS: 30 * TIMES_IN_SECS.ONE_DAY,
  NINETY_DAYS: 90 * TIMES_IN_SECS.ONE_DAY,
  FOREVER: FOREVER_EXPIRE_TIME,
} as const

// Gas multiplier presets
export const GAS_MULTIPLIER_PRESETS = [1, 1.5, 2, 3] as const

// Fee yield presets (in percentage)
export const FEE_YIELD_PRESETS = [5, 10, 15, 20] as const
