import { NativeToken } from 'constants/networks/type'
import { Exchange } from 'pages/Earns/constants'
import { MerklOpportunity, PAIR_CATEGORY } from 'pages/Earns/types/pool'
import { TokenRewardInfo } from 'pages/Earns/types/reward'

export enum PositionStatus {
  IN_RANGE = 'PositionStatusInRange',
  OUT_RANGE = 'PositionStatusOutRange',
  CLOSED = 'PositionStatusClosed',
}

export enum PositionHistoryType {
  DEPOSIT = 'DEPOSIT',
}

export interface PositionFilter {
  chainIds?: string
  positionId?: string
  protocols?: string
  statuses: string
  keyword?: string
  sorts?: string
  sortBy?: string
  orderBy?: string
  page: number
  pageSize?: number
}

export interface UserPositionsApiResponse {
  code: number
  message: string
  data: {
    positions: UserPosition[]
    stats: UserPositionsStats
  }
  requestId: string
}

export interface UserPositionsStats {
  totalItems: number
  totalValueUsd: number
  totalClaimedFeeUsd: number
  totalEarnedFeeUsd: number
  totalUnclaimedFeeUsd: number
  totalClaimedRewardUsd: number
  totalUnclaimedRewardUsd: number
  totalPendingRewardUsd: number
}

export interface UserPosition {
  chain: {
    name: string
    logo: string
    id: number
  }
  tokenId: number
  tokenAddress: string
  positionId: string
  wallet: string
  liquidity: string
  status: PositionStatus
  stats: PositionStats
  currentAmounts: TokenAmount[]
  providedAmounts: TokenAmount[]
  pool: PositionPool
  suggestionPool: SuggestedPool | null
  valueInUSD: number
  createdAtTime: number
  lastUpdatedAt: number
  createdAtBlock: number
  latestBlock: number
  extra: {
    priceRange: {
      min: number
      maxPrice: number
    }
  }
  id: number
}

export interface PositionStats {
  apr: {
    all: TimeIntervalValues
    reward: {
      lm: TimeIntervalValues
      eg: TimeIntervalValues
    }
    lp: TimeIntervalValues
  }
  earning: {
    totalUsd: TimeIntervalValues
    fee: {
      unclaimed: TokenAmount[]
      claimed: TokenAmount[]
    }
    reward: any | null
  }
}

export interface TimeIntervalValues {
  '24h': number
  '7d': number
  '30d': number
}

export interface TokenAmount {
  amount: {
    usdValue: number
    priceUsd: number
    amount: string
  }
  token: {
    logo: string
    symbol: string
    name: string
    decimals: number
    address: string
  }
}

export interface PositionPool {
  id: string
  address: string
  price: number
  tokenAmounts: TokenAmount[]
  fees: number[]
  programs: string[]
  tickSpacing: number
  protocol: {
    type: Exchange
    logo: string
    name: string
  }
  category: string
  hooks: string
  merklOpportunity?: MerklOpportunity
}

export const DEFAULT_PARSED_POSITION: ParsedPosition = {
  positionId: '',
  tokenId: '',
  pool: {
    fee: 0,
    address: '',
    isUniv2: false,
    isFarming: false,
    isFarmingLm: false,
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
    id: Exchange.DEX_UNISWAPV3,
    name: 'Uniswap V3',
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
    waitingUsdValue: 0,
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
  apr: { '24h': 0, '7d': 0, '30d': 0, all: 0 },
  kemEGApr: { '24h': 0, '7d': 0, '30d': 0, all: 0 },
  kemLMApr: { '24h': 0, '7d': 0, '30d': 0, all: 0 },
  feeApr: { '24h': 0, '7d': 0, '30d': 0, all: 0 },
  bonusApr: 0,
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
  positionId: string
  tokenId: string
  pool: {
    fee: number
    address: string
    isUniv2: boolean
    isFarming: boolean
    isFarmingLm: boolean
    nativeToken: NativeToken
    tickSpacing: number
    category: PAIR_CATEGORY
  }
  dex: {
    id: Exchange
    name: string
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
    waitingUsdValue: number
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
  apr: PoolAprInterval
  kemEGApr: PoolAprInterval
  kemLMApr: PoolAprInterval
  feeApr: PoolAprInterval
  bonusApr: number
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
  feeTier: number
  exchange: Exchange
  token0: {
    address: string
    decimals: number
  }
  token1: {
    address: string
    decimals: number
  }
}

export interface PoolAprInterval {
  '7d': number
  '24h': number
  '30d'?: number
  all?: number // Legacy field for backward compatibility
}

export interface Token {
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
