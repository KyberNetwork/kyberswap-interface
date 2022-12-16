import { t } from '@lingui/macro'
import { useCallback, useRef } from 'react'
import { useSelector } from 'react-redux'

import { useActiveWeb3React } from 'hooks'
import { AppState } from 'state'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { asyncCallWithMinimumTime } from 'utils/fetchWaiting'
import { getRawRouteSummary } from 'utils/getMetaAggregatorRoutes/utils'

import buildRoute, { Payload, Response } from './buildRoute'

const MINIMUM_LOADING_TIME = 5_000

export type BuildRouteResult =
  | {
      response: Response
      error?: never
    }
  | {
      response?: never
      error: string
    }

const useBuildRoute = () => {
  const { chainId, account } = useActiveWeb3React()
  const routeSummary = useSelector((state: AppState) => state.swap.routeSummary)
  const abortControllerRef = useRef(new AbortController())
  const [allowedSlippage] = useUserSlippageTolerance()

  // recipient is only allowed in Advanced mode
  const recipient = useSelector((state: AppState) => {
    if (state.user.userExpertMode) {
      return state.swap.recipient
    }

    return ''
  })
  const referral = useSelector((state: AppState) => state.swap.feeConfig?.feeReceiver)

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
      // TODO: apply real deadline from user setting
      deadline: Math.floor(Date.now() / 1000) + 20 * 60,
      slippageTolerant: allowedSlippage,
      to: recipient || account,
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

      console.log({ response })

      return {
        response,
      }
    } catch (e) {
      return {
        error: e.message || t`Something went wrong`,
      }
    }
  }, [account, allowedSlippage, chainId, recipient, referral, routeSummary])

  return fetcher
}

export default useBuildRoute
