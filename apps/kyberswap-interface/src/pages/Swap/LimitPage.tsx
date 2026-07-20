import { lazy } from 'react'

import LimitOrderForm from 'components/LimitOrder/Form/LimitOrderForm'
import { useCurrenciesByPage } from 'pages/Swap/hooks/useCurrenciesByPage'
import { useTradeController } from 'pages/Swap/hooks/useTradeController'
import { SwapLayout } from 'pages/Swap/layout/SwapLayout'
import { TAB } from 'pages/Swap/layout/Tabs'

const OrderList = lazy(() => import('components/LimitOrder/OrderList'))
const SwapSettingsPanel = lazy(() => import('pages/Swap/components/SwapSettingsPanel'))
const TokenInfo = lazy(() => import('components/TokenInfo'))

const LimitPage = () => {
  const controller = useTradeController(TAB.LIMIT)
  const { activeTab, highlightDegenMode, onBackToMainTab, setActiveTab } = controller
  const { currencies } = useCurrenciesByPage()

  return (
    <SwapLayout controller={controller} rightPanel={<OrderList />}>
      {activeTab === TAB.LIMIT && <LimitOrderForm />}
      {activeTab === TAB.INFO && <TokenInfo currencies={currencies} onBack={onBackToMainTab} />}
      {activeTab === TAB.SETTINGS && (
        <SwapSettingsPanel
          isCrossChainPage={false}
          isSwapPage={false}
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
