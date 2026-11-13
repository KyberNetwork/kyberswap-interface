import type { Currency } from '@kyberswap/ks-sdk-core'
import { Suspense, lazy, useCallback } from 'react'

import { useSingleChainSwapContext } from 'components/SwapForm/SingleChain/SingleChainSwapProvider'
import TokenPriceChart from 'components/TokenPriceChart'
import { getChartTokens } from 'components/TokenPriceChart/tokens'
import SingleChainTradeRoute from 'components/TradeRouting/SingleChainTradeRoute'
import TradeRoutePanel, { TradeRouteSkeleton } from 'components/TradeRouting/TradeRoutePanel'
import { NETWORKS_INFO } from 'constants/networks'
import { PRICE_CHART_QUOTES } from 'constants/tokens'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useSwapRouteSnapshot } from 'pages/Swap/SwapPageRuntime'
import { Field } from 'state/swap/actions'
import { useShowPricingChart, useShowTradeRoutes } from 'state/user/hooks'
import type { Chain } from 'types/crossChain'
import { useTradeComposition } from 'utils/aggregationRouting'
import { getTokenAddress } from 'utils/tokenInfo'

const SingleChainRoute = ({
  isTokenLoading,
  defaultCollapsed,
}: {
  isTokenLoading: boolean
  defaultCollapsed: boolean
}) => {
  const { chainId, currencyIn, currencyOut, routeSummary, routeLoading } = useSingleChainSwapContext()
  const { trackingHandler } = useTracking({
    [Field.INPUT]: currencyIn,
    [Field.OUTPUT]: currencyOut,
  })

  const networkInfo = NETWORKS_INFO[chainId]
  const isSameChain = !currencyIn || !currencyOut || currencyIn.chainId === currencyOut.chainId

  const tradeRouteComposition = useTradeComposition({
    chainId,
    inputAmount: routeSummary?.parsedAmountIn,
    swaps: routeSummary?.route,
  })

  const handleViewRoute = useCallback(() => {
    trackingHandler(TRACKING_EVENT_TYPE.SWAP_ROUTE_VIEWED, {
      from_token: currencyIn?.symbol,
      from_token_address: currencyIn ? getTokenAddress(currencyIn) : undefined,
      to_token: currencyOut?.symbol,
      to_token_address: currencyOut ? getTokenAddress(currencyOut) : undefined,
      amount_in: routeSummary?.parsedAmountIn?.toSignificant(6),
      amount_in_usd: routeSummary?.amountInUsd ? Number(routeSummary.amountInUsd) : undefined,
      amount_out: routeSummary?.parsedAmountOut?.toSignificant(6),
      amount_out_usd: routeSummary?.amountOutUsd ? Number(routeSummary.amountOutUsd) : undefined,
      trade_route_dexes: [...new Set(routeSummary?.route?.flat().map(swap => swap.exchange) || [])],
      trade_route_steps: routeSummary?.route?.length,
      route_split: (routeSummary?.route?.length || 0) > 1,
      is_smart_settlement: Boolean(routeSummary?.isSmartSettlement),
      chain: networkInfo.name,
    })
  }, [currencyIn, currencyOut, networkInfo.name, routeSummary, trackingHandler])

  if (!isSameChain) return null

  return (
    <SingleChainTradeRoute
      tradeComposition={tradeRouteComposition}
      loading={routeLoading || isTokenLoading}
      currencyIn={currencyIn}
      currencyOut={currencyOut}
      defaultCollapsed={defaultCollapsed}
      inputAmount={routeSummary?.parsedAmountIn}
      outputAmount={routeSummary?.parsedAmountOut}
      isSmartSettlement={routeSummary?.isSmartSettlement}
      onExpand={handleViewRoute}
    />
  )
}

const CrossChainTradeRouteSlot = lazy(() =>
  import('components/TradeRouting/CrossChainTradeRoute').then(module => ({ default: module.CrossChainTradeRouteSlot })),
)

const CrossChainRoute = ({ defaultCollapsed }: { defaultCollapsed: boolean }) => {
  const route = useSwapRouteSnapshot()
  return (
    <TradeRoutePanel
      defaultCollapsed={defaultCollapsed}
      heading={
        !route ? (
          <span className="text-lg font-medium text-blue">Route:</span>
        ) : (
          <Suspense fallback={<span className="text-lg font-medium text-blue">Route:</span>}>
            <CrossChainTradeRouteSlot {...route} slot="heading" />
          </Suspense>
        )
      }
    >
      {!route ? (
        <TradeRouteSkeleton poolLines={1} />
      ) : (
        <Suspense fallback={<TradeRouteSkeleton poolLines={1} />}>
          <CrossChainTradeRouteSlot {...route} slot="body" />
        </Suspense>
      )}
    </TradeRoutePanel>
  )
}

type Props = {
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  inputChain: Chain
  isCrossChain: boolean
  isTokenLoading: boolean
}

/** The chart owns its preferences across mode changes; only route data and rendering branch by mode. */
const SwapRightPanel = ({ currencyIn, currencyOut, inputChain, isCrossChain, isTokenLoading }: Props) => {
  const showChart = useShowPricingChart()
  const showRoutes = useShowTradeRoutes()
  const tokens = [currencyIn, currencyOut]
  const hasChart = isCrossChain
    ? getChartTokens(tokens).length > 0
    : typeof inputChain === 'number' && Boolean(PRICE_CHART_QUOTES[inputChain])
  const defaultCollapsed = showChart && hasChart

  return (
    <>
      {showChart && <TokenPriceChart tokens={tokens} />}
      {showRoutes &&
        (isCrossChain ? (
          <CrossChainRoute defaultCollapsed={defaultCollapsed} />
        ) : (
          <SingleChainRoute isTokenLoading={isTokenLoading} defaultCollapsed={defaultCollapsed} />
        ))}
    </>
  )
}

export default SwapRightPanel
