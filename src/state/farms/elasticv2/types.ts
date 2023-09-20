import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Pool, Position } from '@kyberswap/ks-sdk-elastic'
import { BigNumber } from 'ethers'

export interface ElasticFarmV2Range {
  id: string
  index: number
  isRemoved: boolean
  tickUpper: number
  tickLower: number
  tickCurrent: number
  weight: number
  apr?: number
  createdAt: number
  updatedAt: number
}

export interface ElasticFarmV2 {
  id: string
  fId: number
  farmAddress: string
  startTime: number
  endTime: number
  isSettled: boolean
  pool: Pool
  poolAddress: string
  token0: Currency
  token1: Currency
  tvl: number
  totalRewards: Array<CurrencyAmount<Currency>>
  ranges: Array<ElasticFarmV2Range>
}

export interface UserFarmV2Info {
  farmAddress: string
  poolAddress: string
  nftId: BigNumber
  position: Position
  stakedPosition: Position
  fId: number
  rangeId: number
  liquidity: BigNumber
  stakedLiquidity: BigNumber
  unclaimedRewards: Array<CurrencyAmount<Currency>>
  positionUsdValue: number
  stakedUsdValue: number
  unclaimedRewardsUsd: number
}

export interface SubgraphToken {
  id: string
  name: string
  decimals: string
  symbol: string
}

export interface SubgraphFarmV2 {
  id: string
  startTime: string
  endTime: string
  isSettled: boolean
  liquidity: string
  stakedTvl?: string
  depositedPositions?: Array<{
    id: string
    position: {
      id: string
      liquidity: string
      tickLower: {
        tickIdx: string
      }
      tickUpper: {
        tickIdx: string
      }
      token0: SubgraphToken
      token1: SubgraphToken
    }
  }>

  pool: {
    id: string
    feeTier: string
    tick: string
    sqrtPrice: string
    liquidity: string
    reinvestL: string
    token0: SubgraphToken
    token1: SubgraphToken
  }
  rewards: Array<{
    id: string
    token: SubgraphToken
    amount: string
  }>
  ranges: Array<Omit<ElasticFarmV2Range, 'apr'>>
}
