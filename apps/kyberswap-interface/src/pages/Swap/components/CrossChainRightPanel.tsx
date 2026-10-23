import { type Currency as EvmCurrency } from '@kyberswap/ks-sdk-core'
import { Suspense, lazy } from 'react'

import TokenPriceChart from 'components/TokenPriceChart'
import { getChartTokens } from 'components/TokenPriceChart/tokens'
import TradeRoutePanel, { TradeRouteSkeleton } from 'pages/Swap/components/TradeRoutePanel'
import { useShowPricingChart, useShowTradeRoutes } from 'state/user/hooks'

const CrossChainTradeRoute = lazy(() => import('pages/Swap/components/CrossChainTradeRoute'))

const PendingTradeRoute = () => (
  <TradeRoutePanel heading={<span className="text-lg font-medium text-blue">Route:</span>}>
    <TradeRouteSkeleton poolLines={1} />
  </TradeRoutePanel>
)

type Props = {
  currencyIn: EvmCurrency | undefined
  currencyOut: EvmCurrency | undefined
  isProviderLoading: boolean
}

/** Chart metadata comes from the page pair so it can render before the cross-chain engine loads.
 * Only the trade route needs the shared quote provider. */
const CrossChainRightPanel = ({ currencyIn, currencyOut, isProviderLoading }: Props) => {
  const showChart = useShowPricingChart()
  const showRoutes = useShowTradeRoutes()
  const tokens = [currencyIn, currencyOut].filter((token): token is EvmCurrency => !!token)
  const hasChart = getChartTokens(tokens).length > 0

  return (
    <>
      {showChart && hasChart && <TokenPriceChart tokens={tokens} />}
      {showRoutes &&
        (isProviderLoading ? (
          <PendingTradeRoute />
        ) : (
          <Suspense fallback={<PendingTradeRoute />}>
            <CrossChainTradeRoute />
          </Suspense>
        ))}
    </>
  )
}

export default CrossChainRightPanel
