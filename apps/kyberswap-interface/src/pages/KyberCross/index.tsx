import { Suspense, lazy } from 'react'

import LocalLoader from 'components/LocalLoader'
import { HStack, Stack } from 'components/Stack'
import { CrossChainReceiverWalletSelector } from 'components/SwapForm/CrossChain/CrossChainReceiverWalletSelector'
import CrossChainSwap, { CrossChainOutputFooter } from 'components/SwapForm/CrossChain/CrossChainSwap'
import { CrossChainSwapForm } from 'components/SwapForm/CrossChain/CrossChainSwapForm'
import CrossChainSwapProvider, {
  useOptionalCrossChainSwap,
} from 'components/SwapForm/CrossChain/hooks/useCrossChainSwap'
import { useSwapFormPair } from 'components/SwapForm/hooks/useSwapFormPair'
import { useSwapInputAmount } from 'components/SwapForm/hooks/useSwapInputAmount'
import { localTransactionToHistory } from 'components/SwapTransactions/history'
import { SwapWalletProvider } from 'components/SwapWallets/SwapWalletProvider'
import { Header } from 'components/TradeLayout/Header'
import { TAB } from 'components/TradeLayout/Tabs'
import { useTradeController } from 'components/TradeLayout/useTradeController'
import { CrossChainTradeRouteView } from 'components/TradeRouting/CrossChainTradeRoute'
import NonEvmProviders from 'components/Web3Provider/NonEvmProviders'
import TransactionHistoryList from 'pages/KyberCross/components/TransactionHistoryList'
import { useCrossChainTransactions } from 'state/crossChainSwap'
import { Field } from 'state/swap/actions'
import { SwapPair, getTradeLocation } from 'utils/swapFlow'

const Settings = lazy(() => import('components/SwapForm/Settings/SwapSettingsPanel'))
const Sources = lazy(() => import('components/SwapForm/Settings/SwapSettingsPanel/CrossChainSwapSources'))
const HistoryUpdater = lazy(() => import('components/SwapTransactions/TransactionUpdater'))

const KyberCrossContent = ({ pair }: { pair: ReturnType<typeof useSwapFormPair> }) => {
  const controller = useTradeController(TAB.KYBER_CROSS)
  const swap = useOptionalCrossChainSwap()
  const { typedValue, onUserInput } = useSwapInputAmount()
  const localTransactions = useCrossChainTransactions()
  const transactions = localTransactions.map(localTransactionToHistory)
  const { activeTab, onTabChange, onBackToMainTab } = controller

  return (
    <Stack className="w-full max-w-[1464px] gap-6 px-9 py-6 max-sm:gap-4 max-sm:px-4 max-sm:py-5">
      <Suspense fallback={null}>
        <HistoryUpdater />
      </Suspense>
      <HStack className="w-full items-start justify-center gap-12 max-lg:flex-col max-lg:items-center max-lg:gap-6">
        <Stack as="section" className="relative z-[1] w-full max-w-[425px] shrink-0 gap-4 lg:sticky lg:top-4">
          <Header activeTab={activeTab} activeMainTab={TAB.KYBER_CROSS} onTabChange={onTabChange} isCrossChainMode />
          <Stack className="relative w-full gap-4 rounded-[20px] bg-background p-4">
            <CrossChainSwapForm
              hidden={activeTab !== TAB.KYBER_CROSS}
              amount={typedValue}
              onAmountChange={onUserInput}
              currencyIn={pair.currencyIn ?? swap?.currencyIn}
              currencyOut={pair.currencyOut ?? swap?.currencyOut}
              fromChainId={pair.inputChain}
              toChainId={pair.outputChain}
              selectedQuote={swap?.selectedQuote || undefined}
              loading={!swap || swap.loading}
              isInputCurrencyLoading={pair.isInputCurrencyLoading}
              isOutputCurrencyLoading={pair.isOutputCurrencyLoading}
              onChangeCurrencyIn={currency => pair.selectCurrency(Field.INPUT, currency)}
              onChangeCurrencyOut={currency => pair.selectCurrency(Field.OUTPUT, currency)}
              onSelectNonEvmCurrencyIn={(chain, currency) => pair.selectNonEvmCurrency(Field.INPUT, chain, currency)}
              onSelectNonEvmCurrencyOut={(chain, currency) => pair.selectNonEvmCurrency(Field.OUTPUT, chain, currency)}
              onReverse={outputAmount => {
                pair.reversePair()
                if (outputAmount !== undefined) onUserInput(outputAmount)
              }}
              receiver={
                (typeof pair.inputChain !== 'number' || typeof pair.outputChain !== 'number') && swap ? (
                  <div className="-my-1 -ml-2 flex">
                    <CrossChainReceiverWalletSelector key={pair.outputChain} chain={pair.outputChain} />
                  </div>
                ) : undefined
              }
              receiverAddress={swap?.recipient}
              outputFooter={swap && <CrossChainOutputFooter />}
              details={swap ? <CrossChainSwap /> : <LocalLoader />}
              action={null}
            />
            <Suspense fallback={<LocalLoader />}>
              {activeTab === TAB.SETTINGS && (
                <Settings
                  mode="cross-chain"
                  crossChainQuoteMode="direct"
                  highlightDegenMode={controller.highlightDegenMode}
                  onBack={onBackToMainTab}
                  onClickLiquiditySources={() => onTabChange(TAB.CROSS_CHAIN_SOURCES)}
                  onClickCrossChainSources={() => onTabChange(TAB.CROSS_CHAIN_SOURCES)}
                />
              )}
              {activeTab === TAB.CROSS_CHAIN_SOURCES && (
                <Sources quoteMode="direct" onBack={() => onTabChange(TAB.SETTINGS)} />
              )}
            </Suspense>
          </Stack>
        </Stack>
        <Stack as="aside" className="relative z-0 min-w-0 max-w-[920px] flex-1 gap-5 max-lg:w-full max-lg:flex-none">
          <CrossChainTradeRouteView
            fromChainId={pair.inputChain}
            toChainId={pair.outputChain}
            currencyIn={pair.currencyIn}
            currencyOut={pair.currencyOut}
            selectedQuote={null}
            loading={!swap}
            {...swap}
          />
          <TransactionHistoryList transactions={transactions} />
        </Stack>
      </HStack>
    </Stack>
  )
}

const getKyberCrossLocation = (pair: SwapPair, params: URLSearchParams) => getTradeLocation('kybercross', pair, params)

const KyberCrossPage = () => {
  const pair = useSwapFormPair(getKyberCrossLocation)
  const { typedValue, onUserInput } = useSwapInputAmount()
  return (
    <NonEvmProviders>
      <SwapWalletProvider inputChain={pair.inputChain} outputChain={pair.outputChain}>
        <CrossChainSwapProvider
          quoteMode="direct"
          fromChain={pair.inputChain}
          toChain={pair.outputChain}
          tokenIn={pair.inputId}
          tokenOut={pair.outputId}
          amount={typedValue}
          setAmount={onUserInput}
        >
          <KyberCrossContent pair={pair} />
        </CrossChainSwapProvider>
      </SwapWalletProvider>
    </NonEvmProviders>
  )
}

export default KyberCrossPage
