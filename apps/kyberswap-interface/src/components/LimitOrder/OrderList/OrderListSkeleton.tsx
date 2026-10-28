import { useLocation, useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'

import { useLimitOrderContext } from 'components/LimitOrder/LimitOrderContext'
import RowsSkeleton from 'components/LimitOrder/MyOrders/RowsSkeleton'
import OrderBookSkeleton from 'components/LimitOrder/OrderBook/OrderBookSkeleton'
import { OrderPanelCard } from 'components/LimitOrder/OrderList/OrderListComponents'
import { LimitOrderStatus, LimitOrderTab } from 'components/LimitOrder/types'
import Skeleton from 'components/Skeleton'
import { HStack, Stack } from 'components/Stack'
import { StopMarketRowsSkeleton } from 'components/StopMarket/MyOrders/components'
import { APP_PATHS } from 'constants/index'
import { PRICE_CHART_QUOTES } from 'constants/tokens'
import { PoolChartSkeleton } from 'pages/Earns/PoolDetail/components/PoolChartState'
import { useShowPricingChart } from 'state/user/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { getTradeProductPath } from 'utils/routes'

/** A card's opening tab bar, at the height its tabs take. */
const TabsRowSkeleton = ({ widths }: { widths: number[] }) => (
  <HStack className="min-h-11 items-center gap-8 border-b border-darkBorder bg-background px-4">
    {widths.map((width, index) => (
      <Skeleton key={index} height={16} width={width} borderRadius={6} />
    ))}
  </HStack>
)

/** The chart as `TokenPriceChart` first draws it: one pair tab, then the price and the chart. */
const ChartSkeleton = () => {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  return (
    <>
      <HStack className="items-center gap-3 pr-4">
        <HStack className="min-h-11 items-center gap-1.5 px-4 py-3">
          <Skeleton circle height={20} width={20} />
          <Skeleton height={14} width={96} borderRadius={6} />
        </HStack>
        {!upToSmall && (
          <div className="flex flex-1 justify-end">
            <Skeleton height={12} width={220} borderRadius={6} />
          </div>
        )}
      </HStack>
      {/* Phones open the chart collapsed, so only its tab bar shows there. */}
      {!upToSmall && (
        <Stack className="gap-3 border-t border-darkBorder p-4">
          <HStack className="items-center justify-between gap-4">
            <span className="flex h-7 items-center">
              <Skeleton height={20} width={160} borderRadius={8} />
            </span>
            <Skeleton height={30} width={200} borderRadius={8} />
          </HStack>
          <PoolChartSkeleton height={360} type="candle" />
        </Stack>
      )}
    </>
  )
}

/**
 * Stands in for the order panel while its code loads, card for card, so the page keeps its shape
 * instead of showing a spinner. The market card opens on the chart where the panel would, which
 * follows the Pricing Chart setting and the chain. Stop Market leaves the card out when it has no chart.
 */
const OrderListSkeleton = () => {
  const { chainId } = useLimitOrderContext()
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const isShowPricingChart = useShowPricingChart()

  const hasChart = isShowPricingChart && Boolean(PRICE_CHART_QUOTES[chainId])
  const hasOrderBook = getTradeProductPath(pathname) !== APP_PATHS.STOP_MARKET
  const orderTabs = !hasChart && hasOrderBook ? [110, 110, 130] : [110, 110]
  const isOrderBook = hasOrderBook && searchParams.get('tab') === LimitOrderTab.ORDER_BOOK
  const isActiveTab = searchParams.get('orderTab') !== LimitOrderStatus.CLOSED

  return (
    <>
      {hasChart && (
        <OrderPanelCard>
          <TabsRowSkeleton widths={[160, ...(hasOrderBook ? [130] : [])]} />
          {isOrderBook ? <OrderBookSkeleton /> : <ChartSkeleton />}
        </OrderPanelCard>
      )}
      {(!hasChart || !isOrderBook) && (
        <OrderPanelCard>
          <TabsRowSkeleton widths={orderTabs} />
          {isOrderBook ? (
            <OrderBookSkeleton />
          ) : (
            <>
              <HStack className="min-h-12 items-center gap-6 border-b border-darkBorder px-4 py-2">
                <Skeleton height={14} width={76} borderRadius={6} />
                <Skeleton height={14} width={76} borderRadius={6} />
              </HStack>
              <div className="flex justify-between gap-2 px-4 py-2 max-sm:flex-col">
                <Skeleton height={36} width={130} borderRadius={16} />
                <div className="max-w-[360px] flex-1 max-sm:w-full max-sm:max-w-none max-sm:flex-none">
                  <Skeleton height={36} borderRadius={16} containerClassName="block" />
                </div>
              </div>
              <div className="min-h-20">
                {hasOrderBook ? (
                  <RowsSkeleton isActiveTab={isActiveTab} />
                ) : (
                  <StopMarketRowsSkeleton isActiveTab={isActiveTab} />
                )}
              </div>
            </>
          )}
        </OrderPanelCard>
      )}
    </>
  )
}

export default OrderListSkeleton
