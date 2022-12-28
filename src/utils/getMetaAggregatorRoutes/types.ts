type RawRoute = {
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

type RawFeeConfig = {
  feeAmount: string
  chargeFeeBy: string
  isInBps: boolean
  feeReceiver: string
}

export type RawRouteSummary = {
  tokenIn: string
  amountIn: string
  amountInUsd: string
  tokenInMarketPriceAvailable: null

  tokenOut: string
  amountOut: string
  amountOutUsd: string
  tokenOutMarketPriceAvailable: null

  gas: string
  gasUsd: string
  gasPrice: string

  extraFee: RawFeeConfig
  route: RawRoute[][]
}

export type Response = {
  routeSummary: RawRouteSummary
  routerAddress: string
  fromMeta: boolean
}
