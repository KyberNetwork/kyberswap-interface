import StopLossForm from 'components/StopLoss/Form/StopLossForm'
import { useCurrenciesByPage } from 'pages/Swap/hooks/useCurrenciesByPage'
import { useTradeController } from 'pages/Swap/hooks/useTradeController'
import { SwapLayout } from 'pages/Swap/layout/SwapLayout'
import { TAB } from 'pages/Swap/layout/Tabs'
import { OrderList, SwapSettingsPanel, TokenInfo } from 'pages/Swap/layout/lazyPanels'

/**
 * Stop-loss is a sub-tab of Limit Order on its own route, so it keeps the Limit Order top-level tab
 * selected and reuses the shared trade shell.
 */
const StopLossPage = () => {
  const controller = useTradeController(TAB.LIMIT)
  const { activeTab, highlightDegenMode, onBackToMainTab, setActiveTab } = controller
  const { currencies } = useCurrenciesByPage()

  return (
    <SwapLayout controller={controller} rightPanel={<OrderList />}>
      {activeTab === TAB.LIMIT && <StopLossForm />}
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

export default StopLossPage
