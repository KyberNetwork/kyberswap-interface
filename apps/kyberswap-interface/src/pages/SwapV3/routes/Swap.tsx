import { lazy, useState } from 'react'

import { SwapV3Layout, useSwapV3Controller } from 'pages/SwapV3'
import PopulatedSwapForm from 'pages/SwapV3/PopulatedSwapForm'
import { TAB } from 'pages/SwapV3/constants'
import SwapInfo from 'pages/SwapV3/routes/SwapInfo'
import useCurrenciesByPage from 'pages/SwapV3/useCurrenciesByPage'
import type { DetailedRouteSummary } from 'types/route'

const LiquiditySourcesPanel = lazy(() => import('components/swapv2/LiquiditySourcesPanel'))
const SettingsPanel = lazy(() => import('components/swapv2/SwapSettingsPanel'))
const TokenInfoTab = lazy(() => import('components/swapv2/TokenInfo'))

export default function SwapPage() {
  const controller = useSwapV3Controller(TAB.SWAP)
  const { activeTab, highlightDegenMode, onBackToMainTab, setActiveTab } = controller
  const { currencies, currencyIn, currencyOut } = useCurrenciesByPage()
  const [routeSummary, setRouteSummary] = useState<DetailedRouteSummary>()

  return (
    <SwapV3Layout
      controller={controller}
      info={<SwapInfo currencyIn={currencyIn} currencyOut={currencyOut} routeSummary={routeSummary} />}
    >
      <PopulatedSwapForm
        routeSummary={routeSummary}
        setRouteSummary={setRouteSummary}
        hidden={activeTab !== TAB.SWAP}
      />
      {activeTab === TAB.INFO && <TokenInfoTab currencies={currencies} onBack={onBackToMainTab} />}
      {activeTab === TAB.SETTINGS && (
        <SettingsPanel
          isCrossChainPage={false}
          isSwapPage
          highlightDegenMode={highlightDegenMode}
          onBack={onBackToMainTab}
          onClickLiquiditySources={() => setActiveTab(TAB.LIQUIDITY_SOURCES)}
          onClickCrossChainSources={() => setActiveTab(TAB.CROSS_CHAIN_SOURCES)}
        />
      )}
      {activeTab === TAB.LIQUIDITY_SOURCES && <LiquiditySourcesPanel onBack={() => setActiveTab(TAB.SETTINGS)} />}
    </SwapV3Layout>
  )
}
