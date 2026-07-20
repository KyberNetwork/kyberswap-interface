import { lazy, useState } from 'react'

import { PopulatedSwapForm } from 'pages/Swap/components/PopulatedSwapForm'
import { SwapRightPanel } from 'pages/Swap/components/SwapRightPanel'
import { useCurrenciesByPage } from 'pages/Swap/hooks/useCurrenciesByPage'
import { useTradeController } from 'pages/Swap/hooks/useTradeController'
import { SwapLayout } from 'pages/Swap/layout/SwapLayout'
import { TAB } from 'pages/Swap/layout/Tabs'
import type { DetailedRouteSummary } from 'types/route'

const LiquiditySourcesPanel = lazy(() => import('pages/Swap/components/LiquiditySourcesPanel'))
const SwapSettingsPanel = lazy(() => import('pages/Swap/components/SwapSettingsPanel'))
const TokenInfo = lazy(() => import('components/TokenInfo'))

const SwapPage = () => {
  const controller = useTradeController(TAB.SWAP)
  const { activeTab, highlightDegenMode, onBackToMainTab, setActiveTab } = controller
  const { currencies, currencyIn, currencyOut } = useCurrenciesByPage()
  const [routeSummary, setRouteSummary] = useState<DetailedRouteSummary>()

  return (
    <SwapLayout
      controller={controller}
      rightPanel={<SwapRightPanel currencyIn={currencyIn} currencyOut={currencyOut} routeSummary={routeSummary} />}
    >
      <PopulatedSwapForm
        routeSummary={routeSummary}
        setRouteSummary={setRouteSummary}
        hidden={activeTab !== TAB.SWAP}
      />
      {activeTab === TAB.INFO && <TokenInfo currencies={currencies} onBack={onBackToMainTab} />}
      {activeTab === TAB.SETTINGS && (
        <SwapSettingsPanel
          isCrossChainPage={false}
          isSwapPage
          highlightDegenMode={highlightDegenMode}
          onBack={onBackToMainTab}
          onClickLiquiditySources={() => setActiveTab(TAB.LIQUIDITY_SOURCES)}
          onClickCrossChainSources={() => setActiveTab(TAB.CROSS_CHAIN_SOURCES)}
        />
      )}
      {activeTab === TAB.LIQUIDITY_SOURCES && <LiquiditySourcesPanel onBack={() => setActiveTab(TAB.SETTINGS)} />}
    </SwapLayout>
  )
}

export default SwapPage
