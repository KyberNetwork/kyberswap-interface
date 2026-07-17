import type { Currency } from '@kyberswap/ks-sdk-core'

import TokenPriceChart from 'components/TokenPriceChart'
import { PRICE_CHART_QUOTE_TOKEN_BY_CHAIN } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import SwapTradeRoute from 'pages/Swap/components/SwapTradeRoute'
import { useShowPricingChart, useShowTradeRoutes } from 'state/user/hooks'
import type { DetailedRouteSummary } from 'types/route'
import { useTradeComposition } from 'utils/aggregationRouting'

type Props = {
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  routeSummary: DetailedRouteSummary | undefined
}

export const SwapRightPanel = ({ currencyIn, currencyOut, routeSummary }: Props) => {
  const { chainId } = useActiveWeb3React()
  const isShowPricingChart = useShowPricingChart()
  const isShowTradeRoutes = useShowTradeRoutes()

  const tradeRouteComposition = useTradeComposition({
    chainId,
    inputAmount: routeSummary?.parsedAmountIn,
    swaps: routeSummary?.route,
  })

  const hasSupportedTokenPriceChart = Boolean(PRICE_CHART_QUOTE_TOKEN_BY_CHAIN[chainId])

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
        />
      )}
    </>
  )
}
