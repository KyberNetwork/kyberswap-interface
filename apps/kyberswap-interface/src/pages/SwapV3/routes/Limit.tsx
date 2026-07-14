import { lazy } from 'react'

import LimitOrderForm from 'components/LimitOrder/Form/LimitOrderForm'
import { SwapV3Layout, useSwapV3Controller } from 'pages/SwapV3'
import { TAB } from 'pages/SwapV3/constants'
import useCurrenciesByPage from 'pages/SwapV3/useCurrenciesByPage'

const OrderList = lazy(() => import('components/LimitOrder/OrderList'))
const SettingsPanel = lazy(() => import('components/swapv2/SwapSettingsPanel'))
const TokenInfoTab = lazy(() => import('components/swapv2/TokenInfo'))

export default function LimitPage() {
  const controller = useSwapV3Controller(TAB.LIMIT)
  const { activeTab, highlightDegenMode, onBackToMainTab, setActiveTab } = controller
  const { currencies } = useCurrenciesByPage()

  return (
    <SwapV3Layout controller={controller} info={<OrderList />}>
      {activeTab === TAB.LIMIT && <LimitOrderForm />}
      {activeTab === TAB.INFO && <TokenInfoTab currencies={currencies} onBack={onBackToMainTab} />}
      {activeTab === TAB.SETTINGS && (
        <SettingsPanel
          isCrossChainPage={false}
          isSwapPage={false}
          highlightDegenMode={highlightDegenMode}
          onBack={onBackToMainTab}
          onClickLiquiditySources={() => setActiveTab(TAB.LIQUIDITY_SOURCES)}
          onClickCrossChainSources={() => setActiveTab(TAB.CROSS_CHAIN_SOURCES)}
        />
      )}
    </SwapV3Layout>
  )
}
