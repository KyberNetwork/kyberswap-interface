import { Currency, CurrencyAmount } from '@namgold/ks-sdk-core'

export interface AggregationComparer {
  inputAmount: CurrencyAmount<Currency>
  outputAmount: CurrencyAmount<Currency>
  amountInUsd: string
  amountOutUsd: string
  receivedUsd: string
  // outputPriceUSD: number
  comparedDex: string
  tradeSaved?: {
    percent?: number
    usd?: string
  }
}
