import { lazy, useState } from 'react'

import { Stack } from 'components/Stack'
import { loadCrossChainSwap } from 'pages/CrossChainSwap/loader'
import type { Quote } from 'pages/CrossChainSwap/registry'
import { useTradeController } from 'pages/Swap/hooks/useTradeController'
import { SwapLayout } from 'pages/Swap/layout/SwapLayout'
import { TAB } from 'pages/Swap/layout/Tabs'

const CrossChainSwap = lazy(loadCrossChainSwap)
const CrossChainSwapSources = lazy(() => import('pages/CrossChainSwap/components/CrossChainSwapSources'))
const QuoteSteps = lazy(() => import('pages/CrossChainSwap/components/QuoteSteps'))
const SwapSettingsPanel = lazy(() => import('pages/Swap/components/SwapSettingsPanel'))
const TransactionHistory = lazy(() => import('pages/CrossChainSwap/components/TransactionHistory'))

const CrossChainPage = () => {
  const controller = useTradeController(TAB.CROSS_CHAIN)
  const { activeTab, highlightDegenMode, onBackToMainTab, setActiveTab } = controller
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)

  const rightPanel = (
    <Stack className="gap-4">
      <QuoteSteps visible={false} quote={selectedQuote} />
      <TransactionHistory />
    </Stack>
  )

  return (
    <SwapLayout controller={controller} rightPanel={rightPanel}>
      {activeTab === TAB.CROSS_CHAIN && <CrossChainSwap onQuoteChange={setSelectedQuote} />}
      {activeTab === TAB.SETTINGS && (
        <SwapSettingsPanel
          isCrossChainPage
          isSwapPage={false}
          highlightDegenMode={highlightDegenMode}
          onBack={onBackToMainTab}
          onClickLiquiditySources={() => setActiveTab(TAB.LIQUIDITY_SOURCES)}
          onClickCrossChainSources={() => setActiveTab(TAB.CROSS_CHAIN_SOURCES)}
        />
      )}
      {activeTab === TAB.CROSS_CHAIN_SOURCES && <CrossChainSwapSources onBack={() => setActiveTab(TAB.SETTINGS)} />}
    </SwapLayout>
  )
}

export default CrossChainPage
