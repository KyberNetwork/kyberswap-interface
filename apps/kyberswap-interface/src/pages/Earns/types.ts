import { NativeToken } from 'constants/networks/type'
import { EarnDex, Exchange } from 'pages/Earns/constants'

export enum PositionStatus {
  IN_RANGE = 'IN_RANGE',
  OUT_RANGE = 'OUT_RANGE',
  CLOSED = 'CLOSED',
}

export enum PositionHistoryType {
  DEPOSIT = 'DEPOSIT',
}

export enum ProgramType {
  EG = 'eg',
  LM = 'lm',
}

export interface PositionFilter {
  chainIds?: string
  positionId?: string
  protocols?: string
  status: string
  q?: string
  sortBy?: string
  orderBy?: string
  page: number
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
  programs?: Array<ProgramType>
  tokens: Array<{
    address: string
    logoURI: string
    symbol: string
  }>
}

export interface ParsedEarnPool extends EarnPool {
  dexLogo: string
  dexName: string
  feeApr: number
}

export interface EarnPosition {
  [x: string]: any
  chainName: 'eth'
  chainId: number
  chainLogo: string
  id: string
  tokenAddress: string
  tokenId: string
  minPrice: number
  maxPrice: number
  currentAmounts: Array<PositionAmount>
  feePending: Array<PositionAmount>
  feesClaimed: Array<PositionAmount>
  createdTime: number
  apr: number
  kemEGApr: number
  kemLMApr: number
  currentPositionValue: number
  earning24h: number
  earning7d: number
  status: PositionStatus
  pool: {
    id: string
    poolAddress: string
    price: number
    tokenAmounts: Array<PositionAmount>
    fees: Array<number>
    tickSpacing: number
    project: EarnDex
    projectLogo: string
    category: PAIR_CATEGORY
    programs?: Array<ProgramType>
  }
  suggestionPool: {
    address: string
    chainId: number
    feeTier: number
    poolExchange: Exchange
  } | null
}

export interface ParsedPosition {
  id: string
  tokenId: string
  pool: {
    fee: number
    address: string
    isUniv2: boolean
    isFarming: boolean
    nativeToken: NativeToken
    tickSpacing: number
    category: PAIR_CATEGORY
  }
  dex: {
    id: EarnDex
    logo: string
    version: string
  }
  chain: {
    id: number
    name: string
    logo: string
  }
  priceRange: {
    min: number
    max: number
    current: number
  }
  earning: {
    earned: number
    in7d: number
    in24h: number
  }
  rewards: {
    totalUsdValue: number
    claimedUsdValue: number
    unclaimedUsdValue: number
    inProgressUsdValue: number
    pendingUsdValue: number
    vestingUsdValue: number
    claimableUsdValue: number
    egTokens: Array<TokenRewardInfo>
    lmTokens: Array<TokenRewardInfo>
    tokens: Array<TokenRewardInfo>
  }
  totalValueTokens: Array<{
    address: string
    symbol: string
    amount: number
  }>
  token0: Token
  token1: Token
  tokenAddress: string
  apr: number
  kemEGApr: number
  kemLMApr: number
  feeApr: number
  totalValue: number
  totalProvidedValue: number
  status: string
  createdTime: number
  unclaimedFees: number
  suggestionPool: {
    address: string
    chainId: number
    feeTier: number
    poolExchange: Exchange
  } | null
}

interface Token {
  address: string
  symbol: string
  decimals: number
  logo: string
  price: number
  totalAmount: number
  isNative: boolean
  totalProvide: number
  unclaimedAmount: number
  unclaimedBalance: number
  unclaimedValue: number
}

interface PositionAmount {
  token: {
    address: string
    symbol: string
    name: string
    decimals: number
    logo: string
    price: number
  }
  balance: string
  quotes: {
    usd: {
      price: number
      value: number
    }
  }
}

export enum PAIR_CATEGORY {
  STABLE = 'stablePair',
  CORRELATED = 'correlatedPair',
  EXOTIC = 'exoticPair',
  HIGH_VOLATILITY = 'highVolatilityPair',
  DEFAULT_EMPTY = '', // For Krystal data
}

export interface FeeInfo {
  balance0: string | number
  balance1: string | number
  amount0: string | number
  amount1: string | number
  value0: number
  value1: number
  totalValue: number
}

export interface RewardInfo {
  totalUsdValue: number
  claimableUsdValue: number
  nfts: Array<NftRewardInfo>
  chains: Array<ChainRewardInfo>
}

export interface ChainRewardInfo {
  chainId: number
  chainName: string
  chainLogo: string
  claimableUsdValue: number
  tokens: Array<TokenRewardInfo>
}

export interface NftRewardInfo {
  nftId: string
  chainId: number
  totalUsdValue: number
  claimedUsdValue: number
  inProgressUsdValue: number
  pendingUsdValue: number
  vestingUsdValue: number
  claimableUsdValue: number
  unclaimedUsdValue: number

  tokens: Array<TokenRewardInfo>
  egTokens: Array<TokenRewardInfo>
  lmTokens: Array<TokenRewardInfo>
}

export interface TokenRewardInfo {
  symbol: string
  logo: string
  address: string
  chainId: number

  totalAmount: number
  claimableAmount: number
  unclaimedAmount: number
  pendingAmount: number
  vestingAmount: number
  claimableUsdValue: number
}

export interface TokenInfo {
  address: string
  symbol: string
  logo: string
  decimals: number
  chainId: number
}
