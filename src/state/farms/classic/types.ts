import { BigNumber } from '@ethersproject/bignumber'
import { Fraction, Token } from '@kyberswap/ks-sdk-core'

export enum FairLaunchVersion {
  V1,
  V2,
  V3,
}

export enum RewardLockerVersion {
  V1,
  V2,
}

export interface FarmV1 {
  fairLaunchAddress: string
  version: FairLaunchVersion.V1
  pid: number
  id: string
  rewardTokens: Token[]
  rewardPerBlocks: BigNumber[]
  totalStake: Fraction
  stakeToken: string
  startBlock: number
  endBlock: number
  token0: Token
  token1: Token
  amp: number
  reserve0: string
  reserve1: string
  reserveUSD: string
  totalSupply: string
  oneDayFeeUSD?: string
  oneDayFeeUntracked?: string
  userData?: {
    stakedBalance?: string
    rewards?: string[]
  }
}

export interface FarmV2 {
  fairLaunchAddress: string
  version: FairLaunchVersion.V2 | FairLaunchVersion.V3
  pid: number
  id: string
  rewardTokens: Token[]
  rewardPerSeconds: BigNumber[]
  totalStake: Fraction
  stakeToken: string
  startTime: number
  endTime: number
  token0: Token
  token1: Token
  amp: number
  reserve0: string
  reserve1: string
  reserveUSD: string
  totalSupply: string
  oneDayFeeUSD?: string
  oneDayFeeUntracked?: string
  userData?: {
    stakedBalance?: string
    rewards?: string[]
  }
}

export type Farm = FarmV1 | FarmV2

export interface Reward {
  token: Token
  amount: BigNumber
}

/**
 * Time unit can be block or second
 */
export interface RewardPerTimeUnit {
  token: Token
  amount: BigNumber
}

export interface FarmHistoriesSubgraphResult {
  deposits: {
    id: string
    timestamp: string
    poolID: number
    stakeToken: string
    amount: string
  }[]
  withdraws: {
    id: string
    timestamp: string
    poolID: number
    stakeToken: string
    amount: string
  }[]
  harvests: {
    id: string
    timestamp: string
    poolID: number
    stakeToken: string
    rewardToken: string
    amount: string
  }[]
  vests: {
    id: string
    timestamp: string
    rewardToken: string
    amount: string
  }[]
}

export enum FarmHistoryMethod {
  DEPOSIT,
  WITHDRAW,
  HARVEST,
  CLAIM,
}

export interface FarmHistory {
  id: string
  timestamp: string
  method: FarmHistoryMethod
  amount: string
  stakeToken?: string
  rewardToken?: string
}
