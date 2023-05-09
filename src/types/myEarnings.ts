import { ChainId } from '@kyberswap/ks-sdk-core'

export type EarningsBreakdown = {
  totalValue: number
  breakdowns: Array<{
    chainId?: ChainId
    logoUrl?: string
    symbol: string
    value: string
    percent: number
  }>
}

export type EarningStatsOverTime = {
  lastTotalValue: number
  ticks: EarningStatsTick[]
}

export type EarningStatsTick = {
  date: string
  totalValue: number
  poolRewardsValue: number
  farmRewardsValue: number
  tokens: Array<{
    logoUrl: string
    amount: number
    symbol: string
  }>
}
