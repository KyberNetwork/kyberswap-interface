import StopOrderForm from 'components/StopOrder/Form/StopOrderForm'
import { useCurrenciesByPage } from 'pages/Swap/hooks/useCurrenciesByPage'
import { useTradeController } from 'pages/Swap/hooks/useTradeController'
import { SwapLayout } from 'pages/Swap/layout/SwapLayout'
import { TAB } from 'pages/Swap/layout/Tabs'
import { StopOrderRightPanel, SwapSettingsPanel, TokenInfo } from 'pages/Swap/layout/lazyPanels'

/**
 * Stop order is a sub-tab of Limit Order on its own route, so it keeps the Limit Order top-level tab
 * selected and reuses the shared trade shell.
 */
const StopOrderPage = () => {
  const controller = useTradeController(TAB.LIMIT)
  const { activeTab, highlightDegenMode, onBackToMainTab, setActiveTab } = controller
  const { currencies } = useCurrenciesByPage()

  return (
    <SwapLayout controller={controller} rightPanel={<StopOrderRightPanel />}>
      {activeTab === TAB.LIMIT && <StopOrderForm />}
      {activeTab === TAB.INFO && <TokenInfo currencies={currencies} onBack={onBackToMainTab} />}
      {activeTab === TAB.SETTINGS && (
        <SwapSettingsPanel
          isCrossChainPage={false}
          isSwapPage={false}
          isStopOrderPage
          highlightDegenMode={highlightDegenMode}
          onBack={onBackToMainTab}
          onClickLiquiditySources={() => setActiveTab(TAB.LIQUIDITY_SOURCES)}
          onClickCrossChainSources={() => setActiveTab(TAB.CROSS_CHAIN_SOURCES)}
        />
      )}
    </SwapLayout>
  )
}

export default StopOrderPage
