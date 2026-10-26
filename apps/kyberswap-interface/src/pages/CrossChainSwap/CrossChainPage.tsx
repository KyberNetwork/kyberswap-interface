import { lazy, useState } from 'react'

import { Stack } from 'components/Stack'
import { loadCrossChainSwap } from 'pages/CrossChainSwap/loader'
import type { Quote } from 'pages/CrossChainSwap/registry'
import { SwapLayout } from 'pages/Swap/Layout/SwapLayout'
import { TAB } from 'pages/Swap/Layout/Tabs'
import { useTradeController } from 'pages/Swap/hooks/useTradeController'
import { useCrossChainTransactions } from 'state/crossChainSwap'

const CrossChainSwap = lazy(loadCrossChainSwap)
const CrossChainSwapSources = lazy(() => import('pages/CrossChainSwap/components/CrossChainSwapSources'))
const QuoteSteps = lazy(() => import('pages/CrossChainSwap/components/QuoteSteps'))
const SwapSettingsPanel = lazy(() => import('components/SwapForm/Settings/SwapSettingsPanel'))
const TransactionHistoryList = lazy(() => import('pages/CrossChainSwap/components/TransactionHistoryList'))
const TransactionHistoryUpdater = lazy(() => import('pages/Swap/components/TransactionHistoryUpdater'))

const CrossChainPage = () => {
  const controller = useTradeController(TAB.CROSS_CHAIN)
  const { activeTab, highlightDegenMode, onBackToMainTab, onTabChange } = controller
  const [transactions] = useCrossChainTransactions()
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)

  const rightPanel = (
    <Stack className="gap-4">
      <QuoteSteps visible={false} quote={selectedQuote} />
      <TransactionHistoryUpdater />
      <TransactionHistoryList transactions={transactions} />
    </Stack>
  )

  return (
    <SwapLayout controller={controller} rightPanel={rightPanel}>
      {activeTab === TAB.CROSS_CHAIN && <CrossChainSwap onQuoteChange={setSelectedQuote} />}
      {activeTab === TAB.SETTINGS && (
        <SwapSettingsPanel
          mode="cross-chain"
          highlightDegenMode={highlightDegenMode}
          onBack={onBackToMainTab}
          onClickLiquiditySources={() => onTabChange(TAB.LIQUIDITY_SOURCES)}
          onClickCrossChainSources={() => onTabChange(TAB.CROSS_CHAIN_SOURCES)}
        />
      )}
      {activeTab === TAB.CROSS_CHAIN_SOURCES && <CrossChainSwapSources onBack={() => onTabChange(TAB.SETTINGS)} />}
    </SwapLayout>
  )
}

export default CrossChainPage
