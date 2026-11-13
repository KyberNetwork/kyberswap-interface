import { ChainId } from '@kyberswap/ks-sdk-core'
import { Suspense, lazy, useState } from 'react'

import LocalLoader from 'components/LocalLoader'
import { SingleChainSwapFormProvider } from 'components/SwapForm/SingleChain/SingleChainSwapFormProvider'
import { useEvmRecipient } from 'components/SwapForm/hooks/useEvmRecipient'
import { useSwapFormPair } from 'components/SwapForm/hooks/useSwapFormPair'
import { useSwapInputAmount } from 'components/SwapForm/hooks/useSwapInputAmount'
import { TransactionDetailProvider } from 'components/SwapTransactions/TransactionDetail/TransactionDetailProvider'
import { TAB } from 'components/TradeLayout/Tabs'
import { useTradeController } from 'components/TradeLayout/useTradeController'
import { useTradeLayoutPrefetch } from 'components/TradeLayout/useTradeLayoutPrefetch'
import { useActiveWeb3React } from 'hooks'
import SwapPageContent from 'pages/Swap/SwapPageContent'

const CrossChainProviders = lazy(() => import('./SwapCrossChainProviders'))
const TransactionStatusUpdater = lazy(() =>
  import('components/SwapTransactions/TransactionUpdater').then(module => ({
    default: module.TransactionStatusUpdater,
  })),
)
const WalletHistorySubscriptions = lazy(() =>
  import('components/SwapTransactions/TransactionUpdater').then(module => ({
    default: module.WalletHistorySubscriptions,
  })),
)

/** Pair, amount, recipient and page controls survive the first cross-chain activation. */
const SwapPage = () => {
  const [showHistory, setShowHistory] = useState(false)

  const { account } = useActiveWeb3React()
  const evmRecipient = useEvmRecipient(account)
  const pair = useSwapFormPair()
  const [crossChainActivated, setCrossChainActivated] = useState(pair.isCrossChain)
  if (pair.isCrossChain && !crossChainActivated) setCrossChainActivated(true)

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
    <TransactionDetailProvider>
      <Suspense fallback={null}>
        <TransactionStatusUpdater />
      </Suspense>
      <SingleChainSwapFormProvider
        enabled={!pair.isCrossChain}
        evmRecipient={evmRecipient}
        chainId={typeof pair.inputChain === 'number' ? pair.inputChain : ChainId.MAINNET}
        currencyIn={pair.currencyIn}
        currencyOut={pair.currencyOut}
      >
        {crossChainActivated ? (
          <Suspense fallback={<LocalLoader />}>
            <CrossChainProviders
              enabled={pair.isCrossChain}
              evmRecipient={evmRecipient}
              amount={typedValue}
              setAmount={onUserInput}
              tokenIn={pair.inputId}
              tokenOut={pair.outputId}
              fromChain={pair.inputChain}
              toChain={pair.outputChain}
            >
              <Suspense fallback={null}>
                <WalletHistorySubscriptions />
              </Suspense>
              <SwapPageContent {...contentProps} />
            </CrossChainProviders>
          </Suspense>
        ) : (
          <>
            <Suspense fallback={null}>
              <WalletHistorySubscriptions evmOnly />
            </Suspense>
            <SwapPageContent {...contentProps} />
          </>
        )}
      </SingleChainSwapFormProvider>
    </TransactionDetailProvider>
  )
}

export default SwapPage
