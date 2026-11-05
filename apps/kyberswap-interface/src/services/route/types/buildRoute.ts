import { RouteSummary as RawRouteSummary } from 'services/route/types/getRoute'

import type { AccessListEntry } from 'utils/accessList'

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
  referral?: string
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
  /**
   * @deprecated
   */
  feeUsd: string
  outputChange?: {
    percent: number
  }
  /** Estimated without `accessList`, so it stays a safe gas limit for a wallet that drops the list. */
  gas: string
  gasUsd: string
  routerAddress: string
  additionalCostUsd?: string
  /** EIP-2930 list from the build's own simulation of `data`; absent when the service has none. */
  accessList?: AccessListEntry[]
}

export type BuildRouteResponse = {
  code: number
  message: string
  data?: BuildRouteData
}
