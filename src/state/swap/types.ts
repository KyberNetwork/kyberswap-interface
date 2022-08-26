import { Currency, CurrencyAmount } from '@namgold/ks-sdk-core'

import { DexConfig } from 'constants/dexes'

export interface AggregationComparer {
  inputAmount: CurrencyAmount<Currency>
  outputAmount: CurrencyAmount<Currency>
  amountInUsd: string
  amountOutUsd: string
  receivedUsd: string
  // outputPriceUSD: number
  comparedDex: DexConfig
  tradeSaved?: {
    percent?: number
    usd?: string
  }
}
