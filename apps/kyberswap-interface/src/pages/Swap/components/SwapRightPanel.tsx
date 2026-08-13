import type { Currency } from '@kyberswap/ks-sdk-core'
import { useCallback } from 'react'

import TokenPriceChart from 'components/TokenPriceChart'
import { PRICE_CHART_QUOTES } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import SwapTradeRoute from 'pages/Swap/components/SwapTradeRoute'
import { Field } from 'state/swap/actions'
import { useShowPricingChart, useShowTradeRoutes } from 'state/user/hooks'
import type { DetailedRouteSummary } from 'types/route'
import { useTradeComposition } from 'utils/aggregationRouting'
import { getTokenAddress } from 'utils/tokenInfo'

type Props = {
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  routeSummary: DetailedRouteSummary | undefined
}

export const SwapRightPanel = ({ currencyIn, currencyOut, routeSummary }: Props) => {
  const { chainId, networkInfo } = useActiveWeb3React()
  const isShowPricingChart = useShowPricingChart()
  const isShowTradeRoutes = useShowTradeRoutes()
  const { trackingHandler } = useTracking({
    [Field.INPUT]: currencyIn,
    [Field.OUTPUT]: currencyOut,
  })

  const tradeRouteComposition = useTradeComposition({
    chainId,
    inputAmount: routeSummary?.parsedAmountIn,
    swaps: routeSummary?.route,
  })

  const hasSupportedTokenPriceChart = Boolean(PRICE_CHART_QUOTES[chainId])

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

  return (
    <>
      {isShowPricingChart && <TokenPriceChart tokens={[currencyIn, currencyOut]} />}
      {isShowTradeRoutes && (
        <SwapTradeRoute
          tradeComposition={tradeRouteComposition}
          currencyIn={currencyIn}
          currencyOut={currencyOut}
          defaultCollapsed={hasSupportedTokenPriceChart && isShowPricingChart}
          inputAmount={routeSummary?.parsedAmountIn}
          outputAmount={routeSummary?.parsedAmountOut}
          isSmartSettlement={routeSummary?.isSmartSettlement}
          onExpand={handleViewRoute}
        />
      )}
    </>
  )
}
