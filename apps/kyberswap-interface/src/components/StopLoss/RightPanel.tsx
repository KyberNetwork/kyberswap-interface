import { useMemo } from 'react'

import { useLimitOrderContext } from 'components/LimitOrder/LimitOrderContext'
import OrderBook from 'components/LimitOrder/OrderBook'
import { ORDER_LIST_TABS, TabSelector } from 'components/LimitOrder/OrderList'
import { LimitOrderTab } from 'components/LimitOrder/types'
import { Stack } from 'components/Stack'
import StopLossOrders from 'components/StopLoss/MyOrders'
import TokenPriceChart from 'components/TokenPriceChart'
import { PRICE_CHART_QUOTES } from 'constants/tokens'
import useTab from 'hooks/useTab'
import { useLimitState } from 'state/limit/hooks'

/** The shell both cards share; on phones each runs edge to edge, like the limit-order panel. */
const CARD_CLASS =
  'w-full gap-0 overflow-hidden rounded-xl border border-background bg-buttonBlack max-sm:-ml-4 max-sm:w-screen max-sm:rounded-none'

// Price leads: it is what the trigger is set against. The order book is the limit-order market for
// the same pair.
const MARKET_TAB_ORDER: LimitOrderTab[] = [LimitOrderTab.PRICE, LimitOrderTab.ORDER_BOOK]

/**
 * The stop-loss page's right column: the pair's market in one card, and the user's stop-loss orders in
 * their own card below it, always on screen rather than behind a tab.
 */
const StopLossRightPanel = () => {
  const { chainId, syncOrderListTabWithQuery } = useLimitOrderContext()
  const { currencyIn, currencyOut } = useLimitState()

  const hasPriceChart = Boolean(PRICE_CHART_QUOTES[chainId])
  const tabs = useMemo(
    () =>
      ORDER_LIST_TABS.filter(
        tab => MARKET_TAB_ORDER.includes(tab.id) && (hasPriceChart || tab.id !== LimitOrderTab.PRICE),
      ).sort((a, b) => MARKET_TAB_ORDER.indexOf(a.id) - MARKET_TAB_ORDER.indexOf(b.id)),
    [hasPriceChart],
  )
  const tabIds = useMemo(() => tabs.map(tab => tab.id), [tabs])

  const { activeTab, setActiveTab } = useTab<LimitOrderTab>({
    tabs: tabIds,
    defaultTab: LimitOrderTab.PRICE,
    syncQuery: syncOrderListTabWithQuery,
  })
  const currentTab = activeTab || tabIds[0]

  return (
    <>
      <Stack className={CARD_CLASS} data-testid="stop-loss-market-panel">
        <TabSelector activeTab={currentTab} setActiveTab={setActiveTab} tabs={tabs} />
        <Stack className="border-t border-darkBorder">
          {currentTab === LimitOrderTab.PRICE ? (
            <TokenPriceChart flatten tokens={[currencyIn, currencyOut]} />
          ) : (
            <OrderBook />
          )}
        </Stack>
      </Stack>

      <Stack className={CARD_CLASS} data-testid="stop-loss-orders-panel">
        <StopLossOrders />
      </Stack>
    </>
  )
}

export default StopLossRightPanel
