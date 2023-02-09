import { ChainId } from '@kyberswap/ks-sdk-core'
import axios from 'axios'
import { RouteSummary as RawRouteSummary } from 'services/route/types/getRoute'

import { AGGREGATOR_API } from 'constants/env'
import { NETWORKS_INFO } from 'constants/networks'

export type Payload = {
  routeSummary: RawRouteSummary
  deadline: number
  slippageTolerant: number
  sender: string
  recipient?: string
  referral?: string
  source: 'kyberswap'
  useMeta: true
}

export type BuildRouteData = {
  data: string
  amountIn: string
  amountInUsd: string
  amountOut: string
  amountOutUsd: string
  outputChange?: {
    amount: string
    percent: number
    level: number
  }
  gas: string
  gasUsd: string
  routerAddress: string
}

type Response = {
  code: number
  message: string
  data?: BuildRouteData
}

const buildRoute = async (chainId: ChainId, payload: Payload, signal?: AbortSignal) => {
  const chainSlug = NETWORKS_INFO[chainId].ksSettingRoute

  const resp = await axios.post<Response>(`${AGGREGATOR_API}/${chainSlug}/api/v1/route/build`, payload, {
    signal,
  })

  if (resp.status === 200) {
    if (resp.data?.data) {
      return resp.data.data
    }

    const err = new Error('Invalid response when building route')
    console.error(err)
    throw err
  }

  const err = new Error('Building route failed')
  console.error(err)
  throw err
}

export default buildRoute
