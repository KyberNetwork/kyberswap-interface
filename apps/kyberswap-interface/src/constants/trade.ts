import { ChainId, Percent } from '@kyberswap/ks-sdk-core'
import JSBI from 'jsbi'

export const ONE_BIPS = new Percent(JSBI.BigInt(1), JSBI.BigInt(10000))
export const BIPS_BASE = JSBI.BigInt(10000)
export const RESERVE_USD_DECIMALS = 100

export enum PAIR_CATEGORY {
  STABLE = 'stablePair',
  CORRELATED = 'correlatedPair',
  EXOTIC = 'exoticPair',
  HIGH_VOLATILITY = 'highVolatilityPair',
}

export const MAX_NORMAL_SLIPPAGE_IN_BIPS = 2000
export const MAX_DEGEN_SLIPPAGE_IN_BIPS = 5000

export const DEFAULT_SLIPPAGES = [5, 10, 50, 100]
export const DEFAULT_SLIPPAGES_HIGH_VOLATILITY = [50, 150, 300, 500]
export const DEFAULT_TIPS = [0, 10, 30, 50]
export const MAX_FEE_IN_BIPS = 2000

export const CHAINS_SUPPORT_FEE_CONFIGS: ChainId[] = []
