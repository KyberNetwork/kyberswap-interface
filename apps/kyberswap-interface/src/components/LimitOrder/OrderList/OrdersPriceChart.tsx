import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { Check } from 'react-feather'

import { useLimitOrderPriceMarkers } from 'components/LimitOrder/hooks/useLimitOrderPriceMarkers'
import { HStack } from 'components/Stack'
import { useStopMarketPriceMarkers } from 'components/StopMarket/hooks/useStopMarketPriceMarkers'
import TokenPriceChart from 'components/TokenPriceChart'
import type { PriceMarkerGroup, PriceMarkerOverlay } from 'components/TokenPriceChart/priceMarkers'
import { isSupportStopMarket } from 'constants/networks'
import { cn } from 'utils/cn'

type Props = {
  currencyIn?: Currency
  currencyOut?: Currency
  /** The stop market order form is on screen, whose triggers are set against the oracle rather than the last trade. */
  isStopMarketPage: boolean
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
 * The pair's price chart with every open order the user has on it — limit orders and stop market orders on
 * one scale, each kind in its own colour — whichever of the two forms is on screen. A legend under the
 * chart turns each kind of line, and the market price, on and off.
 */
const OrdersPriceChart = ({ currencyIn, currencyOut, isStopMarketPage }: Props) => {
  const [showLimitOrders, setShowLimitOrders] = useState(true)
  // Stop market orders are drawn by default beside the stop form only, and the default returns with each form.
  const [showStopMarkets, setShowStopMarkets] = useState(isStopMarketPage)
  useEffect(() => setShowStopMarkets(isStopMarketPage), [isStopMarketPage])
  const [showMarketPrice, setShowMarketPrice] = useState(true)
  const stopMarketsSupported = !!currencyIn && isSupportStopMarket(currencyIn.chainId)

  const limitOrders = useLimitOrderPriceMarkers({ currencyIn, currencyOut })
  // Fetched only while something reads it: the stop lines, or the oracle line beside the stop form.
  const stopMarkets = useStopMarketPriceMarkers({
    currencyIn,
    currencyOut,
    enabled: showStopMarkets || isStopMarketPage,
  })

  const hasPair = !!currencyIn && !!currencyOut && !currencyIn.wrapped.equals(currencyOut.wrapped)
  const limitGroup = showLimitOrders ? limitOrders.group : undefined
  const stopGroup = showStopMarkets ? stopMarkets.group : undefined
  // The oracle line replaces the last trade's only beside the stop form: that is the price its trigger
  // answers to, while a limit order fills at the market's.
  const referencePrice = isStopMarketPage ? stopMarkets.referencePrice : undefined

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
      {stopMarketsSupported && (
        <LegendToggle
          isOn={showStopMarkets}
          onToggle={() => setShowStopMarkets(value => !value)}
          dataTestId="orders-chart-legend-stop"
        >
          <Trans>Stop Market</Trans>
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
      {stopMarkets.modal}
    </>
  )
}

export default OrdersPriceChart
