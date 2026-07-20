import { Trans } from '@lingui/macro'
import { useMemo } from 'react'
import { useGetNumberOfInsufficientFundOrdersQuery } from 'services/limitOrder'

import { useLimitOrderContext } from 'components/LimitOrder/LimitOrderContext'
import MyOrders from 'components/LimitOrder/MyOrders'
import OrderBook from 'components/LimitOrder/OrderBook'
import { LimitOrderTab } from 'components/LimitOrder/types'
import { HStack, Stack } from 'components/Stack'
import TokenPriceChart from 'components/TokenPriceChart'
import { MouseoverTooltip } from 'components/Tooltip'
import { PRICE_CHART_QUOTE_TOKEN_BY_CHAIN } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import useTab from 'hooks/useTab'
import { useLimitState } from 'state/limit/hooks'
import { cn } from 'utils/cn'

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
      <div className="flex min-w-0 flex-1 items-stretch overflow-x-auto" role="tablist">
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
                  <span className="min-w-4 rounded-full bg-warning-30 px-1.5 text-xs font-medium text-warning">
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

  const hasSupportedTokenPriceChart = Boolean(PRICE_CHART_QUOTE_TOKEN_BY_CHAIN[chainId])
  const tabs = useMemo(
    () => ORDER_LIST_TABS.filter(tab => hasSupportedTokenPriceChart || tab.id !== LimitOrderTab.PRICE),
    [hasSupportedTokenPriceChart],
  )
  const tabIds = useMemo(() => tabs.map(tab => tab.id), [tabs])

  const { activeTab, setActiveTab } = useTab<LimitOrderTab>({
    tabs: tabIds,
    defaultTab: LimitOrderTab.ORDER_BOOK,
    syncQuery: syncOrderListTabWithQuery,
  })
  const currentTab = activeTab || LimitOrderTab.ORDER_BOOK

  return (
    <Stack className="w-full gap-0 overflow-hidden rounded-xl border border-darkBorder max-sm:-ml-4 max-sm:w-screen max-sm:rounded-none">
      <TabSelector setActiveTab={setActiveTab} activeTab={currentTab} tabs={tabs} />

      <Stack className="border-t border-darkBorder">
        {currentTab === LimitOrderTab.ORDER_BOOK && <OrderBook />}
        {currentTab === LimitOrderTab.MY_ORDER && <MyOrders />}
        {currentTab === LimitOrderTab.PRICE && <TokenPriceChart flatten tokens={[currencyIn, currencyOut]} />}
      </Stack>
    </Stack>
  )
}

export default OrderList
