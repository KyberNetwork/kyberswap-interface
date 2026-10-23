import { Suspense, lazy, useState } from 'react'

import { useSwapInputAmount } from 'components/SwapForm/hooks/useSwapInputAmount'
import NonEvmProviders from 'components/Web3Provider/NonEvmProviders'
import { TAB } from 'pages/Swap/Layout/Tabs'
import SwapPageContent from 'pages/Swap/SwapPageContent'
import { useSwapFormPair } from 'pages/Swap/hooks/useSwapFormPair'
import { useSwapLayoutPrefetch } from 'pages/Swap/hooks/useSwapLayoutPrefetch'
import { useTradeController } from 'pages/Swap/hooks/useTradeController'
import { useAppSelector } from 'state/hooks'
import type { DetailedRouteSummary } from 'types/route'

const TransactionHistoryUpdater = lazy(() => import('pages/Swap/components/TransactionHistoryUpdater'))
const CrossChainSwapProvider = lazy(() => import('components/SwapForm/CrossChain/hooks/useCrossChainSwap'))

/** Owns shared page state and the cross-chain provider for both panels.
 * Saved-transaction polling stays outside the swap-mode and History visibility branches. */
const SwapPage = () => {
  const [showHistory, setShowHistory] = useState(false)
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeSummary, setRouteSummary] = useState<DetailedRouteSummary>()
  const hasTransactions = useAppSelector(state => Boolean(state.crossChainSwap.transactions?.length))
  const pair = useSwapFormPair()
  const controller = useTradeController(TAB.SWAP)
  const { typedValue, onUserInput } = useSwapInputAmount()
  useSwapLayoutPrefetch()

  const contentProps = {
    ...pair,
    ...controller,
    amount: typedValue,
    onAmountChange: onUserInput,
    showHistory,
    routeSummary,
    routeLoading,
    onRouteLoadingChange: setRouteLoading,
    onHistoryChange: setShowHistory,
    onRouteChange: setRouteSummary,
  }

  return (
    <NonEvmProviders>
      {hasTransactions && (
        <Suspense fallback={null}>
          <TransactionHistoryUpdater />
        </Suspense>
      )}
      {pair.isCrossChain ? (
        <Suspense fallback={<SwapPageContent {...contentProps} isProviderLoading />}>
          <CrossChainSwapProvider
            amount={typedValue}
            onAmountChange={onUserInput}
            tokenIn={pair.inputId}
            tokenOut={pair.outputId}
            fromChain={pair.inputChain}
            toChain={pair.outputChain}
          >
            <SwapPageContent {...contentProps} />
          </CrossChainSwapProvider>
        </Suspense>
      ) : (
        <SwapPageContent {...contentProps} />
      )}
    </NonEvmProviders>
  )
}

export default SwapPage
