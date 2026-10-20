import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { Check } from 'react-feather'

import { useLimitOrderPriceMarkers } from 'components/LimitOrder/hooks/useLimitOrderPriceMarkers'
import { HStack } from 'components/Stack'
import { useStopOrderPriceMarkers } from 'components/StopOrder/hooks/useStopOrderPriceMarkers'
import TokenPriceChart from 'components/TokenPriceChart'
import type { PriceMarkerGroup, PriceMarkerOverlay } from 'components/TokenPriceChart/priceMarkers'
import { isSupportStopOrder } from 'constants/networks'
import { cn } from 'utils/cn'

type Props = {
  currencyIn?: Currency
  currencyOut?: Currency
  /** The stop order form is on screen, whose triggers are set against the oracle rather than the last trade. */
  isStopOrderPage: boolean
}

/** One switch of the chart's legend, turning a kind of line on or off. */
const LegendToggle = ({
  isOn,
  onToggle,
  dataTestId,
  children,
}: {
  isOn: boolean
  onToggle: () => void
  dataTestId: string
  children: ReactNode
}) => (
  <button
    type="button"
    aria-pressed={isOn}
    onClick={onToggle}
    data-testid={dataTestId}
    className={cn(
      'flex h-5 cursor-pointer items-center gap-1 rounded border bg-transparent px-1.5 text-[10px] font-medium transition-colors',
      isOn ? 'border-subText/60 text-text' : 'border-border/60 text-gray hover:text-subText',
    )}
  >
    {children}
    {isOn && <Check size={10} />}
  </button>
)

/**
 * The pair's price chart with every open order the user has on it — limit orders and stop orders on
 * one scale, each kind in its own colour — whichever of the two forms is on screen. A legend under the
 * chart turns each kind of line, and the market price, on and off.
 */
const OrdersPriceChart = ({ currencyIn, currencyOut, isStopOrderPage }: Props) => {
  const [showLimitOrders, setShowLimitOrders] = useState(true)
  // Stop orders are drawn by default beside the stop form only, and the default returns with each form.
  const [showStopOrders, setShowStopOrders] = useState(isStopOrderPage)
  useEffect(() => setShowStopOrders(isStopOrderPage), [isStopOrderPage])
  const [showMarketPrice, setShowMarketPrice] = useState(true)
  const stopOrdersSupported = !!currencyIn && isSupportStopOrder(currencyIn.chainId)

  const limitOrders = useLimitOrderPriceMarkers({ currencyIn, currencyOut })
  // Fetched only while something reads it: the stop lines, or the oracle line beside the stop form.
  const stopOrders = useStopOrderPriceMarkers({
    currencyIn,
    currencyOut,
    enabled: showStopOrders || isStopOrderPage,
  })

  const hasPair = !!currencyIn && !!currencyOut && !currencyIn.wrapped.equals(currencyOut.wrapped)
  const limitGroup = showLimitOrders ? limitOrders.group : undefined
  const stopGroup = showStopOrders ? stopOrders.group : undefined
  // The oracle line replaces the last trade's only beside the stop form: that is the price its trigger
  // answers to, while a limit order fills at the market's.
  const referencePrice = isStopOrderPage ? stopOrders.referencePrice : undefined

  const markerOverlay = useMemo<PriceMarkerOverlay | undefined>(() => {
    const groups = [limitGroup, stopGroup].filter((group): group is PriceMarkerGroup => !!group)
    if (!hasPair || (!groups.length && referencePrice === undefined)) return undefined
    return { groups, referencePrice }
  }, [hasPair, limitGroup, stopGroup, referencePrice])

  const legend = hasPair ? (
    <HStack className="flex-wrap items-center gap-2" data-testid="orders-chart-legend">
      <LegendToggle
        isOn={showLimitOrders}
        onToggle={() => setShowLimitOrders(value => !value)}
        dataTestId="orders-chart-legend-limit"
      >
        <Trans>Limit Order</Trans>
      </LegendToggle>
      {stopOrdersSupported && (
        <LegendToggle
          isOn={showStopOrders}
          onToggle={() => setShowStopOrders(value => !value)}
          dataTestId="orders-chart-legend-stop"
        >
          <Trans>Stop Order</Trans>
        </LegendToggle>
      )}
      <LegendToggle
        isOn={showMarketPrice}
        onToggle={() => setShowMarketPrice(value => !value)}
        dataTestId="orders-chart-legend-market"
      >
        <Trans>Market Price</Trans>
      </LegendToggle>
    </HStack>
  ) : undefined

  return (
    <>
      {/* One element for both cases, so resolving the pair re-renders the chart rather than remounting it. */}
      <TokenPriceChart
        flatten
        tokens={hasPair ? [currencyIn] : [currencyIn, currencyOut]}
        quoteCurrency={hasPair ? currencyOut : undefined}
        markerOverlay={markerOverlay}
        showMarketPrice={showMarketPrice}
        footer={legend}
      />
      {limitOrders.modal}
      {stopOrders.modal}
    </>
  )
}

export default OrdersPriceChart
