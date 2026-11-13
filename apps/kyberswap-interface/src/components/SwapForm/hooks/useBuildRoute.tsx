import { Currency } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import routeApi, { AGGREGATOR_API_PATHS } from 'services/route'
import { BuildRouteData } from 'services/route/types/buildRoute'
import { GetRouteParams, RouteSummary } from 'services/route/types/getRoute'
import { SwapRouteParams } from 'services/route/types/swapRoute'

import { isRouteFeeTampered, useRouteApiDomain } from 'components/SwapForm/hooks/useRouteRequest'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useENS from 'hooks/useENS'
import { useKyberswapGlobalConfig } from 'hooks/useKyberSwapConfig'
import { getCookieValue } from 'utils/cookie'
import { amountFromRoute } from 'utils/nativeErc20'
import { SAFE_APP_CLIENT_ID, isInSafeApp } from 'utils/safeApp'

export type BuildRouteResult =
  | {
      data: BuildRouteData
      error?: never
    }
  | {
      data?: never
      error: string
      suggestedSlippage?: number
    }

type Args = {
  recipient: string
  /** The request that produced the quote on screen; the swap is built for the same trade. */
  routeParams: GetRouteParams | undefined
  /** The quote on screen, which the built output is compared against. */
  routeSummary: RouteSummary | undefined
  /** Router of the quote on screen, the spender the input token is approved for. */
  routerAddress: string | undefined
  slippage: number
  transactionTimeout: number
  permit?: string
  currencyIn: Currency | undefined
}

/** Signed percent by which `builtAmountOut` differs from `quotedAmountOut`. */
export const getOutputChangePercent = (quotedAmountOut: string, builtAmountOut: string) => {
  const quoted = BigInt(quotedAmountOut)
  if (quoted === 0n) return 0

  return (Number(BigInt(builtAmountOut) - quoted) / Number(quoted)) * 100
}

/** Quotes and builds the swap transaction in a single `/swap` request. */
const useBuildRoute = (args: Args) => {
  const { recipient, routeParams, routeSummary, routerAddress, slippage, transactionTimeout, permit, currencyIn } = args
  const [searchParams] = useSearchParams()
  const clientId = isInSafeApp ? SAFE_APP_CLIENT_ID : searchParams.get('clientId')
  const { chainId, account } = useActiveWeb3React()
  const { isEnableAuthenAggregator } = useKyberswapGlobalConfig()
  const [swapRoute] = routeApi.useSwapRouteMutation()
  const aggregatorDomain = useRouteApiDomain()
  const recipientLookup = useENS(recipient)
  const to = recipientLookup.address

  const fetcher = useCallback(
    async (signal: AbortSignal): Promise<BuildRouteResult> => {
      if (!account) {
        return {
          error: t`Wallet is not connected`,
        }
      }

      if (!to) return { error: t`Enter a recipient` }

      if (!routeParams || !routeSummary) {
        return {
          error: t`Route summary is missing`,
        }
      }

      const params: SwapRouteParams = {
        ...routeParams,
        sender: account,
        recipient: to,
        slippageTolerance: slippage,
        deadline: Math.floor(Date.now() / 1000) + transactionTimeout,
        source: clientId || 'kyberswap',
        // Simulated with balance and allowance overrides; its gas usage is the response's gas estimate.
        enableSimulation: true,
        permit,
        referral: getCookieValue('refCode'),
      }

      try {
        if (signal.aborted) throw new Error('Build cancelled')

        const url = `${aggregatorDomain}/${NETWORKS_INFO[chainId].aggregatorRoute}${AGGREGATOR_API_PATHS.SWAP}`

        const request = swapRoute({
          url,
          params,
          signal,
          authentication: isEnableAuthenAggregator,
        })
        const abortRequest = () => request.abort()
        signal.addEventListener('abort', abortRequest, { once: true })

        const response = await request.unwrap().finally(() => signal.removeEventListener('abort', abortRequest))
        const swap = response?.data
        if (!swap?.data) throw new Error('Building route failed')

        const { routeSummary: builtRoute, simulation, ...build } = swap

        if (simulation && simulation.status !== 'success') {
          const reason = simulation.reason || simulation.status
          return { error: `Swap simulation failed: ${reason}` }
        }

        // The input token is approved for the quoted router, so a swap through another one cannot pull it.
        if (routerAddress && build.routerAddress.toLowerCase() !== routerAddress.toLowerCase()) {
          return { error: 'The router of the built swap differs from the quoted one' }
        }

        if (isRouteFeeTampered(builtRoute?.extraFee, routeParams)) {
          return { error: 'The fee of the built swap differs from the requested one' }
        }

        return {
          data: {
            ...build,
            // The response echoes `amountIn` in the units it was given. Read it back into the input
            // currency's own units here so every consumer of the build result works in one scale.
            amountIn: currencyIn ? amountFromRoute(build.amountIn, currencyIn, 'in') : build.amountIn,
            // The endpoint prices a fresh route and has no earlier quote to compare with.
            outputChange: { percent: getOutputChangePercent(routeSummary.amountOut, build.amountOut) },
          },
        }
      } catch (e) {
        if (Array.isArray(e?.data?.errorEntities)) {
          return {
            error: e.data.errorEntities.join(' | '),
          }
        }

        return {
          error: e?.data?.errorEntities?.[0] || e.message || e?.data?.message || t`Something went wrong`,
          suggestedSlippage: e?.data?.suggestedSlippage,
        }
      }
    },
    [
      clientId,
      account,
      aggregatorDomain,
      chainId,
      to,
      routeParams,
      routeSummary,
      routerAddress,
      slippage,
      transactionTimeout,
      swapRoute,
      isEnableAuthenAggregator,
      permit,
      currencyIn,
    ],
  )

  return fetcher
}

export default useBuildRoute
