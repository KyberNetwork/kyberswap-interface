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
  allApr: number
  lpApr: number
  kemEGApr: number
  kemLMApr: number
  bonusApr?: number
  liquidity: number
  tvl: number
  chainId?: number
  favorite?: {
    chainId: number
    isFavorite: boolean
  }
  chain?: {
    id: number
    name: string
    logoUrl: string
  }
  category?: PAIR_CATEGORY
  programs?: Array<ProgramType>
  merklOpportunity?: MerklOpportunity
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
  egUsd?: number
}

export interface ParsedEarnPool extends EarnPool {
  dexLogo: string
  dexName: string
}

export interface MerklOpportunity {
  type: string
  chainId: number
  identifier: string
  status: string
  action: string
  tvl: number
  apr: number
  dailyRewards: number
  depositUrl: string
  liveCampaigns: number
  protocol: {
    id: string
    name: string
  }
  rewardsRecord: {
    total: number
    timestamp: string | number
    breakdowns: Array<{
      token: {
        name: string
        chainId: number
        address: string
        decimals: number
        symbol: string
        displaySymbol: string
        verified: boolean
        isTest: boolean
        type: string
        isNative: boolean
        price: number
        updatedAt: number
        priceSource: string
      }
      amount: string
      value: number
      campaignId: string
      distributionType: string
      timestamp: string | number
    }>
  }
  campaigns: Array<{
    id: string
    startTimestamp: number
    endTimestamp: number
    apr: number
  }>
}
