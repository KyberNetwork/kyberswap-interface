import { Route } from 'types/route'

export type GetRouteParams = {
  tokenIn: string
  tokenOut: string
  amountIn: string
  saveGas: string
  includedSources: string
  excludedSources?: string
  gasInclude: string
  gasPrice: string
  feeAmount: string
  chargeFeeBy: string
  isInBps: string
  feeReceiver: string
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

  extraFee: {
    feeAmount: string
    chargeFeeBy: string
    isInBps: boolean
    feeReceiver: string
    feeAmountUsd: string
  }

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
