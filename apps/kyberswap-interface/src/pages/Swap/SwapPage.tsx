import { ChainId } from '@kyberswap/ks-sdk-core'
import { Suspense, lazy, useState } from 'react'

import { SingleChainSwapFormProvider } from 'components/SwapForm/SingleChain/SingleChainSwapFormProvider'
import { useSwapInputAmount } from 'components/SwapForm/hooks/useSwapInputAmount'
import NonEvmProviders from 'components/Web3Provider/NonEvmProviders'
import SwapPageContent from 'pages/Swap/SwapPageContent'
import { useSwapFormPair } from 'pages/Swap/hooks/useSwapFormPair'
import { useSwapLayoutPrefetch } from 'pages/Swap/hooks/useSwapLayoutPrefetch'
import { useTradeController } from 'pages/Swap/hooks/useTradeController'
import { TAB } from 'pages/Swap/layout/Tabs'
import { useAppSelector } from 'state/hooks'

const TransactionHistoryUpdater = lazy(() => import('pages/Swap/components/TransactionHistoryUpdater'))
const CrossChainSwapProvider = lazy(() => import('components/SwapForm/CrossChain/hooks/useCrossChainSwap'))

/** Owns shared page state and the active quote provider for both panels.
 * Once saved transactions exist, their updater stays outside swap-mode and History visibility branches. */
const SwapPage = () => {
  const [showHistory, setShowHistory] = useState(false)
  const hasTransactions = useAppSelector(state => Boolean(state.crossChainSwap.transactions?.length))
  const pair = useSwapFormPair()
  const controller = useTradeController(TAB.SWAP)
  const { typedValue, onUserInput } = useSwapInputAmount()
  useSwapLayoutPrefetch()

  const contentProps = {
    ...pair,
    activeTab: controller.activeTab,
    onTabChange: controller.onTabChange,
    onBackToMainTab: controller.onBackToMainTab,
    highlightDegenMode: controller.highlightDegenMode,
    shouldHighlightSwapBox: controller.shouldHighlightSwapBox,
    amount: typedValue,
    onAmountChange: onUserInput,
    showHistory,
    onHistoryChange: setShowHistory,
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
        <SingleChainSwapFormProvider
          chainId={pair.inputChain as ChainId}
          currencyIn={pair.currencyIn}
          currencyOut={pair.currencyOut}
        >
          <SwapPageContent {...contentProps} />
        </SingleChainSwapFormProvider>
      )}
    </NonEvmProviders>
  )
}

export default SwapPage
