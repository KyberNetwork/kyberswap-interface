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

export enum ChargeFeeBy {
  CURRENCY_IN = 'currency_in',
  CURRENCY_OUT = 'currency_out',
  NONE = '',
}

export type ExtraFeeConfig = {
  feeAmount: string
  feeAmountUsd: string
  chargeFeeBy: ChargeFeeBy
  isInBps: boolean
  feeReceiver: string
}

export type DetailedRouteSummary = {
  tokenIn: string
  amountIn: string
  parsedAmountIn: CurrencyAmount<Currency>
  amountInUsd: string

  tokenOut: string
  amountOut: string
  parsedAmountOut: CurrencyAmount<Currency>
  amountOutUsd: string

  priceImpact: number
  executionPrice: Price<Currency, Currency>

  gas: string
  gasUsd: string
  gasPrice: string

  fee?: {
    currency: Currency
    currencyAmount: CurrencyAmount<Currency>
    formattedAmount: string
    formattedAmountUsd: string
  }

  extraFee: ExtraFeeConfig

  route: Route[][]
  routerAddress: string
}
