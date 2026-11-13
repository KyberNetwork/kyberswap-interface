import { ChainId } from '@kyberswap/ks-sdk-core'
import { Suspense, lazy, useCallback, useState } from 'react'

import { getCrossChainSwapIdentity } from 'components/SwapForm/CrossChain/hooks/useCrossChainSwap'
import { SingleChainSwapFormProvider } from 'components/SwapForm/SingleChain/SingleChainSwapFormProvider'
import { useEvmRecipient } from 'components/SwapForm/hooks/useEvmRecipient'
import { useSwapFormPair } from 'components/SwapForm/hooks/useSwapFormPair'
import { useSwapInputAmount } from 'components/SwapForm/hooks/useSwapInputAmount'
import { TransactionDetailProvider } from 'components/SwapTransactions/TransactionDetail/TransactionDetailProvider'
import { TAB } from 'components/TradeLayout/Tabs'
import { useTradeController } from 'components/TradeLayout/useTradeController'
import { useTradeLayoutPrefetch } from 'components/TradeLayout/useTradeLayoutPrefetch'
import { useActiveWeb3React } from 'hooks'
import SwapPageContent, { SwapPageForm, SwapPageFormFallback } from 'pages/Swap/SwapPageContent'
import { SwapPageRuntime, type SwapRuntimeSnapshot, createSwapPageRuntime } from 'pages/Swap/SwapPageRuntime'

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

  // Only the data projection changes when lazy providers resolve; the page/right panel stay mounted.
  const runtimeIdentity = getCrossChainSwapIdentity({
    enabled: pair.isCrossChain,
    fromChain: pair.inputChain,
    toChain: pair.outputChain,
    tokenIn: pair.inputId,
    tokenOut: pair.outputId,
    amount: typedValue,
  })
  // History follows the input signer; changing the receiver chain must not clear it.
  const walletIdentity = String(pair.inputChain)
  const [runtime] = useState(createSwapPageRuntime)
  const publishRuntime = useCallback(
    (snapshot: SwapRuntimeSnapshot) => {
      runtime.publish(runtimeIdentity, walletIdentity, snapshot)
    },
    [runtime, runtimeIdentity, walletIdentity],
  )
  const pendingForm = <SwapPageFormFallback {...contentProps} />

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
        <SwapPageRuntime runtime={runtime} identity={runtimeIdentity} walletIdentity={walletIdentity}>
          <SwapPageContent
            {...contentProps}
            requiresWallets={crossChainActivated}
            form={
              crossChainActivated ? (
                <Suspense fallback={pendingForm}>
                  <CrossChainProviders
                    enabled={pair.isCrossChain}
                    evmRecipient={evmRecipient}
                    amount={typedValue}
                    setAmount={onUserInput}
                    tokenIn={pair.inputId}
                    tokenOut={pair.outputId}
                    fromChain={pair.inputChain}
                    toChain={pair.outputChain}
                    onRuntimeChange={publishRuntime}
                  >
                    <Suspense fallback={null}>
                      <WalletHistorySubscriptions />
                    </Suspense>
                    <SwapPageForm {...contentProps} />
                  </CrossChainProviders>
                </Suspense>
              ) : (
                <>
                  <Suspense fallback={null}>
                    <WalletHistorySubscriptions evmOnly />
                  </Suspense>
                  <SwapPageForm {...contentProps} />
                </>
              )
            }
          />
        </SwapPageRuntime>
      </SingleChainSwapFormProvider>
    </TransactionDetailProvider>
  )
}

export default SwapPage
