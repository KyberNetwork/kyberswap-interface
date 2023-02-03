import { t } from '@lingui/macro'
import { useCallback, useRef } from 'react'

import { useActiveWeb3React } from 'hooks'
import { RouteSummary } from 'types/metaAggregator'
import { asyncCallWithMinimumTime } from 'utils/fetchWaiting'
import { getRawRouteSummary } from 'utils/getMetaAggregatorRoutes/utils'

import buildRoute, { BuildRouteData, Payload } from './buildRoute'

const MINIMUM_LOADING_TIME = 1_000

export type BuildRouteResult =
  | {
      data: BuildRouteData
      error?: never
    }
  | {
      data?: never
      error: string
    }

type Args = {
  referral: string
  recipient: string
  routeSummary: RouteSummary | undefined
  slippage: number
  transactionTimeout: number
}
const useBuildRoute = (args: Args) => {
  const { referral, recipient, routeSummary, slippage, transactionTimeout } = args
  const { chainId, account } = useActiveWeb3React()
  const abortControllerRef = useRef(new AbortController())

  const fetcher = useCallback(async (): Promise<BuildRouteResult> => {
    if (!account) {
      return {
        error: t`Wallet is not connected`,
      }
    }

    if (!routeSummary) {
      return {
        error: t`Route summary is missing`,
      }
    }

    const payload: Payload = {
      routeSummary: getRawRouteSummary(routeSummary),
      deadline: Math.floor(Date.now() / 1000) + transactionTimeout,
      slippageTolerant: slippage,
      sender: account,
      recipient: recipient || account,
      referral,
      source: 'kyberswap',
      useMeta: true,
    }

    try {
      abortControllerRef.current.abort()
      abortControllerRef.current = new AbortController()

      const response = await asyncCallWithMinimumTime(
        () => buildRoute(chainId, payload, abortControllerRef.current.signal),
        MINIMUM_LOADING_TIME,
      )

      return {
        data: response,
      }
    } catch (e) {
      return {
        error: e.message || t`Something went wrong`,
      }
    }
  }, [account, chainId, recipient, referral, routeSummary, slippage, transactionTimeout])

  return fetcher
}

export default useBuildRoute
