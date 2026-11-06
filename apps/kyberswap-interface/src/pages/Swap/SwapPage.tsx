import { ChainId } from '@kyberswap/ks-sdk-core'
import { Suspense, lazy, useState } from 'react'

import { SingleChainSwapFormProvider } from 'components/SwapForm/SingleChain/SingleChainSwapFormProvider'
import { useSwapFormPair } from 'components/SwapForm/hooks/useSwapFormPair'
import { useSwapInputAmount } from 'components/SwapForm/hooks/useSwapInputAmount'
import { TransactionDetailProvider } from 'components/SwapTransactions/TransactionDetail/TransactionDetailProvider'
import { SwapWalletProvider } from 'components/SwapWallets/SwapWalletProvider'
import { TAB } from 'components/TradeLayout/Tabs'
import { useTradeController } from 'components/TradeLayout/useTradeController'
import { useTradeLayoutPrefetch } from 'components/TradeLayout/useTradeLayoutPrefetch'
import NonEvmProviders from 'components/Web3Provider/NonEvmProviders'
import SwapPageContent from 'pages/Swap/SwapPageContent'

const TransactionUpdater = lazy(() => import('components/SwapTransactions/TransactionUpdater'))
const CrossChainSwapProvider = lazy(() => import('components/SwapForm/CrossChain/hooks/useCrossChainSwap'))

/** Owns shared page state and the active quote provider for both panels.
 * The history controller stays outside swap-mode and History visibility branches. */
const SwapPage = () => {
  const [showHistory, setShowHistory] = useState(false)

  const pair = useSwapFormPair()
  const controller = useTradeController(TAB.SWAP)
  const { typedValue, onUserInput } = useSwapInputAmount()

  useTradeLayoutPrefetch()

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
      <SwapWalletProvider inputChain={pair.inputChain} outputChain={pair.outputChain}>
        <TransactionDetailProvider>
          <Suspense fallback={null}>
            <TransactionUpdater />
          </Suspense>
          {pair.isCrossChain ? (
            <Suspense fallback={<SwapPageContent {...contentProps} isProviderLoading />}>
              <CrossChainSwapProvider
                amount={typedValue}
                setAmount={onUserInput}
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
        </TransactionDetailProvider>
      </SwapWalletProvider>
    </NonEvmProviders>
  )
}

export default SwapPage
