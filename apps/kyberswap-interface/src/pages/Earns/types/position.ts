import { NativeToken } from 'constants/networks/type'
import { Exchange } from 'pages/Earns/constants'
import { PAIR_CATEGORY, PoolAprInterval, ProgramType } from 'pages/Earns/types/pool'
import { TokenRewardInfo } from 'pages/Earns/types/reward'

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

export enum PositionStatus {
  IN_RANGE = 'IN_RANGE',
  OUT_RANGE = 'OUT_RANGE',
  CLOSED = 'CLOSED',
}

export const DEFAULT_PARSED_POSITION: ParsedPosition = {
  id: '',
  tokenId: '',
  stakingOwner: undefined,
  earningFeeYield: 0,
  pool: {
    fee: 0,
    address: '',
    isUniv2: false,
    isUniv4: false,
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
  apr: { '24h': 0, '7d': 0, all: 0 },
  kemEGApr: { '24h': 0, '7d': 0, all: 0 },
  kemLMApr: { '24h': 0, '7d': 0, all: 0 },
  feeApr: { '24h': 0, '7d': 0, all: 0 },
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
  stakingOwner?: string
  earningFeeYield: number
  pool: {
    fee: number
    address: string
    isUniv2: boolean
    isUniv4: boolean
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
  providedAmounts: Array<PositionAmount>
  feePending: Array<PositionAmount>
  feesClaimed: Array<PositionAmount>
  createdTime: number
  stats: {
    apr: PoolAprInterval
    kemLMApr: PoolAprInterval
    kemEGApr: PoolAprInterval
    earning: PoolAprInterval
  }
  /** @deprecated */
  apr: number
  /** @deprecated */
  kemEGApr: number
  /** @deprecated */
  kemLMApr: number
  /** @deprecated */
  earning24h: number
  /** @deprecated */
  earning7d: number
  currentPositionValue: number
  status: PositionStatus
  pool: {
    id: string
    poolAddress: string
    price: number
    tokenAmounts: Array<PositionAmount>
    fees: Array<number>
    tickSpacing: number
    exchange: Exchange
    projectLogo: string
    category: PAIR_CATEGORY
    programs?: Array<ProgramType>
  }
  suggestionPool: SuggestedPool | null
  latestBlock: number
  createdAtBlock: number
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

export enum PositionHistoryType {
  DEPOSIT = 'DEPOSIT',
}
