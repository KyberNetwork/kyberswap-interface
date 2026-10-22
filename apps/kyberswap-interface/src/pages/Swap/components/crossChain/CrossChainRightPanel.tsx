import { type Currency as EvmCurrency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'

import TokenPriceChart from 'components/TokenPriceChart'
import { getChartTokens } from 'components/TokenPriceChart/tokens'
import CrossChainTradeRoute from 'pages/Swap/components/crossChain/CrossChainTradeRoute'
import { useCrossChainSwap } from 'pages/Swap/hooks/crossChain/useCrossChainSwap'
import { useShowPricingChart, useShowTradeRoutes } from 'state/user/hooks'

/** Composes chart and route from the form provider and display preferences.
 * Chart eligibility is shared with TokenPriceChart so its empty state cannot disagree with the parent. */
const CrossChainRightPanel = () => {
  const { currencyIn, currencyOut } = useCrossChainSwap()
  const showChart = useShowPricingChart()
  const showRoutes = useShowTradeRoutes()
  const tokens = [currencyIn, currencyOut].filter((token): token is EvmCurrency => !!token && 'isNative' in token)
  const hasChart = getChartTokens(tokens).length > 0

  return (
    <>
      {showChart &&
        (hasChart ? (
          <TokenPriceChart tokens={tokens} />
        ) : (
          <div className="rounded-xl border border-darkBorder p-6 text-center text-sm text-subText">
            <Trans>Price chart is unavailable for these tokens.</Trans>
          </div>
        ))}
      {showRoutes && <CrossChainTradeRoute defaultCollapsed={showChart && hasChart} />}
    </>
  )
}

export default CrossChainRightPanel
