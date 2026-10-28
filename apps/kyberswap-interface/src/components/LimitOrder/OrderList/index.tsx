import { Trans, t } from '@lingui/macro'
import { useEffect, useRef, useState } from 'react'
import { ChevronRight, ChevronUp, List, TrendingUp } from 'react-feather'
import { useLocation, useSearchParams } from 'react-router-dom'
import { useGetNumberOfInsufficientFundOrdersQuery } from 'services/limitOrder'

import History from 'components/Icons/History'
import { useLimitOrderContext } from 'components/LimitOrder/LimitOrderContext'
import MyOrders from 'components/LimitOrder/MyOrders'
import { LIST_ORDER_TABS } from 'components/LimitOrder/MyOrders/utils'
import OrderBook from 'components/LimitOrder/OrderBook'
import PanelTabs, {
  OrderKindTabs,
  OrderListToolbar,
  OrderPanelCard,
  PanelTab,
} from 'components/LimitOrder/OrderList/OrderListComponents'
import OrdersPriceChart from 'components/LimitOrder/OrderList/OrdersPriceChart'
import { useOpenOrderCounts } from 'components/LimitOrder/hooks/useOpenOrderCounts'
import { LimitOrderStatus, LimitOrderTab, OrderKind, ShowOrdersState } from 'components/LimitOrder/types'
import { Stack } from 'components/Stack'
import StopMarkets from 'components/StopMarket/MyOrders'
import { useStopMarketOrderWarning } from 'components/StopMarket/hooks/useStopMarketOrderWarning'
import { APP_PATHS } from 'constants/index'
import { isSupportStopMarket } from 'constants/networks'
import { PRICE_CHART_QUOTES } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import useTab from 'hooks/useTab'
import { useLimitState } from 'state/limit/hooks'
import { useShowPricingChart } from 'state/user/hooks'
import { cn } from 'utils/cn'
import { getTradeProductPath } from 'utils/routes'

type MarketTab = LimitOrderTab.PRICE | LimitOrderTab.ORDER_BOOK
type OrdersTab = LimitOrderStatus.ACTIVE | LimitOrderStatus.CLOSED | LimitOrderTab.ORDER_BOOK

const isMarketTab = (value: string | null): value is MarketTab =>
  value === LimitOrderTab.PRICE || value === LimitOrderTab.ORDER_BOOK

const OpenLimitOrders = ({ count, onShowOrders }: { count: number; onShowOrders: () => void }) => {
  const { account } = useActiveWeb3React()

  return (
    <>
      <OrderBook />

      {account && count > 0 && (
        <div className="flex justify-end border-t border-darkBorder px-4 py-3">
          <button
            type="button"
            onClick={onShowOrders}
            className="flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-sm font-medium text-primary hover:brightness-125"
          >
            <Trans>View my open orders ({count})</Trans>
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      )}
    </>
  )
}

/**
 * The right column Limit Order and Stop Market share: the pair's chart and the user's own orders,
 * or the book of open limit orders.
 */
const OrderList = () => {
  const { account } = useActiveWeb3React()
  const { chainId, syncOrderListTabWithQuery } = useLimitOrderContext()
  const { currencyIn, currencyOut } = useLimitState()
  const { pathname, key: locationKey, state: locationState } = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const isShowPricingChart = useShowPricingChart()

  const isStopMarketPage = getTradeProductPath(pathname) === APP_PATHS.STOP_MARKET
  const showStopMarkets = isSupportStopMarket(chainId)
  const hasChart = isShowPricingChart && Boolean(PRICE_CHART_QUOTES[chainId])
  const hasOrderBook = !isStopMarketPage
  const formKind = isStopMarketPage && showStopMarkets ? OrderKind.STOP : OrderKind.LIMIT

  const { activeTab: orderTab, setActiveTab: setOrderTab } = useTab<LimitOrderStatus>({
    tabs: LIST_ORDER_TABS,
    queryKey: 'orderTab',
    defaultTab: LimitOrderStatus.ACTIVE,
    syncQuery: syncOrderListTabWithQuery,
  })

  const [chosenKind, setChosenKind] = useState(formKind)
  const [isMarketCollapsed, setIsMarketCollapsed] = useState(false)
  const [localMarketTab, setLocalMarketTab] = useState<MarketTab>(LimitOrderTab.PRICE)
  const [shouldScrollToOrders, setShouldScrollToOrders] = useState(false)
  const ordersCardRef = useRef<HTMLDivElement>(null)
  const [toolbarActionsContainer, setToolbarActionsContainer] = useState<HTMLDivElement | null>(null)

  const counts = useOpenOrderCounts(chainId)
  const { data: insufficientFundOrders = 0 } = useGetNumberOfInsufficientFundOrdersQuery(
    { chainId, maker: account || '' },
    { skip: !account, pollingInterval: 10_000, skipPollingIfUnfocused: true, refetchOnFocus: true },
  )

  // The URL owns the market tab on trade pages; embedded panels keep their own choice.
  const tabQuery = searchParams.get('tab')
  const chosenMarketTab = syncOrderListTabWithQuery
    ? isMarketTab(tabQuery)
      ? tabQuery
      : LimitOrderTab.PRICE
    : localMarketTab
  const marketTab = hasOrderBook ? chosenMarketTab : LimitOrderTab.PRICE
  const isOrderBook = marketTab === LimitOrderTab.ORDER_BOOK
  const isActiveTab = orderTab !== LimitOrderStatus.CLOSED
  const stopMarketWarning = useStopMarketOrderWarning(showStopMarkets && isActiveTab)
  const kind = showStopMarkets ? chosenKind : OrderKind.LIMIT

  const requestedKind = (locationState as ShowOrdersState | null)?.showOrders
  const requestedTab = (locationState as ShowOrdersState | null)?.orderTab
  const stopMarketResetKey = requestedKind === OrderKind.STOP ? locationKey : undefined

  const orderBookTab = {
    id: LimitOrderTab.ORDER_BOOK as const,
    label: (
      <>
        <span className="max-sm:hidden">
          <Trans>Open Limit Orders</Trans>
        </span>
        <span className="sm:hidden">
          <Trans>Open Orders</Trans>
        </span>
      </>
    ),
  }
  const marketTabs: PanelTab<MarketTab>[] = [
    {
      id: LimitOrderTab.PRICE,
      label: (
        <>
          <TrendingUp size={16} aria-hidden="true" />
          <Trans>Price & My Orders</Trans>
        </>
      ),
    },
    ...(hasOrderBook ? [orderBookTab] : []),
  ]

  const selectMarketTab = (tab: MarketTab) => {
    if (!syncOrderListTabWithQuery) {
      setLocalMarketTab(tab)
      return
    }

    const next = new URLSearchParams(searchParams)
    next.set('tab', tab)
    setSearchParams(next, { replace: true })
  }

  const handleMarketTabChange = (tab: MarketTab) => {
    selectMarketTab(tab)
    setIsMarketCollapsed(false)
  }

  const selectOrdersTab = (tab: OrdersTab) => {
    if (tab === LimitOrderTab.ORDER_BOOK) {
      selectMarketTab(tab)
    } else if (hasChart) {
      setOrderTab(tab)
    } else if (syncOrderListTabWithQuery) {
      // Leave the book and select Active/History in one navigation.
      const next = new URLSearchParams(searchParams)
      next.set('tab', LimitOrderTab.PRICE)
      next.set('orderTab', tab)
      setSearchParams(next, { replace: true })
    } else {
      setLocalMarketTab(LimitOrderTab.PRICE)
      setOrderTab(tab)
    }
  }

  const showOrders = (nextKind: OrderKind, nextTab = LimitOrderStatus.ACTIVE) => {
    setChosenKind(nextKind)

    if (syncOrderListTabWithQuery) {
      const next = new URLSearchParams(searchParams)
      next.set('tab', LimitOrderTab.PRICE)
      next.set('orderTab', nextTab)
      setSearchParams(next, { replace: true })
    } else {
      setLocalMarketTab(LimitOrderTab.PRICE)
      setOrderTab(nextTab)
    }

    setShouldScrollToOrders(true)
  }

  // Follow the form only when the product changes, preserving manual list selections otherwise.
  useEffect(() => setChosenKind(formKind), [formKind])

  useEffect(() => {
    if (!shouldScrollToOrders || marketTab === LimitOrderTab.ORDER_BOOK) return

    ordersCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setShouldScrollToOrders(false)
  }, [marketTab, shouldScrollToOrders])

  // A link can carry the kind of order to open, as the form's "Review orders" does. Every click is its own
  // navigation, so it opens them again after the user has switched to the other kind.
  const showOrdersRef = useRef(showOrders)
  showOrdersRef.current = showOrders
  useEffect(() => {
    if (requestedKind) showOrdersRef.current(requestedKind, requestedTab)
  }, [locationKey, requestedKind, requestedTab])

  // Links to the user's limit orders — a placed order's "View order", a notification — name them in `tab`.
  useEffect(() => {
    if (tabQuery !== LimitOrderTab.MY_ORDER) return

    // Consume the deep link, so later filter changes do not select Limit again.
    showOrdersRef.current(OrderKind.LIMIT, isActiveTab ? LimitOrderStatus.ACTIVE : LimitOrderStatus.CLOSED)
  }, [tabQuery, locationKey, isActiveTab])

  return (
    <>
      {hasChart && (
        <OrderPanelCard data-testid="order-panel-market">
          <PanelTabs
            tabs={marketTabs}
            activeTab={marketTab}
            onChange={handleMarketTabChange}
            dataTestId="order-market-tab"
            rightSlot={
              <button
                type="button"
                aria-label={isMarketCollapsed ? t`Expand` : t`Collapse`}
                aria-expanded={!isMarketCollapsed}
                data-testid="order-market-collapse"
                onClick={() => setIsMarketCollapsed(collapsed => !collapsed)}
                className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-subText transition-colors hover:bg-tabActive-80 hover:text-text"
              >
                <ChevronUp
                  size={18}
                  className={cn('transition-transform duration-200', isMarketCollapsed && 'rotate-180')}
                />
              </button>
            }
          />
          {!isMarketCollapsed && (
            <Stack className="border-t border-darkBorder">
              {marketTab === LimitOrderTab.PRICE ? (
                <OrdersPriceChart
                  currencyIn={currencyIn}
                  currencyOut={currencyOut}
                  isStopMarketPage={isStopMarketPage}
                  onShowOrders={orderKind => showOrders(orderKind === 'stop' ? OrderKind.STOP : OrderKind.LIMIT)}
                />
              ) : (
                <OpenLimitOrders count={counts.limit} onShowOrders={() => showOrders(OrderKind.LIMIT)} />
              )}
            </Stack>
          )}
        </OrderPanelCard>
      )}

      <OrderPanelCard
        ref={ordersCardRef}
        className={cn('scroll-mt-4', hasChart && isOrderBook && 'hidden')}
        data-testid="order-panel-orders"
      >
        <PanelTabs<OrdersTab>
          tabs={[
            {
              id: LimitOrderStatus.ACTIVE,
              label: (
                <>
                  <List size={20} className="shrink-0" aria-hidden="true" />
                  <Trans>Active Order</Trans>
                </>
              ),
            },
            {
              id: LimitOrderStatus.CLOSED,
              label: (
                <>
                  <span className="flex shrink-0" aria-hidden="true">
                    <History size={20} />
                  </span>
                  <span className="max-sm:hidden">
                    <Trans>Order History</Trans>
                  </span>
                  <span className="sm:hidden">
                    <Trans>History</Trans>
                  </span>
                </>
              ),
            },
            ...(!hasChart && hasOrderBook ? [orderBookTab] : []),
          ]}
          activeTab={
            !hasChart && isOrderBook
              ? LimitOrderTab.ORDER_BOOK
              : isActiveTab
              ? LimitOrderStatus.ACTIVE
              : LimitOrderStatus.CLOSED
          }
          onChange={selectOrdersTab}
          dataTestId="order-tab"
        />
        {!hasChart && isOrderBook && (
          <Stack className="border-t border-darkBorder">
            <OpenLimitOrders count={counts.limit} onShowOrders={() => showOrders(OrderKind.LIMIT)} />
          </Stack>
        )}
        <Stack className={cn('border-t border-darkBorder', !hasChart && isOrderBook && 'hidden')}>
          <OrderListToolbar>
            <OrderKindTabs
              showStopMarkets={showStopMarkets}
              kind={kind}
              counts={isActiveTab ? counts : undefined}
              insufficientFundOrders={insufficientFundOrders}
              stopMarketWarning={stopMarketWarning}
              onChange={setChosenKind}
            />
            <div ref={setToolbarActionsContainer} className="flex flex-1 justify-end empty:hidden" />
          </OrderListToolbar>
          {kind === OrderKind.STOP ? (
            <StopMarkets
              isActiveTab={isActiveTab}
              resetFiltersKey={stopMarketResetKey}
              toolbarActionsContainer={toolbarActionsContainer}
            />
          ) : (
            <MyOrders isActiveTab={isActiveTab} toolbarActionsContainer={toolbarActionsContainer} />
          )}
        </Stack>
      </OrderPanelCard>
    </>
  )
}

export default OrderList
