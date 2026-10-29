import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useMemo, useState } from 'react'
import { Repeat } from 'react-feather'

import CurrencyLogo from 'components/CurrencyLogo'
import { useLimitOrderPriceMarkers } from 'components/LimitOrder/hooks/useLimitOrderPriceMarkers'
import SegmentedControl, { type SegmentedControlOption } from 'components/SegmentedControl'
import { useStopMarketPriceMarkers } from 'components/StopMarket/hooks/useStopMarketPriceMarkers'
import TokenPriceChart from 'components/TokenPriceChart'
import {
  type PriceMarkerGroup,
  type PriceMarkerOverlay,
  invertMarkerOverlay,
} from 'components/TokenPriceChart/priceMarkers'
import { PRICE_CHART_QUOTES } from 'constants/tokens'

type Props = {
  currencyIn?: Currency
  currencyOut?: Currency
  /** The stop market order form is on screen, whose triggers are set against the oracle rather than the last trade. */
  isStopMarketPage: boolean
}

/** What the chart draws: the pair, or either of its tokens on its own against the dollar. */
type ChartView = 'pair' | 'in' | 'out'

/** The choice made for one pair; another pair starts over from the pair chart. */
type ViewState = { pairKey: string; view: ChartView; isInverted: boolean }

/** The chain's dollar quote is what every other token is priced in, so it has no dollar chart of its own. */
const hasOwnChart = (token: Currency) => {
  const quote = PRICE_CHART_QUOTES[token.chainId as ChainId]
  return !quote || !token.wrapped.equals(quote)
}

/**
 * The pair's price chart with every open order the user has on it — limit orders and stop market orders on
 * one scale, each kind in its own colour — whichever of the two forms is on screen. The head of the card
 * picks what is drawn: the pair, which reads either way round, or one of its tokens priced in dollars,
 * on which the orders have no level to sit at.
 */
const OrdersPriceChart = ({ currencyIn, currencyOut, isStopMarketPage }: Props) => {
  const hasPair = !!currencyIn && !!currencyOut && !currencyIn.wrapped.equals(currencyOut.wrapped)
  const pairKey = hasPair ? `${currencyIn.wrapped.address}:${currencyOut.wrapped.address}` : ''
  const canChartIn = !!currencyIn && hasOwnChart(currencyIn)
  const canChartOut = !!currencyOut && hasOwnChart(currencyOut)

  const [viewState, setViewState] = useState<ViewState>()
  const current = viewState?.pairKey === pairKey ? viewState : undefined
  const isInverted = current?.isInverted ?? false
  const chosenView = current?.view ?? 'pair'
  // A token with no chart of its own falls back to the pair rather than to an empty card.
  const view: ChartView =
    (chosenView === 'in' && !canChartIn) || (chosenView === 'out' && !canChartOut) ? 'pair' : chosenView
  const isPairView = view === 'pair'
  const setView = (next: ChartView) =>
    setViewState(state => ({ pairKey, view: next, isInverted: state?.pairKey === pairKey && state.isInverted }))
  // The pair read as the sell token per receive token; the orders keep their own terms either way.
  const toggleInverted = () =>
    setViewState(state => ({ pairKey, view: 'pair', isInverted: !(state?.pairKey === pairKey && state.isInverted) }))

  // Only the pair chart has a level for an order to sit at, so a dollar chart fetches none of them.
  const limitOrders = useLimitOrderPriceMarkers({ currencyIn, currencyOut, enabled: isPairView })
  // The oracle line replaces the last trade's only beside the stop form: that is the price its trigger
  // answers to, while a limit order fills at the market's.
  const stopMarkets = useStopMarketPriceMarkers({
    currencyIn,
    currencyOut,
    enabled: isPairView,
    withOraclePrice: isPairView && isStopMarketPage,
  })
  const referencePrice = isStopMarketPage ? stopMarkets.referencePrice : undefined
  const limitGroup = limitOrders.group
  const stopGroup = stopMarkets.group

  const markerOverlay = useMemo<PriceMarkerOverlay | undefined>(() => {
    if (!hasPair || !isPairView) return undefined
    const groups = [limitGroup, stopGroup].filter((group): group is PriceMarkerGroup => !!group)
    if (!groups.length && referencePrice === undefined) return undefined
    const overlay = { groups, referencePrice }
    return isInverted ? invertMarkerOverlay(overlay) : overlay
  }, [hasPair, isPairView, limitGroup, stopGroup, referencePrice, isInverted])

  const [baseCurrency, quoteCurrency] = isInverted ? [currencyOut, currencyIn] : [currencyIn, currencyOut]
  const chartTokens = isPairView ? [baseCurrency] : view === 'in' ? [currencyIn] : [currencyOut]

  const renderHeader = ({ expand }: { expand: () => void }) => {
    if (!hasPair || !baseCurrency || !quoteCurrency) return null

    const options: SegmentedControlOption<ChartView>[] = [
      {
        value: 'pair',
        dataTestId: 'orders-chart-view-pair',
        label: (
          <span className="flex items-center justify-center gap-1.5 whitespace-nowrap font-medium">
            {/* The two logos overlap, the base token in front. */}
            <span className="flex shrink-0 items-center">
              <span className="relative z-[1] flex">
                <CurrencyLogo currency={baseCurrency} size="20px" />
              </span>
              <span className="-ml-1.5 flex">
                <CurrencyLogo currency={quoteCurrency} size="20px" />
              </span>
            </span>
            <span className="inline-flex font-medium">
              <span>{baseCurrency.symbol}</span>
              <span>/</span>
              <span>{quoteCurrency.symbol}</span>
            </span>
          </span>
        ),
        trailingAction: (
          <button
            type="button"
            aria-label={t`Invert pair`}
            data-testid="orders-chart-invert-pair"
            onClick={() => {
              toggleInverted()
              expand()
            }}
            className="flex cursor-pointer items-center border-0 bg-transparent p-0 text-subText transition-colors hover:text-text"
          >
            <Repeat size={14} />
          </button>
        ),
      },
    ]

    const tokenViews = [
      { value: 'in', token: currencyIn, canChart: canChartIn },
      { value: 'out', token: currencyOut, canChart: canChartOut },
    ] as const

    tokenViews.forEach(({ value, token, canChart }) => {
      if (!token || !canChart) return
      const quoteSymbol = PRICE_CHART_QUOTES[token.chainId as ChainId]?.symbol
      options.push({
        value,
        dataTestId: `orders-chart-view-${value}`,
        label: (
          <span className="flex items-center justify-center gap-1 whitespace-nowrap px-1 font-medium">
            <CurrencyLogo currency={token} size="20px" />
            {token.symbol}
            <span className="text-xs font-medium">
              <Trans>in {quoteSymbol}</Trans>
            </span>
          </span>
        ),
      })
    })

    return (
      <div className="min-w-0 flex-1 overflow-x-auto px-4 py-3" data-testid="orders-chart-views">
        <div className="w-max">
          <SegmentedControl
            color="primary"
            equalWidth={false}
            value={view}
            options={options}
            onChange={next => {
              setView(next)
              expand()
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <>
      {/* One element for every view, so switching re-renders the chart rather than remounting the card. */}
      <TokenPriceChart
        flatten
        tokens={hasPair ? chartTokens : [currencyIn, currencyOut]}
        quoteCurrency={hasPair && isPairView ? quoteCurrency : undefined}
        markerOverlay={markerOverlay}
        header={hasPair ? renderHeader : undefined}
      />
      {limitOrders.modal}
      {stopMarkets.modal}
    </>
  )
}

export default OrdersPriceChart
