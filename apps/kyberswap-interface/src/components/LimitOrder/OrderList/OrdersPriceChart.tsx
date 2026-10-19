import { Currency } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useMemo } from 'react'

import { useLimitOrderPriceMarkers } from 'components/LimitOrder/hooks/useLimitOrderPriceMarkers'
import { useStopOrderPriceMarkers } from 'components/StopOrder/hooks/useStopOrderPriceMarkers'
import TokenPriceChart from 'components/TokenPriceChart'
import type { PriceMarkerGroup, PriceMarkerOverlay } from 'components/TokenPriceChart/priceMarkers'

type Props = {
  currencyIn?: Currency
  currencyOut?: Currency
  /** The stop order form is on screen, whose triggers are set against the oracle rather than the last trade. */
  isStopOrderPage: boolean
}

/**
 * The pair's price chart with every open order the user has on it — limit orders and stop orders on
 * one scale, each kind in its own colour — whichever of the two forms is on screen.
 */
const OrdersPriceChart = ({ currencyIn, currencyOut, isStopOrderPage }: Props) => {
  const limitOrders = useLimitOrderPriceMarkers({ currencyIn, currencyOut })
  const stopOrders = useStopOrderPriceMarkers({ currencyIn, currencyOut })

  const hasPair = !!currencyIn && !!currencyOut && !currencyIn.wrapped.equals(currencyOut.wrapped)
  const limitGroup = limitOrders.group
  const stopGroup = stopOrders.group
  // The oracle line replaces the last trade's only beside the stop form: that is the price its trigger
  // answers to, while a limit order fills at the market's.
  const referencePrice = isStopOrderPage ? stopOrders.referencePrice : undefined

  const markerOverlay = useMemo<PriceMarkerOverlay | undefined>(() => {
    const groups = [limitGroup, stopGroup].filter((group): group is PriceMarkerGroup => !!group)
    if (!hasPair || (!groups.length && referencePrice === undefined)) return undefined
    return {
      groups,
      referencePrice,
      renderOffscreen: (count, direction) =>
        direction === 'above' ? t`${count} order(s) above` : t`${count} order(s) below`,
    }
  }, [hasPair, limitGroup, stopGroup, referencePrice])

  return (
    <>
      {/* One element for both cases, so resolving the pair re-renders the chart rather than remounting it. */}
      <TokenPriceChart
        flatten
        tokens={hasPair ? [currencyIn] : [currencyIn, currencyOut]}
        quoteCurrency={hasPair ? currencyOut : undefined}
        markerOverlay={markerOverlay}
      />
      {limitOrders.modal}
      {stopOrders.modal}
    </>
  )
}

export default OrdersPriceChart
