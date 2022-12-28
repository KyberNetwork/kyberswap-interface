import { Currency, CurrencyAmount, Price } from '@kyberswap/ks-sdk-core'

export type Route = {
  pool: string

  tokenIn: string
  swapAmount: string

  tokenOut: string
  amountOut: string

  limitReturnAmount: string
  exchange: string
  poolLength: number
  poolType: string
  extra: string
}

export type FeeConfig = {
  feeAmount: string
  chargeFeeBy: string
  isInBps: boolean
  feeReceiver: string
}

export type RouteSummary = {
  tokenIn: string
  amountIn: string
  parsedAmountIn: CurrencyAmount<Currency>
  amountInUsd: string
  tokenInMarketPriceAvailable: null

  tokenOut: string
  amountOut: string
  parsedAmountOut: CurrencyAmount<Currency>
  amountOutUsd: string
  tokenOutMarketPriceAvailable: null

  priceImpact: number
  executionPrice: Price<Currency, Currency>

  gas: string
  gasUsd: string
  gasPrice: string

  extraFee: FeeConfig
  route: Route[][]
}
