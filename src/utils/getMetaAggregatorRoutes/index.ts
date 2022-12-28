import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import axios from 'axios'

import { AGGREGATOR_API } from 'constants/env'
import { NETWORKS_INFO } from 'constants/networks'

import { Response } from './types'
import { convertRawResponse } from './utils'

export type Params = {
  tokenIn: string
  tokenOut: string
  amountIn: string
  saveGas: string
  dexes: string
  gasInclude: string
  gasPrice: string
  feeAmount: string
  chargeFeeBy: string
  isInBps: string
  feeReceiver: string
  debug: string
  useMeta: string
}

const getMetaAggregatorRoute = async (
  chainId: ChainId,
  params: Params,
  currencyIn: Currency,
  currencyOut: Currency,
  signal?: AbortSignal,
) => {
  const chainSlug = NETWORKS_INFO[chainId].ksSettingRoute

  const resp = await axios.get<Response>(`${AGGREGATOR_API}/${chainSlug}/api/v1/route`, {
    params,
    signal,
  })

  if (resp.status === 200) {
    if (resp.data?.data) {
      return convertRawResponse(resp.data.data, currencyIn, currencyOut)
    }

    const err = new Error('Invalid response when getting route')
    console.error(err)
    throw err
  }

  const err = new Error('Fetching route failed')
  console.error(err)
  throw err
}

export default getMetaAggregatorRoute
