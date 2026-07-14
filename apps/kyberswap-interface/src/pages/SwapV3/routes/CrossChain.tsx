import { lazy, useState } from 'react'

import { Stack } from 'components/Stack'
import CrossChainSwap from 'pages/CrossChainSwap'
import type { Quote } from 'pages/CrossChainSwap/registry'
import { SwapV3Layout, useSwapV3Controller } from 'pages/SwapV3'
import { TAB } from 'pages/SwapV3/constants'

const CrossChainSwapSources = lazy(() =>
  import('pages/CrossChainSwap/components/CrossChainSwapSources').then(({ CrossChainSwapSources }) => ({
    default: CrossChainSwapSources,
  })),
)
const QuoteSteps = lazy(() => import('pages/CrossChainSwap/components/QuoteSteps'))
const SettingsPanel = lazy(() => import('components/swapv2/SwapSettingsPanel'))
const TransactionHistory = lazy(() =>
  import('pages/CrossChainSwap/components/TransactionHistory').then(({ TransactionHistory }) => ({
    default: TransactionHistory,
  })),
)

export default function CrossChainPage() {
  const controller = useSwapV3Controller(TAB.CROSS_CHAIN)
  const { activeTab, highlightDegenMode, onBackToMainTab, setActiveTab } = controller
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)

  const info = (
    <Stack className="gap-4">
      <QuoteSteps visible={false} quote={selectedQuote} />
      <TransactionHistory />
    </Stack>
  )

  return (
    <SwapV3Layout controller={controller} info={info}>
      {activeTab === TAB.CROSS_CHAIN && <CrossChainSwap onQuoteChange={setSelectedQuote} />}
      {activeTab === TAB.SETTINGS && (
        <SettingsPanel
          isCrossChainPage
          isSwapPage={false}
          highlightDegenMode={highlightDegenMode}
          onBack={onBackToMainTab}
          onClickLiquiditySources={() => setActiveTab(TAB.LIQUIDITY_SOURCES)}
          onClickCrossChainSources={() => setActiveTab(TAB.CROSS_CHAIN_SOURCES)}
        />
      )}
      {activeTab === TAB.CROSS_CHAIN_SOURCES && <CrossChainSwapSources onBack={() => setActiveTab(TAB.SETTINGS)} />}
    </SwapV3Layout>
  )
}
