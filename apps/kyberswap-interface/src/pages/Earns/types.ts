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
    project: string
    projectLogo: string
  }
}

export interface ParsedPosition {
  id: string
  pool: {
    fee: number
    address: string
  }
  dex: {
    id: string
    logo: string
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
  token0: Token
  token1: Token
  tokenAddress: string
  apr: number
  totalValue: number
  status: string
  createdTime: number
}

interface Token {
  address: string
  symbol: string
  decimals: number
  logo: string
  price: number
  totalAmount: number
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
