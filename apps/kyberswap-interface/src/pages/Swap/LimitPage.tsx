import { Suspense, lazy } from 'react'

import LimitOrderForm from 'components/LimitOrder/Form/LimitOrderForm'
import OrderListSkeleton from 'components/LimitOrder/OrderList/OrderListSkeleton'
import Loader from 'components/Loader'
import { Center, Stack } from 'components/Stack'
import OrderTypeSubTabs from 'components/StopMarket/OrderTypeSubTabs'
import { useCurrenciesByPage } from 'pages/Swap/hooks/useCurrenciesByPage'
import { useTradeController } from 'pages/Swap/hooks/useTradeController'
import { SwapLayout } from 'pages/Swap/layout/SwapLayout'
import { TAB } from 'pages/Swap/layout/Tabs'
import { OrderList, SwapSettingsPanel, TokenInfo } from 'pages/Swap/layout/lazyPanels'

const StopMarketForm = lazy(() => import('components/StopMarket/Form/StopMarketForm'))

// Both order routes render the same page so the layout, provider and chart stay mounted.
const LimitPage = ({ isStopMarketPage = false }: { isStopMarketPage?: boolean }) => {
  const controller = useTradeController(TAB.LIMIT)
  const { activeTab, highlightDegenMode, onBackToMainTab, setActiveTab } = controller
  const { currencyIn, currencyOut } = useCurrenciesByPage()

  return (
    <SwapLayout controller={controller} rightPanel={<OrderList />} rightPanelFallback={<OrderListSkeleton />}>
      {activeTab === TAB.LIMIT && (
        <Stack className="gap-4">
          <OrderTypeSubTabs />
          <Suspense
            fallback={
              <Center className="h-40">
                <Loader size="20px" />
              </Center>
            }
          >
            {isStopMarketPage ? <StopMarketForm /> : <LimitOrderForm />}
          </Suspense>
        </Stack>
      )}
      {activeTab === TAB.INFO && <TokenInfo tokens={[currencyIn, currencyOut]} onBack={onBackToMainTab} />}
      {activeTab === TAB.SETTINGS && (
        <SwapSettingsPanel
          isCrossChainPage={false}
          isSwapPage={false}
          isLimitPage={!isStopMarketPage}
          isStopMarketPage={isStopMarketPage}
          highlightDegenMode={highlightDegenMode}
          onBack={onBackToMainTab}
          onClickLiquiditySources={() => setActiveTab(TAB.LIQUIDITY_SOURCES)}
          onClickCrossChainSources={() => setActiveTab(TAB.CROSS_CHAIN_SOURCES)}
        />
      )}
    </SwapLayout>
  )
}

export default LimitPage
