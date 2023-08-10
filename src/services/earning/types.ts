import { ChainId } from '@kyberswap/ks-sdk-core'

import { ClassicPoolData } from 'pages/MyEarnings/hooks'

export type TokenEarning = {
  token: string
  amount: string
  decimals: string
  amountUSD: string
  amountFloat: string
}

export type HistoricalSingleData = {
  day: number
  block: number
  fees: Array<TokenEarning> | null
  rewards: Array<TokenEarning> | null
  total: Array<TokenEarning> | null
}

export type PoolDetails = {
  id: string
  token0: {
    id: string
    symbol: string
    name: string
    decimals: string
  }
  token1: {
    id: string
    symbol: string
    name: string
    decimals: string
  }
  feeTier: string
  liquidity: string
  reinvestL: string
  sqrtPrice: string
  tick: string
  volumeUsd: string
  feesUsd: string
  totalValueLockedUsd: string
  feesUsdOneDayAgo: string
  volumeUsdOneDayAgo: string
  totalValueLockedUsdInRange: string
  apr: string
  farmApr: string
}

export type HistoricalEarning = {
  historicalEarning: HistoricalSingleData[]
}

export type ElasticPoolEarningWithDetails = PoolDetails & HistoricalEarning

export type ElasticPositionEarningWithDetails = {
  id: string
  owner: string
  ownerOriginal: string
  pool: PoolDetails
  token0: string
  token1: string
  tickLower: string
  tickUpper: string
  liquidity: string
  feeGrowthInsideLast: string
  lastCollectedFeeAt: string
  lastHarvestedFarmRewardAt: string
  pendingFee0: string
  pendingFee1: string
  pendingFeeUSD: string
  pendingRewardUSD: string
  myPoolApr?: string
  myFarmApr?: string
  depositedPosition?: {
    farm: string
  }
  joinedPositions?: {
    farmId: string
    farmingPool: {
      rewardTokensIds: string[]
    }
    pendingRewards: string[]
    pid: string
    pendingRewardUSD: string[]
    liquidity: string
  }[]
} & HistoricalEarning

export type ClassicPositionEarningWithDetails = {
  id: string
  ownerOriginal: string
  liquidityTokenBalance: string
  liquidityTokenBalanceIncludingStake: string
  pool: ClassicPoolData
} & HistoricalEarning

export type ClassicPoolEarningWithDetails = ClassicPositionEarningWithDetails

export type MetaResponse<T> = {
  code: number
  message: string
  data?: T
}

export type GetElasticEarningResponse = Record<
  string,
  {
    positions: ElasticPositionEarningWithDetails[]
    pools: ElasticPoolEarningWithDetails[]
    account: HistoricalSingleData[]
  }
>

export type GetElasticEarningParams = {
  account: string
  chainIds: ChainId[]
}

export type GetClassicEarningResponse = Record<
  string,
  {
    positions: ClassicPositionEarningWithDetails[]
    account: HistoricalSingleData[]
  }
>

export type GetClassicEarningParams = {
  account: string
  chainIds: ChainId[]
}
