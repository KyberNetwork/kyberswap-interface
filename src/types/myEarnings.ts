import { ChainId } from '@kyberswap/ks-sdk-core'

export type EarningsBreakdown = {
  totalValue: number
  breakdowns: Array<{
    chainId: ChainId | undefined // undefined when this is 'Others'
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
  day: number
  date: string
  totalValue: number
  poolRewardsValue: number
  farmRewardsValue: number
  tokens: Array<{
    chainId: ChainId
    logoUrl: string
    amount: number
    amountUSD: number
    symbol: string
  }>
}
