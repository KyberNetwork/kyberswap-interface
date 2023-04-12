export type EarningsBreakdown = {
  totalValue: number
  breakdowns: Array<{
    title: string
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
