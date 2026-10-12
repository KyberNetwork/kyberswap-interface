import { useMedia } from 'react-use'

import { useLimitOrderContext } from 'components/LimitOrder/LimitOrderContext'
import Skeleton from 'components/Skeleton'
import { HStack, Stack } from 'components/Stack'
import StopOrderTableHeader from 'components/StopOrder/MyOrders/TableHeader'
import { StopOrderRowsSkeleton, StopOrderTabSelector } from 'components/StopOrder/MyOrders/components'
import { PRICE_CHART_QUOTES } from 'constants/tokens'
import { PoolChartSkeleton } from 'pages/Earns/PoolDetail/components/PoolChartState'
import { useShowPricingChart } from 'state/user/hooks'
import { MEDIA_WIDTHS } from 'theme'

/** The shell both right-panel cards share; on phones each runs edge to edge, like the limit-order panel. */
export const STOP_ORDER_CARD_CLASS =
  'w-full gap-0 overflow-hidden rounded-xl border border-background bg-buttonBlack max-sm:-ml-4 max-sm:w-screen max-sm:rounded-none'

/** The price chart card as `TokenPriceChart` first draws it: one pair tab, then the price and the chart. */
const PriceChartCardSkeleton = () => {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  return (
    <Stack className={STOP_ORDER_CARD_CLASS}>
      <HStack className="items-center gap-3 pr-4">
        <HStack className="min-h-11 items-center gap-1.5 px-4 py-3">
          <Skeleton circle height={20} width={20} />
          <Skeleton height={14} width={96} borderRadius={6} />
        </HStack>
        {!upToSmall && (
          <div className="ml-auto">
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
    </Stack>
  )
}

/** The orders card with its controls in place and the table on its first load. */
const OrdersCardSkeleton = () => (
  <Stack className={STOP_ORDER_CARD_CLASS}>
    <div className="flex w-full flex-col">
      <div className="flex min-w-0 items-center border-b border-white-08">
        <StopOrderTabSelector isActiveTab onChange={() => undefined} />
      </div>
      <div className="flex justify-between gap-2 px-4 py-2 max-sm:flex-col">
        <Skeleton height={36} width={130} borderRadius={16} />
        <div className="max-w-[360px] flex-1 max-sm:w-full max-sm:max-w-none max-sm:flex-none">
          <Skeleton height={36} borderRadius={16} containerClassName="block" />
        </div>
      </div>
      <StopOrderTableHeader isActiveTab />
      <div className="min-h-20">
        <StopOrderRowsSkeleton isActiveTab />
      </div>
    </div>
  </Stack>
)

/**
 * Stands in for the stop order right panel while its code loads, card for card, so the page keeps its
 * shape instead of showing a spinner. The chart card follows the same setting and chain check as the panel.
 */
const StopOrderRightPanelSkeleton = () => {
  const { chainId } = useLimitOrderContext()
  const isShowPricingChart = useShowPricingChart()
  const showPriceChart = isShowPricingChart && Boolean(PRICE_CHART_QUOTES[chainId])

  return (
    <>
      {showPriceChart && <PriceChartCardSkeleton />}
      <OrdersCardSkeleton />
    </>
  )
}

export default StopOrderRightPanelSkeleton
