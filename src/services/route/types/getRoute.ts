import { ChargeFeeBy, ExtraFeeConfig, Route } from 'types/route'

export type GetRouteParams = {
  tokenIn: string
  tokenOut: string
  amountIn: string
  includedSources?: string
  excludedSources?: string
  excludedPools?: string
  gasInclude?: string
  gasPrice?: string
  feeAmount?: string
  chargeFeeBy?: ChargeFeeBy
  isInBps?: string
  feeReceiver?: string
  debug?: string
}

export type RouteSummary = {
  tokenIn: string
  amountIn: string
  amountInUsd: string

  tokenOut: string
  amountOut: string
  amountOutUsd: string
  tokenOutMarketPriceAvailable: null

  gas: string
  gasUsd: string
  gasPrice: string

  extraFee: ExtraFeeConfig

  route: Route[][]
}

export type GetRouteData = {
  routeSummary: RouteSummary | null
  routerAddress: string
  fromMeta: boolean
}

export type GetRouteResponse = {
  code: number
  message: string
  data?: GetRouteData
}
