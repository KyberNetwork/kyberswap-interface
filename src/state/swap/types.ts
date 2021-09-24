import { CurrencyAmount } from 'libs/sdk/src'
import { DexConfig } from '../../constants/dexes'

export interface AggregationComparer {
  inputAmount: CurrencyAmount
  outputAmount: CurrencyAmount
  outputPriceUSD: number
  comparedDex: DexConfig
  tradeSaved?: {
    percent?: number
    usd?: string
  }
}
