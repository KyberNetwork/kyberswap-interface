import { BuildRouteData } from 'services/route/types/buildRoute'
import { GetRouteParams, RouteSummary } from 'services/route/types/getRoute'

/** `GET /api/v1/swap` quotes and builds in one request: the quote params plus the transaction ones. */
export type SwapRouteParams = GetRouteParams & {
  sender: string
  recipient: string
  slippageTolerance: number
  deadline: number
  source: string
  enableSimulation: boolean
  permit?: string
  referral?: string
}

/** `status` is `success` or `reverted`; a reverted one still arrives in a successful response with calldata. */
export type SwapSimulation = {
  status: string
  reason?: string
  amountOut?: string
  gas?: string
}

export type SwapRouteData = BuildRouteData & {
  /** The route this transaction executes, quoted when the request was served. */
  routeSummary: RouteSummary
  transactionValue: string
  simulation?: SwapSimulation
}

export type SwapRouteResponse = {
  code: number
  message: string
  data?: SwapRouteData
}
