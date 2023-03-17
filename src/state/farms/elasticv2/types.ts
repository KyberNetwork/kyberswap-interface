import { Currency, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
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
  tvl?: number
  apr?: number
}
export interface ElasticFarmV2 {
  id: string
  fId: number
  startTime: number
  endTime: number
  pool: Pool
  poolAddress: string
  token0: Token
  token1: Token
  totalRewards: Array<CurrencyAmount<Currency>>
  ranges: Array<ElasticFarmV2Range>
}

export interface UserFarmV2Info {
  poolAddress: string
  nftId: BigNumber
  position: Position
  fId: number
  rangeId: number
  liquidity: BigNumber
  stakedLiquidity: BigNumber
  unclaimedRewards: Array<CurrencyAmount<Currency>>
}

export interface SubgraphToken {
  id: string
  name: string
  decimals: string
  symbol: string
}

interface SubgraphRange extends Omit<ElasticFarmV2Range, 'tvl' | 'apr'> {
  depositedPositions: Array<{
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
}

export interface SubgraphFarmV2 {
  id: string
  startTime: string
  endTime: string
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
  ranges: Array<SubgraphRange>
}
