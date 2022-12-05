export type EarningsBreakdown = {
  totalValue: number
  breakdowns: Array<{
    title: string
    value: string
    percent: number
  }>
}

export type EarningStatsOverTime = {
  totalValue: number
  ticks: EarningStatsAtTime[]
}

export type EarningStatsAtTime = {
  date: string
  pool: {
    totalValue: number
    tokens: Array<{
      logoUrl: string
      amount: number
    }>
  }
  farm: {
    totalValue: number
    tokens: Array<{
      logoUrl: string
      amount: number
    }>
  }
}
