export enum PositionStatus {
  IN_RANGE = 'IN_RANGE',
  OUT_RANGE = 'OUT_RANGE',
}

export enum PositionHistoryType {
  DEPOSIT = 'DEPOSIT',
}

export interface PositionFilter {
  chainIds?: string
  positionId?: string
  protocols?: string
  status?: string
  q?: string
  sortBy?: string
  orderBy?: string
  page: number
}

export interface EarnPool {
  address: string
  earnFee: number
  exchange: string
  type: string
  feeTier: number
  volume: number
  apr: number
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

export interface EarnPosition {
  [x: string]: any
  chainName: 'eth'
  chainId: number
  chainLogo: string
  userAddress: string
  id: string
  tokenAddress: string
  tokenId: string
  liquidity: string
  minPrice: number
  maxPrice: number
  currentAmounts: Array<PositionAmount>
  providedAmounts: Array<PositionAmount>
  feePending: Array<PositionAmount>
  feesClaimed: Array<PositionAmount>
  farmRewardsPending: Array<PositionAmount>
  farmRewardsClaimed: Array<PositionAmount>
  feeEarned24h: Array<PositionAmount>
  farmReward24h: Array<PositionAmount>
  createdTime: number
  lastUpdateBlock: number
  openedBlock: number
  openedTime: number
  closedBlock: number
  closedTime: number
  closedPrice: number
  farming: boolean
  impermanentLoss: number
  apr: number
  feeApr: number
  farmApr: number
  pnl: number
  initialUnderlyingValue: number
  currentUnderlyingValue: number
  currentPositionValue: number
  compareWithHodl: number
  returnOnInvestment: number
  totalDepositValue: number
  totalWithdrawValue: number
  yesterdayEarning: number
  earning24h: number
  earning7d: number
  status: PositionStatus
  avgConvertPrice: number
  isConvertedFromToken0: boolean
  gasUsed: number
  isSupportAutomation: boolean
  hasAutomationOrder: boolean
  pool: {
    id: string
    poolAddress: string
    price: number
    tokenAmounts: Array<PositionAmount>
    farmRewardTokens: Array<PositionAmount>
    fees: Array<number>
    rewards24h: Array<PositionAmount>
    tickSpacing: number
    project: string
    projectLogo: string
    projectAddress: string
    showWarning: boolean
    tvl: number
    farmAddress: string
    tag: string
  }
}

export interface ParsedPosition {
  id: string
  dex: string
  dexImage: string
  chainId: number
  chainName: string
  chainLogo: string
  poolAddress: string
  tokenAddress: string
  token0Address: string
  token1Address: string
  token0Logo: string
  token1Logo: string
  token0Symbol: string
  token1Symbol: string
  token0Decimals: number
  token1Decimals: number
  token0Price: number
  token1Price: number
  poolFee: number
  status: string
  totalValue: number
  apr: number
  token0TotalAmount: number
  token1TotalAmount: number
  minPrice: number
  maxPrice: number
  pairRate: number
  earning24h: number
  earning7d: number
  totalEarnedFee: number
  createdTime: number
}

interface PositionAmount {
  token: {
    address: string
    symbol: string
    name: string
    decimals: number
    logo: string
    tag: string
    price: number
  }
  tokenType: string
  tokenID: string
  balance: string
  quotes: {
    usd: {
      symbol: string
      marketPrice: number
      price: number
      priceChange24hPercentage: number
      value: number
      timestamp: number
    }
  }
}
