import { ChainId } from '@kyberswap/ks-sdk-core'

export type EarningsBreakdown = {
  totalValue: number
  breakdowns: Array<{
    address?: string
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
  day: number
  date: string
  totalValue: number
  poolFeesValue: number
  farmRewardsValue: number
  tokens: Array<{
    chainId: ChainId
    address: string
    logoUrl: string
    amount: number
    amountUSD: number
    symbol: string
  }>
}
