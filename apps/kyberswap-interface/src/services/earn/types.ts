import type { ChainId } from '@kyberswap/ks-sdk-core'

import type { Exchange } from 'pages/Earns/constants'
import type { EarnPool, KemReward, MerklOpportunity, PositionHistoryType } from 'pages/Earns/types'

export interface LandingResponse {
  data: {
    farmingPools: Array<EarnPool>
    highlightedPools: Array<EarnPool>
    solidEarning: Array<EarnPool>
    highAPR: Array<EarnPool>
    lowVolatility: Array<EarnPool>
  }
}

export interface SupportedProtocolsResponse {
  code: number
  message: string
  data: {
    chains: {
      [chainId: string]: {
        chainId: number
        protocols: Array<{ id: string; name: string }>
      }
    }
  }
  requestId: string
}

export interface PoolQueryParams {
  chainId?: number
  chainIds?: string
  page?: number
  limit?: number
  interval?: string
  protocol: string
  rewardType?: string
  userAddress?: string
  tag?: string
  sortBy?: string
  orderBy?: string
  q?: string
}

export interface PoolQueryResponse {
  code: number
  message: string
  data: {
    pools: Array<EarnPool>
    pagination: {
      totalItems: number
    }
  }
  requestId: string
}

export type PoolStatsPeriod = '1d' | '7d' | '30d'

export type PoolStatsByPeriod = Partial<Record<PoolStatsPeriod, number>>

export interface PoolDetailToken {
  address: string
  name: string
  symbol: string
  logoURI?: string
  decimals: number
  weight: number
  swappable: boolean
  isStable?: boolean
}

export interface PoolDetailTick {
  index: number
  liquidityGross: string
  liquidityNet: string
}

export interface PoolDetailPositionInfo {
  liquidity: string
  sqrtPriceX96: string
  tickSpacing: number
  tick: number
  ticks: Array<PoolDetailTick>
}

export interface PoolAprStats {
  all?: PoolStatsByPeriod
  lp?: PoolStatsByPeriod
  kemLM?: PoolStatsByPeriod
  kemEG?: PoolStatsByPeriod
}

export interface PoolDetailStats {
  tvl?: number
  volume24h?: number
  fees24h?: number
  volumeUsd?: PoolStatsByPeriod
  lpFeeUsd?: PoolStatsByPeriod

  apr?: number
  apr24h?: number
  apr30d?: number
  activeApr?: number

  bonusApr?: number
  kemEGApr?: number
  kemLMApr?: number
  activeEgApr?: number
  activeLmApr?: number
  activeFeeApr?: number

  allApr24h?: number
  allApr7d?: number
  allApr30d?: number

  lpApr24h?: number
  lpApr7d?: number
  lpApr30d?: number

  kemLMApr24h?: number
  kemLMApr7d?: number
  kemLMApr30d?: number

  kemEGApr24h?: number
  kemEGApr7d?: number
  kemEGApr30d?: number

  aprStats?: PoolAprStats
}

export interface PoolDetail {
  address: string
  exchange: Exchange
  swapFee: number
  reserveUsd: string
  amplifiedTvl: string

  reserves: Array<string>
  tokens: Array<PoolDetailToken>
  poolStats?: PoolDetailStats
  egUsd?: number
  kemReward?: KemReward
  merklOpportunity?: MerklOpportunity
  positionInfo: PoolDetailPositionInfo

  type?: string
  programs?: string[]
  timestamp?: number
  blockNumber?: number
  staticExtra?: string
}

export type PoolAnalyticsWindow = '24h' | '7d' | '30d'

export type EstimatePositionAprParams = {
  chainId: number
  poolAddress: string
  tickLower: number
  tickUpper: number
  positionLiquidity: string
  positionTvl?: string
}

export type EstimatePositionAprResponse = {
  data: {
    feeApr: number
    egApr: number
    lmApr: number
  }
}

export interface PoolChartQueryParams {
  chainId: number
  address: string
  window: PoolAnalyticsWindow
}

export interface PositionChartQueryParams {
  chainId: number
  positionId: string
  window: PoolAnalyticsWindow
}

export interface PoolAprHistoryPoint {
  ts: number
  feeApr: number
  lmApr: number
  egApr: number
  bonusApr: number
  totalApr: number
  activeApr?: number
  activeFeeApr?: number
  activeLmApr?: number
  activeEgApr?: number
  tvlUsd: number
  volumeUsd: number
  open: number
  high: number
  low: number
  close: number
}

export interface PoolAprHistoryData {
  chainId: number
  poolAddress: string
  window?: PoolAnalyticsWindow
  points: Array<PoolAprHistoryPoint>
}

export interface PoolPriceCandle {
  ts: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface PoolPriceData {
  window: PoolAnalyticsWindow
  candles: Array<PoolPriceCandle>
  currentPrice: number
  priceChange: number
  priceInToken: string
}

export interface PoolLiquidityFlowBucket {
  ts: number
  addUsd: number
  removeUsd: number
  tvlUsd: number
}

export interface PoolLiquidityFlowsData {
  window: PoolAnalyticsWindow
  buckets: Array<PoolLiquidityFlowBucket>
}

export interface PoolEarningsBucket {
  ts: number
  lpFeeUsd: number
  lmUsd: number
  egUsd: number
  bonusUsd?: number
  totalUsd: number
}

export interface PoolEarningsData {
  window: PoolAnalyticsWindow
  buckets: Array<PoolEarningsBucket>
}

export interface PositionQueryParams {
  wallet: string
  chainIds?: string
  protocols?: string
  keyword?: string
  positionIds?: string
  statuses?: string
  sortBy?: string
  orderBy?: string
  // Combined `${sortBy}:${orderBy}` param actually sent to the API (sortBy/orderBy above are unused).
  sorts?: string
  page?: number
  pageSize?: number
  useOnFly?: boolean
}

export interface PositionHistoryParams {
  chainId: ChainId
  tokenAddress: string
  tokenId: string
  userAddress?: string
}

export interface PositionHistoryTransaction {
  tokenIndex: number
  tokenWithValue: {
    token: {
      symbol: string
      address: string
      logo: string
      decimals: number
      name: string
    }
    balance: string
    price: number
    value: number
  }
}

export interface PositionHistory {
  txHash: string
  type: PositionHistoryType | string
  blockTime: number
  emitContractAddress: string
  gasFeeAmount: number
  gasFeeValue: number
  transactions: PositionHistoryTransaction[]
}

export interface AddRemoveFavoriteParams {
  chainId: ChainId
  message: string
  signature: string
  poolAddress: string
  userAddress: string
}
