import { useLimitOrderContext } from 'components/LimitOrder/LimitOrderContext'
import { Stack } from 'components/Stack'
import StopOrders from 'components/StopOrder/MyOrders'
import StopOrderPriceChart from 'components/StopOrder/PriceChart'
import { STOP_ORDER_CARD_CLASS } from 'components/StopOrder/RightPanelSkeleton'
import { PRICE_CHART_QUOTES } from 'constants/tokens'
import { useLimitState } from 'state/limit/hooks'
import { useShowPricingChart } from 'state/user/hooks'

/**
 * The stop order page's right column: the pair's price chart, which the trigger is set against, and the
 * user's stop orders in their own card below it. The chart follows the Pricing Chart display
 * setting it shares with Swap, and is left out on chains that have no chart.
 */
const StopOrderRightPanel = () => {
  const { chainId } = useLimitOrderContext()
  const { currencyIn, currencyOut } = useLimitState()
  const isShowPricingChart = useShowPricingChart()
  const showPriceChart = isShowPricingChart && Boolean(PRICE_CHART_QUOTES[chainId])

  return (
    <>
      {showPriceChart && (
        <Stack className={STOP_ORDER_CARD_CLASS} data-testid="stop-order-market-panel">
          <StopOrderPriceChart currencyIn={currencyIn} currencyOut={currencyOut} />
        </Stack>
      )}

      <Stack className={STOP_ORDER_CARD_CLASS} data-testid="stop-order-orders-panel">
        <StopOrders />
      </Stack>
    </>
  )
}

export default StopOrderRightPanel
