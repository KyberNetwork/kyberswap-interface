import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useMemo, useState } from 'react'
import { Repeat } from 'react-feather'

import CurrencyLogo from 'components/CurrencyLogo'
import { useLimitOrderPriceMarkers } from 'components/LimitOrder/hooks/useLimitOrderPriceMarkers'
import { HStack } from 'components/Stack'
import { useStopMarketPriceMarkers } from 'components/StopMarket/hooks/useStopMarketPriceMarkers'
import TokenPriceChart from 'components/TokenPriceChart'
import {
  type PriceMarkerGroup,
  type PriceMarkerOverlay,
  invertMarkerOverlay,
} from 'components/TokenPriceChart/priceMarkers'
import { PRICE_CHART_QUOTES } from 'constants/tokens'
import { cn } from 'utils/cn'

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

/** One of the two tokens, offered as its own dollar chart. */
const TokenViewPill = ({
  token,
  isActive,
  onClick,
  dataTestId,
}: {
  token: Currency
  isActive: boolean
  onClick: () => void
  dataTestId: string
}) => (
  <button
    type="button"
    role="tab"
    aria-selected={isActive}
    onClick={onClick}
    data-testid={dataTestId}
    className={cn(
      'flex h-7 shrink-0 cursor-pointer items-center gap-1 rounded-full border-0 pl-1 pr-2.5 text-xs font-medium transition-colors',
      isActive ? 'bg-primary-20 text-primary' : 'bg-buttonGray text-subText hover:text-text',
    )}
  >
    <CurrencyLogo currency={token} size="18px" />
    {token.symbol}
  </button>
)

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

  const renderHeader = ({ expand }: { expand: () => void }) =>
    hasPair && baseCurrency && quoteCurrency ? (
      <HStack
        role="tablist"
        className="min-w-0 flex-1 items-center gap-2 overflow-x-auto px-4 py-2.5"
        data-testid="orders-chart-views"
      >
        <button
          type="button"
          role="tab"
          aria-selected={isPairView}
          onClick={() => {
            setView('pair')
            expand()
          }}
          data-testid="orders-chart-view-pair"
          className={cn(
            'flex shrink-0 cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-base font-medium transition-colors',
            isPairView ? 'text-text' : 'text-subText hover:text-text',
          )}
        >
          {/* The two logos overlap, the base token in front. */}
          <span className="flex shrink-0 items-center">
            <span className="relative z-[1] flex">
              <CurrencyLogo currency={baseCurrency} size="20px" />
            </span>
            <span className="-ml-1.5 flex">
              <CurrencyLogo currency={quoteCurrency} size="20px" />
            </span>
          </span>
          {baseCurrency.symbol}/{quoteCurrency.symbol}
        </button>
        <button
          type="button"
          aria-label={t`Invert pair`}
          data-testid="orders-chart-invert-pair"
          onClick={() => {
            toggleInverted()
            expand()
          }}
          className="flex shrink-0 cursor-pointer items-center border-0 bg-transparent p-0 text-subText transition-colors hover:text-text"
        >
          <Repeat size={14} />
        </button>
        {(canChartIn || canChartOut) && <div className="mx-1 h-4 w-px shrink-0 bg-darkBorder" />}
        {canChartIn && (
          <TokenViewPill
            token={currencyIn}
            isActive={view === 'in'}
            onClick={() => {
              setView('in')
              expand()
            }}
            dataTestId="orders-chart-view-in"
          />
        )}
        {canChartOut && (
          <TokenViewPill
            token={currencyOut}
            isActive={view === 'out'}
            onClick={() => {
              setView('out')
              expand()
            }}
            dataTestId="orders-chart-view-out"
          />
        )}
      </HStack>
    ) : null

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
