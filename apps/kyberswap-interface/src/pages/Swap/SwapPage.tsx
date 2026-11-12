import { ChainId } from '@kyberswap/ks-sdk-core'
import { Suspense, lazy, useState } from 'react'

import CrossChainSwapProvider from 'components/SwapForm/CrossChain/hooks/useCrossChainSwap'
import { SingleChainSwapFormProvider } from 'components/SwapForm/SingleChain/SingleChainSwapFormProvider'
import { useEvmRecipient } from 'components/SwapForm/hooks/useEvmRecipient'
import { useSwapFormPair } from 'components/SwapForm/hooks/useSwapFormPair'
import { useSwapInputAmount } from 'components/SwapForm/hooks/useSwapInputAmount'
import { TransactionDetailProvider } from 'components/SwapTransactions/TransactionDetail/TransactionDetailProvider'
import { SwapWalletProvider } from 'components/SwapWallets/SwapWalletProvider'
import { TAB } from 'components/TradeLayout/Tabs'
import { useTradeController } from 'components/TradeLayout/useTradeController'
import { useTradeLayoutPrefetch } from 'components/TradeLayout/useTradeLayoutPrefetch'
import NonEvmProviders from 'components/Web3Provider/NonEvmProviders'
import { useActiveWeb3React } from 'hooks'
import SwapPageContent from 'pages/Swap/SwapPageContent'

const TransactionUpdater = lazy(() => import('components/SwapTransactions/TransactionUpdater'))

/** Owns shared page state and the active quote provider for both panels.
 * The history controller stays outside swap-mode and History visibility branches. */
const SwapPage = () => {
  const [showHistory, setShowHistory] = useState(false)

  const { account } = useActiveWeb3React()
  const evmRecipient = useEvmRecipient(account)
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
          <SingleChainSwapFormProvider
            enabled={!pair.isCrossChain}
            evmRecipient={evmRecipient}
            chainId={typeof pair.inputChain === 'number' ? pair.inputChain : ChainId.MAINNET}
            currencyIn={pair.currencyIn}
            currencyOut={pair.currencyOut}
          >
            <CrossChainSwapProvider
              enabled={pair.isCrossChain}
              evmRecipient={evmRecipient}
              amount={typedValue}
              setAmount={onUserInput}
              tokenIn={pair.inputId}
              tokenOut={pair.outputId}
              fromChain={pair.inputChain}
              toChain={pair.outputChain}
            >
              <SwapPageContent {...contentProps} />
            </CrossChainSwapProvider>
          </SingleChainSwapFormProvider>
        </TransactionDetailProvider>
      </SwapWalletProvider>
    </NonEvmProviders>
  )
}

export default SwapPage
