import { useLimitOrderContext } from 'components/LimitOrder/LimitOrderContext'
import { Stack } from 'components/Stack'
import StopLossOrders from 'components/StopLoss/MyOrders'
import StopLossPriceChart from 'components/StopLoss/PriceChart'
import { PRICE_CHART_QUOTES } from 'constants/tokens'
import { useLimitState } from 'state/limit/hooks'
import { useShowPricingChart } from 'state/user/hooks'

/** The shell both cards share; on phones each runs edge to edge, like the limit-order panel. */
const CARD_CLASS =
  'w-full gap-0 overflow-hidden rounded-xl border border-background bg-buttonBlack max-sm:-ml-4 max-sm:w-screen max-sm:rounded-none'

/**
 * The stop-loss page's right column: the pair's price chart, which the trigger is set against, and the
 * user's stop-loss orders in their own card below it. The chart follows the Pricing Chart display
 * setting it shares with Swap, and is left out on chains that have no chart.
 */
const StopLossRightPanel = () => {
  const { chainId } = useLimitOrderContext()
  const { currencyIn, currencyOut } = useLimitState()
  const isShowPricingChart = useShowPricingChart()
  const showPriceChart = isShowPricingChart && Boolean(PRICE_CHART_QUOTES[chainId])

  return (
    <>
      {showPriceChart && (
        <Stack className={CARD_CLASS} data-testid="stop-loss-market-panel">
          <StopLossPriceChart currencyIn={currencyIn} currencyOut={currencyOut} />
        </Stack>
      )}

      <Stack className={CARD_CLASS} data-testid="stop-loss-orders-panel">
        <StopLossOrders />
      </Stack>
    </>
  )
}

export default StopLossRightPanel
