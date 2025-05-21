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
  aprKem: number
  liquidity: number
  tvl: number
  chainId?: number
  favorite?: {
    chainId: number
    isFavorite: boolean
  }
  tokens: Array<{
    address: string
    logoURI: string
    symbol: string
  }>
}

export interface ParsedEarnPool extends EarnPool {
  dexLogo: string
  dexName: string
  aprFee: number
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
  aprKem: number
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
  farming: {
    unclaimedUsdValue: number
    pendingUsdValue: number
    claimableUsdValue: number
  }
  token0: Token
  token1: Token
  tokenAddress: string
  apr: number
  aprKem: number
  aprFee: number
  totalValue: number
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
  pendingUsdValue: number
  claimedUsdValue: number
  claimableUsdValue: number

  totalAmount: number
  claimableAmount: number

  chains: Array<{
    chainId: number
    totalUsdValue: number
    pendingUsdValue: number
    claimedUsdValue: number
    claimableUsdValue: number

    totalAmount: number
    claimableAmount: number

    nfts: Array<NftRewardInfo>
    claimableTokens: Array<TokenRewardInfo>
  }>
}

export interface NftRewardInfo {
  nftId: string
  totalUsdValue: number
  pendingUsdValue: number
  claimedUsdValue: number
  claimableUsdValue: number

  totalAmount: number
  claimableAmount: number

  tokens: Array<TokenRewardInfo>
}

export interface TokenRewardInfo {
  symbol: string
  logo: string
  chainId: number
  address: string
  totalAmount: number
  claimableAmount: number
  claimableUsdValue: number
}
