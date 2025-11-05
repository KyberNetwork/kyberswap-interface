import { Exchange } from 'pages/Earns/constants'

export enum ProgramType {
  EG = 'eg',
  LM = 'lm',
}

export enum PAIR_CATEGORY {
  STABLE = 'stablePair',
  CORRELATED = 'correlatedPair',
  EXOTIC = 'exoticPair',
  HIGH_VOLATILITY = 'highVolatilityPair',
  DEFAULT_EMPTY = '', // For Krystal data
}

export interface EarnPool {
  address: string
  earnFee: number
  exchange: Exchange
  type: string
  feeTier: number
  volume: number
  apr: number
  kemEGApr: number
  kemLMApr: number
  liquidity: number
  tvl: number
  chainId?: number
  favorite?: {
    chainId: number
    isFavorite: boolean
  }
  category?: PAIR_CATEGORY
  programs?: Array<ProgramType>
  tokens: Array<{
    address: string
    logoURI: string
    symbol: string
    decimals: number
  }>
  maxAprInfo?: {
    tickLower: number
    tickUpper: number
    minPrice: string
    maxPrice: string
    apr: string
    kemEGApr: string
    kemLMApr: string
  }
}

export interface ParsedEarnPool extends EarnPool {
  dexLogo: string
  dexName: string
  feeApr: number
}

export interface PoolAprInterval {
  '7d': number
  '24h': number
  all: number
}
