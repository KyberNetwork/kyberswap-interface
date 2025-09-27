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

export interface SmartExitFilter {
  chainIds?: string
  status?: string
  protocols?: string
  page: number
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
  suggestionPool: SuggestedPool | null
  latestBlock: number
  createdAtBlock: number
}

export enum PAIR_CATEGORY {
  STABLE = 'stablePair',
  CORRELATED = 'correlatedPair',
  EXOTIC = 'exoticPair',
  HIGH_VOLATILITY = 'highVolatilityPair',
  DEFAULT_EMPTY = '', // For Krystal data
}

export const DEFAULT_PARSED_POSITION: ParsedPosition = {
  id: '',
  tokenId: '',
  pool: {
    fee: 0,
    address: '',
    isUniv2: false,
    isFarming: false,
    nativeToken: {
      symbol: '',
      decimal: 18,
      name: '',
      logo: '',
    },
    tickSpacing: 0,
    category: PAIR_CATEGORY.DEFAULT_EMPTY,
  },
  dex: {
    id: EarnDex.DEX_UNISWAPV3,
    logo: '',
    version: '',
  },
  chain: {
    id: 1,
    name: 'Ethereum',
    logo: '',
  },
  priceRange: {
    min: 0,
    max: 0,
    isMinPrice: false,
    isMaxPrice: false,
    current: 0,
  },
  earning: {
    earned: 0,
    in7d: 0,
    in24h: 0,
  },
  rewards: {
    totalUsdValue: 0,
    claimedUsdValue: 0,
    unclaimedUsdValue: 0,
    inProgressUsdValue: 0,
    pendingUsdValue: 0,
    vestingUsdValue: 0,
    claimableUsdValue: 0,
    egTokens: [],
    lmTokens: [],
    tokens: [],
  },
  totalValueTokens: [],
  token0: {
    address: '',
    symbol: '',
    decimals: 18,
    logo: '',
    price: 0,
    isNative: false,
    totalProvide: 0,
    unclaimedAmount: 0,
    unclaimedBalance: 0,
    unclaimedValue: 0,
  },
  token1: {
    address: '',
    symbol: '',
    decimals: 18,
    logo: '',
    price: 0,
    isNative: false,
    totalProvide: 0,
    unclaimedAmount: 0,
    unclaimedBalance: 0,
    unclaimedValue: 0,
  },
  tokenAddress: '',
  apr: 0,
  kemEGApr: 0,
  kemLMApr: 0,
  feeApr: 0,
  totalValue: 0,
  totalProvidedValue: 0,
  status: PositionStatus.IN_RANGE,
  createdTime: 0,
  unclaimedFees: 0,
  suggestionPool: null,
  isUnfinalized: false,
  isValueUpdating: false,
  txHash: '',
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
    isMinPrice: boolean
    isMaxPrice: boolean
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
  suggestionPool: SuggestedPool | null
  isUnfinalized: boolean
  isValueUpdating: boolean
  txHash?: string
}

export interface SuggestedPool {
  address: string
  // chainId: number
  feeTier: number
  poolExchange: Exchange
  token0: {
    decimals: number
  }
  token1: {
    decimals: number
  }
}

interface Token {
  address: string
  symbol: string
  decimals: number
  logo: string
  price: number
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
  totalLmUsdValue: number
  totalEgUsdValue: number
  claimableUsdValue: number
  claimedUsdValue: number
  inProgressUsdValue: number
  pendingUsdValue: number
  vestingUsdValue: number
  nfts: Array<NftRewardInfo>
  chains: Array<ChainRewardInfo>
  tokens: Array<TokenRewardInfo>
  egTokens: Array<TokenRewardInfo>
  lmTokens: Array<TokenRewardInfo>
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
  totalLmUsdValue: number
  totalEgUsdValue: number
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
