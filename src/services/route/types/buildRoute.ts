import { RouteSummary as RawRouteSummary } from 'services/route/types/getRoute'

export type BuildRoutePayload = {
  routeSummary: RawRouteSummary
  deadline: number
  slippageTolerance: number
  sender: string
  recipient: string
  source: string
  skipSimulateTx: boolean
  enableGasEstimation?: boolean
  permit?: string
  // for calculating price impact only
  chainId?: number
  tokenInDecimals?: number
  tokenOutDecimals?: number
}

export type BuildRouteData = {
  data: string
  amountIn: string
  amountInUsd: string
  amountOut: string
  amountOutUsd: string
  feeUsd: string
  outputChange?: {
    percent: number
  }
  gas: string
  gasUsd: string
  routerAddress: string
  additionalCostUsd?: string
}

export type BuildRouteResponse = {
  code: number
  message: string
  data?: BuildRouteData
}
