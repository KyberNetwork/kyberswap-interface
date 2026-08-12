import { Trans } from '@lingui/macro'
import { startTransition, useMemo } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useGetNumberOfInsufficientFundOrdersQuery } from 'services/limitOrder'

import { useLimitOrderContext } from 'components/LimitOrder/LimitOrderContext'
import MyOrders from 'components/LimitOrder/MyOrders'
import OrderBook from 'components/LimitOrder/OrderBook'
import { LimitOrderTab } from 'components/LimitOrder/types'
import { HStack, Stack } from 'components/Stack'
import StopLossOrders from 'components/StopLoss/MyOrders'
import TokenPriceChart from 'components/TokenPriceChart'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { isSupportStopLoss } from 'constants/networks'
import { PRICE_CHART_QUOTES } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import usePageLocation from 'hooks/usePageLocation'
import useTab from 'hooks/useTab'
import { useLimitState } from 'state/limit/hooks'
import { cn } from 'utils/cn'
import { getTradeProductPath } from 'utils/routes'

const ORDER_LIST_TABS = [
  {
    id: LimitOrderTab.ORDER_BOOK,
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
  { id: LimitOrderTab.MY_ORDER, label: <Trans>My Order(s)</Trans> },
  {
    id: LimitOrderTab.STOP_LOSS,
    label: (
      <>
        <span className="max-sm:hidden">
          <Trans>Stop Loss Order(s)</Trans>
        </span>
        <span className="sm:hidden">
          <Trans>Stop Loss</Trans>
        </span>
      </>
    ),
  },
  { id: LimitOrderTab.PRICE, label: <Trans>Price</Trans> },
] as const

type OrderListTabItem = (typeof ORDER_LIST_TABS)[number]

type TabSelectorProps = {
  activeTab: LimitOrderTab
  setActiveTab: (activeTab: LimitOrderTab) => void
  tabs: readonly OrderListTabItem[]
}

const TabSelector = ({ activeTab, setActiveTab, tabs }: TabSelectorProps) => {
  const { account } = useActiveWeb3React()
  const { chainId } = useLimitOrderContext()

  const { data: numberOfInsufficientFundOrders } = useGetNumberOfInsufficientFundOrdersQuery(
    { chainId, maker: account || '' },
    { skip: !account, pollingInterval: 10_000 },
  )

  return (
    <HStack className="items-center gap-3 bg-background pr-4">
      <div className="flex min-w-0 flex-1 items-stretch overflow-x-auto" role="tablist" data-testid="order-list-tabs">
        {tabs.map((tab, index) => {
          const active = tab.id === activeTab
          const isLast = index === tabs.length - 1
          return (
            <button
              key={tab.id}
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              type="button"
              data-testid={`order-list-tab-${tab.id}`}
              className={cn(
                'relative flex min-h-11 shrink-0 cursor-pointer items-center gap-1 border-0 px-4 py-3 text-sm font-medium',
                !isLast && 'border-r border-darkBorder',
                active
                  ? 'bg-primary-15 text-primary shadow-[inset_0_-2px_0_var(--ks-primary)] hover:bg-primary-20 hover:text-primary'
                  : 'bg-transparent text-subText hover:bg-tabActive-80 hover:text-text',
              )}
            >
              <span className="text-base font-medium leading-[normal]" style={{ color: 'inherit' }}>
                {tab.label}
              </span>
              {tab.id === LimitOrderTab.MY_ORDER && !!numberOfInsufficientFundOrders && (
                <MouseoverTooltip
                  placement="top"
                  text={
                    <Trans>
                      You have {numberOfInsufficientFundOrders} active orders that don&apos;t have sufficient funds.
                    </Trans>
                  }
                >
                  <span
                    className="min-w-4 rounded-full bg-warning-30 px-1.5 text-xs font-medium text-warning"
                    data-testid="order-list-insufficient-funds-badge"
                  >
                    {numberOfInsufficientFundOrders}
                  </span>
                </MouseoverTooltip>
              )}
            </button>
          )
        })}
      </div>
    </HStack>
  )
}

const OrderList = () => {
  const { chainId, syncOrderListTabWithQuery } = useLimitOrderContext()
  const { currencyIn, currencyOut } = useLimitState()
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const { network, currency } = useParams<{ network: string; currency?: string }>()

  const isStopLossPage = getTradeProductPath(pathname) === APP_PATHS.STOP_LOSS
  // Partner embeds have no :network segment and no stop-loss route, so offering the tab there would
  // navigate the iframe to a malformed path in the host app.
  const { isEmbeddedSwap } = usePageLocation()
  const stopLossSupported = isSupportStopLoss(chainId) && !isEmbeddedSwap

  const hasSupportedTokenPriceChart = Boolean(PRICE_CHART_QUOTES[chainId])
  const tabs = useMemo(
    () =>
      ORDER_LIST_TABS.filter(
        tab =>
          (hasSupportedTokenPriceChart || tab.id !== LimitOrderTab.PRICE) &&
          (stopLossSupported || tab.id !== LimitOrderTab.STOP_LOSS),
      ),
    [hasSupportedTokenPriceChart, stopLossSupported],
  )
  const tabIds = useMemo(() => tabs.map(tab => tab.id), [tabs])

  const { activeTab, setActiveTab } = useTab<LimitOrderTab>({
    tabs: tabIds,
    defaultTab: isStopLossPage ? LimitOrderTab.STOP_LOSS : LimitOrderTab.ORDER_BOOK,
    syncQuery: syncOrderListTabWithQuery,
  })
  const currentTab = activeTab || (isStopLossPage ? LimitOrderTab.STOP_LOSS : LimitOrderTab.ORDER_BOOK)

  /**
   * Each order type owns a route, so picking the other product's tab has to move the page as well as
   * the panel — otherwise the card and the list below it would be showing different products.
   */
  const onSelectTab = (tab: LimitOrderTab) => {
    // Price is product-neutral, so selecting it must not drag the user off the route they are on and
    // discard the form they were filling in.
    if (tab === LimitOrderTab.PRICE) {
      setActiveTab(tab)
      return
    }

    const wantsStopLoss = tab === LimitOrderTab.STOP_LOSS
    if (wantsStopLoss !== isStopLossPage) {
      const nextProduct = wantsStopLoss ? APP_PATHS.STOP_LOSS : APP_PATHS.LIMIT
      const nextSearch = new URLSearchParams(search)
      nextSearch.set('tab', tab)
      // Keeps the current panel on screen while the destination chunk loads — see OrderTypeSubTabs.
      startTransition(() => {
        navigate({
          pathname: `${nextProduct}/${network || ''}${currency ? `/${currency}` : ''}`,
          search: nextSearch.toString(),
        })
      })
      return
    }
    setActiveTab(tab)
  }

  return (
    <Stack className="w-full gap-0 overflow-hidden rounded-xl border border-darkBorder max-sm:-ml-4 max-sm:w-screen max-sm:rounded-none">
      <TabSelector setActiveTab={onSelectTab} activeTab={currentTab} tabs={tabs} />

      <Stack className="border-t border-darkBorder">
        {currentTab === LimitOrderTab.ORDER_BOOK && <OrderBook />}
        {currentTab === LimitOrderTab.MY_ORDER && <MyOrders />}
        {currentTab === LimitOrderTab.STOP_LOSS && <StopLossOrders />}
        {currentTab === LimitOrderTab.PRICE && <TokenPriceChart flatten tokens={[currencyIn, currencyOut]} />}
      </Stack>
    </Stack>
  )
}

export default OrderList
