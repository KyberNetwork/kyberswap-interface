import { Suspense, lazy, useState } from 'react'

import LocalLoader from 'components/LocalLoader'
import { HStack, Stack } from 'components/Stack'
import { CrossChainRecipientInput } from 'components/SwapForm/CrossChain/CrossChainRecipient'
import { CrossChainSwapForm } from 'components/SwapForm/CrossChain/CrossChainSwapForm'
import { useCrossChainWalletIntent } from 'components/SwapForm/CrossChain/hooks/useCrossChainWalletIntent'
import { useSwapInputAmount } from 'components/SwapForm/hooks/useSwapInputAmount'
import NonEvmProviders from 'components/Web3Provider/NonEvmProviders'
import { GasDropPanel } from 'pages/KyberCross/components/GasDrop'
import { GasDropFeatureSetting } from 'pages/KyberCross/components/GasDropFeatureSetting'
import { KyberCrossQuoteDetails } from 'pages/KyberCross/components/KyberCrossQuoteDetails'
import { SwapAction } from 'pages/KyberCross/components/SwapAction'
import { useGasDrop } from 'pages/KyberCross/hooks/useGasDrop'
import { KyberCrossProvider, useKyberCrossSwap } from 'pages/KyberCross/hooks/useKyberCrossSwap'
import { CrossChainTradeRouteView } from 'pages/Swap/components/CrossChainTradeRoute'
import { BitcoinConnectModal } from 'pages/Swap/crossChain/components/BitcoinConnectModal'
import TransactionHistoryList from 'pages/Swap/crossChain/components/TransactionHistoryList'
import { useSwapFormPair } from 'pages/Swap/hooks/useSwapFormPair'
import { useTradeController } from 'pages/Swap/hooks/useTradeController'
import { Header } from 'pages/Swap/layout/Header'
import { TAB } from 'pages/Swap/layout/Tabs'
import { useCrossChainTransactions } from 'state/crossChainSwap'
import { Field } from 'state/swap/actions'
import { SwapPair, getTradeLocation } from 'utils/swapFlow'

const Settings = lazy(() => import('components/SwapForm/Settings/SwapSettingsPanel'))
const Sources = lazy(() => import('pages/Swap/crossChain/components/CrossChainSwapSources'))
const HistoryUpdater = lazy(() => import('pages/Swap/components/TransactionHistoryUpdater'))

const KyberCrossContent = ({ pair }: { pair: ReturnType<typeof useSwapFormPair> }) => {
  const controller = useTradeController(TAB.KYBER_CROSS)
  const swap = useKyberCrossSwap()
  const { lowGas } = useGasDrop()
  const [showBitcoin, setShowBitcoin] = useState(false)
  const walletIntentModal = useCrossChainWalletIntent(swap.fromChainId, () => setShowBitcoin(true))
  const transactions = useCrossChainTransactions()
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
              amount={swap.amount}
              onAmountChange={swap.onAmountChange}
              currencyIn={swap.currencyIn}
              currencyOut={swap.currencyOut}
              fromChainId={swap.fromChainId}
              toChainId={swap.toChainId}
              selectedQuote={swap.selectedQuote || undefined}
              loading={swap.loading}
              isInputCurrencyLoading={pair.isInputCurrencyLoading}
              isOutputCurrencyLoading={pair.isOutputCurrencyLoading}
              onChangeCurrencyIn={currency => pair.selectCurrency(Field.INPUT, currency)}
              onChangeCurrencyOut={currency => pair.selectCurrency(Field.OUTPUT, currency)}
              onSelectNonEvmCurrencyIn={(chain, currency) => pair.selectNonEvmCurrency(Field.INPUT, chain, currency)}
              onSelectNonEvmCurrencyOut={(chain, currency) => pair.selectNonEvmCurrency(Field.OUTPUT, chain, currency)}
              onReverse={pair.reversePair}
              recipient={<CrossChainRecipientInput {...swap} />}
              details={
                <Stack className="gap-3">
                  {swap.gasDropSupported && <GasDropPanel lowGas={lowGas} />}
                  <KyberCrossQuoteDetails />
                </Stack>
              }
              action={<SwapAction setShowBtcModal={setShowBitcoin} />}
            />
            <Suspense fallback={<LocalLoader />}>
              {activeTab === TAB.SETTINGS && (
                <Settings
                  mode="cross-chain"
                  crossChainQuoteMode="direct"
                  additionalSettings={<GasDropFeatureSetting />}
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
          <CrossChainTradeRouteView {...swap} />
          <TransactionHistoryList transactions={transactions} />
        </Stack>
      </HStack>
      {walletIntentModal}
      <BitcoinConnectModal isOpen={showBitcoin} onDismiss={() => setShowBitcoin(false)} />
    </Stack>
  )
}

const getKyberCrossLocation = (pair: SwapPair, params: URLSearchParams) => getTradeLocation('kybercross', pair, params)

const KyberCrossPage = () => {
  const pair = useSwapFormPair(getKyberCrossLocation)
  const { typedValue, onUserInput } = useSwapInputAmount()
  return (
    <NonEvmProviders>
      <KyberCrossProvider
        fromChain={pair.inputChain}
        toChain={pair.outputChain}
        tokenIn={pair.inputId}
        tokenOut={pair.outputId}
        amount={typedValue}
        onAmountChange={onUserInput}
      >
        <KyberCrossContent pair={pair} />
      </KyberCrossProvider>
    </NonEvmProviders>
  )
}

export default KyberCrossPage
