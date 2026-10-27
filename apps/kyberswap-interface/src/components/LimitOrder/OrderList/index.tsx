import { Trans, t } from '@lingui/macro'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { ChevronRight, ChevronUp, TrendingUp } from 'react-feather'
import { useLocation, useSearchParams } from 'react-router-dom'
import { useGetNumberOfInsufficientFundOrdersQuery } from 'services/limitOrder'

import { useLimitOrderContext } from 'components/LimitOrder/LimitOrderContext'
import MyOrders from 'components/LimitOrder/MyOrders'
import { LIST_ORDER_TABS } from 'components/LimitOrder/MyOrders/utils'
import OrderBook from 'components/LimitOrder/OrderBook'
import { ORDER_PANEL_CARD_CLASS } from 'components/LimitOrder/OrderList/OrderListSkeleton'
import OrdersPriceChart from 'components/LimitOrder/OrderList/OrdersPriceChart'
import { useOpenOrderCounts } from 'components/LimitOrder/hooks/useOpenOrderCounts'
import { LimitOrderStatus, LimitOrderTab, OrderKind, ShowOrdersState } from 'components/LimitOrder/types'
import { HStack, Stack } from 'components/Stack'
import StopMarkets from 'components/StopMarket/MyOrders'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { isSupportStopMarket } from 'constants/networks'
import { PRICE_CHART_QUOTES } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import useTab from 'hooks/useTab'
import { useLimitState } from 'state/limit/hooks'
import { useShowOpenLimitOrders, useShowPricingChart } from 'state/user/hooks'
import { cn } from 'utils/cn'
import { getTradeProductPath } from 'utils/routes'

type MarketTab = LimitOrderTab.PRICE | LimitOrderTab.ORDER_BOOK

const isMarketTab = (value: string | null): value is MarketTab =>
  value === LimitOrderTab.PRICE || value === LimitOrderTab.ORDER_BOOK

type PanelTab<T extends string> = { id: T; label: ReactNode }

/** The tab bar each card of the panel opens with, as the limit-order panel has always drawn it. */
const PanelTabs = <T extends string>({
  tabs,
  activeTab,
  onChange,
  dataTestId,
  rightSlot,
}: {
  tabs: PanelTab<T>[]
  activeTab: T
  onChange: (tab: T) => void
  dataTestId: string
  /** Controls for the whole card, at the far end of the bar. */
  rightSlot?: ReactNode
}) => (
  <HStack className="items-center gap-3 bg-background pr-4">
    <div className="flex min-w-0 flex-1 items-stretch overflow-x-auto" role="tablist" data-testid={dataTestId}>
      {tabs.map((tab, index) => {
        const active = tab.id === activeTab
        const isLast = index === tabs.length - 1
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            data-testid={`${dataTestId}-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex min-h-11 shrink-0 cursor-pointer items-center gap-1 border-0 px-4 py-3 text-sm font-medium',
              !isLast && 'border-r border-darkBorder',
              active
                ? 'bg-primary-15 text-primary shadow-[inset_0_-2px_0_var(--ks-primary)] hover:bg-primary-20 hover:text-primary'
                : 'bg-transparent text-subText hover:bg-tabActive-80 hover:text-text',
            )}
          >
            <span className="flex items-center gap-1.5 text-base font-medium leading-[normal]">{tab.label}</span>
          </button>
        )
      })}
    </div>
    {rightSlot}
  </HStack>
)

/**
 * Picks which kind of order the list below shows, as text tabs split by a rule. On the Active tab each
 * carries how many orders of its kind are open; History has no such count to give.
 */
const OrderKindTabs = ({
  kind,
  onChange,
  counts,
  insufficientFundOrders,
  showStopMarkets,
}: {
  kind: OrderKind
  onChange: (kind: OrderKind) => void
  /** Open orders by kind, or nothing to show none. */
  counts?: { limit: number; stop: number }
  insufficientFundOrders: number
  showStopMarkets: boolean
}) => {
  const tabs = [
    { id: OrderKind.LIMIT, label: <Trans>Limit Order</Trans>, count: counts?.limit },
    ...(showStopMarkets ? [{ id: OrderKind.STOP, label: <Trans>Stop Market</Trans>, count: counts?.stop }] : []),
  ]

  return (
    <HStack className="items-center gap-0 text-sm font-medium" role="tablist" data-testid="order-kind-tabs">
      {tabs.map((tab, index) => {
        const active = tab.id === kind
        const isLast = index === tabs.length - 1
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            data-testid={`order-kind-tab-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex cursor-pointer items-center gap-1.5 border-0 bg-transparent transition-colors',
              index === 0 ? 'pr-3' : 'pl-3',
              !isLast && 'border-r border-darkBorder',
              active ? 'text-primary' : 'text-subText hover:text-text',
            )}
          >
            {tab.label}
            {!!tab.count && (
              <span
                className={cn(
                  'flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium leading-none transition-colors',
                  active ? 'bg-primary-20 text-primary' : 'bg-white-08 text-subText',
                )}
                data-testid={`order-kind-count-${tab.id}`}
              >
                {tab.count}
              </span>
            )}
            {/* A live warning, not a count: shown only while some limit orders cannot be funded. */}
            {tab.id === OrderKind.LIMIT && insufficientFundOrders > 0 && (
              <MouseoverTooltip
                placement="top"
                text={
                  <Trans>You have {insufficientFundOrders} active orders that don&apos;t have sufficient funds.</Trans>
                }
              >
                <span
                  className="min-w-4 rounded-full bg-warning-30 px-1.5 text-xs font-medium text-warning"
                  data-testid="order-list-insufficient-funds-badge"
                >
                  {insufficientFundOrders}
                </span>
              </MouseoverTooltip>
            )}
          </button>
        )
      })}
    </HStack>
  )
}

const MyOpenOrdersLink = ({ count, onClick }: { count: number; onClick: () => void }) => {
  const { account } = useActiveWeb3React()
  if (!account || count <= 0) return null

  return (
    <div className="flex justify-end border-t border-darkBorder px-4 py-3">
      <button
        type="button"
        onClick={onClick}
        className="flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-sm font-medium text-primary hover:brightness-125"
      >
        <Trans>View my open orders ({count})</Trans>
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </div>
  )
}

/**
 * The right column Limit Order and Stop Market share: the market — the pair's chart with every open order
 * on it, and the book of open limit orders — and below it the user's own orders, one kind at a time.
 */
const OrderList = () => {
  const { account } = useActiveWeb3React()
  const { chainId, syncOrderListTabWithQuery } = useLimitOrderContext()
  const { currencyIn, currencyOut } = useLimitState()
  const { pathname, key: locationKey, state: locationState } = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const isStopMarketPage = getTradeProductPath(pathname) === APP_PATHS.STOP_MARKET
  const showStopMarkets = isSupportStopMarket(chainId)

  // The chart follows the Pricing Chart display setting it shares with Swap.
  const isShowPricingChart = useShowPricingChart()
  const hasChart = isShowPricingChart && Boolean(PRICE_CHART_QUOTES[chainId])
  // Stop market order can hide the open limit orders from its settings; the Limit page always offers them,
  // as it has no settings to bring them back.
  const isShowOpenLimitOrders = useShowOpenLimitOrders()
  const hasOrderBook = !isStopMarketPage || isShowOpenLimitOrders
  const marketTabs: PanelTab<MarketTab>[] = [
    ...(hasChart
      ? [
          {
            id: LimitOrderTab.PRICE as const,
            label: (
              <>
                <TrendingUp size={16} aria-hidden="true" />
                <Trans>Price</Trans>
              </>
            ),
          },
        ]
      : []),
    ...(hasOrderBook
      ? [
          {
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
          },
        ]
      : []),
  ]
  // Folds the market card to its tab bar, leaving the page to the orders.
  const [isMarketCollapsed, setIsMarketCollapsed] = useState(false)

  // A link can name the market tab in `tab`; any other value leaves the choice as it is.
  const tabQuery = searchParams.get('tab')
  const [chosenMarketTab, setChosenMarketTab] = useState<MarketTab | undefined>(
    isMarketTab(tabQuery) ? tabQuery : undefined,
  )
  useEffect(() => {
    if (isMarketTab(tabQuery)) setChosenMarketTab(tabQuery)
  }, [tabQuery])
  // Opens on the chart where there is one, else on the open limit orders; with neither, the market card is left out.
  const marketTab = marketTabs.find(tab => tab.id === chosenMarketTab)?.id ?? marketTabs[0]?.id
  const selectMarketTab = (tab: MarketTab) => {
    setChosenMarketTab(tab)
    if (!syncOrderListTabWithQuery) return
    const next = new URLSearchParams(searchParams)
    next.set('tab', tab)
    setSearchParams(next, { replace: true })
  }

  const { activeTab: orderTab, setActiveTab: setOrderTab } = useTab<LimitOrderStatus>({
    tabs: LIST_ORDER_TABS,
    queryKey: 'orderTab',
    defaultTab: LimitOrderStatus.ACTIVE,
    syncQuery: syncOrderListTabWithQuery,
  })
  const isActiveTab = orderTab !== LimitOrderStatus.CLOSED

  // The list opens on the kind of order the form beside it places, and follows the form when it changes.
  const formKind = isStopMarketPage && showStopMarkets ? OrderKind.STOP : OrderKind.LIMIT
  const [chosenKind, setChosenKind] = useState(formKind)
  useEffect(() => setChosenKind(formKind), [formKind])
  const kind = showStopMarkets ? chosenKind : OrderKind.LIMIT

  const counts = useOpenOrderCounts(chainId)
  const { data: insufficientFundOrders = 0 } = useGetNumberOfInsufficientFundOrdersQuery(
    { chainId, maker: account || '' },
    { skip: !account, pollingInterval: 10_000, skipPollingIfUnfocused: true, refetchOnFocus: true },
  )

  const ordersCardRef = useRef<HTMLDivElement>(null)
  const showMyLimitOrders = () => {
    setChosenKind(OrderKind.LIMIT)
    setOrderTab(LimitOrderStatus.ACTIVE)
    ordersCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const showOpenOrders = (nextKind: OrderKind) => {
    setChosenKind(nextKind)
    setOrderTab(LimitOrderStatus.ACTIVE)
    ordersCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  // A link can carry the kind of order to open, as the form's "Review orders" does. Every click is its own
  // navigation, so it opens them again after the user has switched to the other kind.
  const requestedKind = (locationState as ShowOrdersState | null)?.showOrders
  const showOpenOrdersRef = useRef(showOpenOrders)
  showOpenOrdersRef.current = showOpenOrders
  useEffect(() => {
    if (requestedKind) showOpenOrdersRef.current(requestedKind)
  }, [locationKey, requestedKind])
  // Links to the user's limit orders — a placed order's "View order", a notification — name them in `tab`.
  useEffect(() => {
    if (tabQuery !== LimitOrderTab.MY_ORDER) return
    setChosenKind(OrderKind.LIMIT)
    ordersCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [tabQuery])

  const kindTabs = (
    <OrderKindTabs
      kind={kind}
      onChange={setChosenKind}
      counts={isActiveTab ? counts : undefined}
      insufficientFundOrders={insufficientFundOrders}
      showStopMarkets={showStopMarkets}
    />
  )

  return (
    <>
      {marketTab && (
        <Stack className={ORDER_PANEL_CARD_CLASS} data-testid="order-panel-market">
          <PanelTabs
            tabs={marketTabs}
            activeTab={marketTab}
            onChange={tab => {
              selectMarketTab(tab)
              setIsMarketCollapsed(false)
            }}
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
                  onShowOrders={orderKind => showOpenOrders(orderKind === 'stop' ? OrderKind.STOP : OrderKind.LIMIT)}
                />
              ) : (
                <>
                  <OrderBook />
                  <MyOpenOrdersLink count={counts.limit} onClick={showMyLimitOrders} />
                </>
              )}
            </Stack>
          )}
        </Stack>
      )}

      <Stack ref={ordersCardRef} className={cn(ORDER_PANEL_CARD_CLASS, 'scroll-mt-4')} data-testid="order-panel-orders">
        <PanelTabs
          tabs={[
            { id: LimitOrderStatus.ACTIVE, label: <Trans>Active Order</Trans> },
            {
              id: LimitOrderStatus.CLOSED,
              label: (
                <>
                  <span className="max-sm:hidden">
                    <Trans>Order History</Trans>
                  </span>
                  <span className="sm:hidden">
                    <Trans>History</Trans>
                  </span>
                </>
              ),
            },
          ]}
          activeTab={isActiveTab ? LimitOrderStatus.ACTIVE : LimitOrderStatus.CLOSED}
          onChange={setOrderTab}
          dataTestId="order-tab"
        />
        <Stack className="border-t border-darkBorder">
          {kind === OrderKind.STOP ? (
            <StopMarkets isActiveTab={isActiveTab} toolbar={kindTabs} />
          ) : (
            <MyOrders isActiveTab={isActiveTab} toolbar={kindTabs} />
          )}
        </Stack>
      </Stack>
    </>
  )
}

export default OrderList
