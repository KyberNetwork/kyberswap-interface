import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
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
type Props = { isStopMarketPage?: boolean; customChainId?: ChainId; currencyIn?: Currency; currencyOut?: Currency }

const LimitPage = ({ isStopMarketPage = false, customChainId, currencyIn: input, currencyOut: output }: Props) => {
  const controller = useTradeController(TAB.LIMIT)
  const { activeTab, highlightDegenMode, onBackToMainTab, onTabChange } = controller
  const currencies = useCurrenciesByPage()
  const currencyIn = input ?? currencies.currencyIn
  const currencyOut = output ?? currencies.currencyOut

  return (
    <SwapLayout
      customChainId={customChainId}
      controller={controller}
      rightPanel={<OrderList />}
      rightPanelFallback={<OrderListSkeleton />}
    >
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
            {isStopMarketPage ? <StopMarketForm /> : <LimitOrderForm currencyIn={input} currencyOut={output} />}
          </Suspense>
        </Stack>
      )}
      {activeTab === TAB.INFO && <TokenInfo tokens={[currencyIn, currencyOut]} onBack={onBackToMainTab} />}
      {activeTab === TAB.SETTINGS && (
        <SwapSettingsPanel
          mode={isStopMarketPage ? 'stop-market' : 'limit'}
          highlightDegenMode={highlightDegenMode}
          onBack={onBackToMainTab}
          onClickLiquiditySources={() => onTabChange(TAB.LIQUIDITY_SOURCES)}
          onClickCrossChainSources={() => onTabChange(TAB.CROSS_CHAIN_SOURCES)}
        />
      )}
    </SwapLayout>
  )
}

export default LimitPage
