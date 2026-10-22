import type { ChainId } from '@kyberswap/ks-sdk-core'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Suspense, lazy, useState } from 'react'

import Loader from 'components/Loader'
import LocalLoader from 'components/LocalLoader'
import { Center, HStack, Stack } from 'components/Stack'
import { useSwapInputAmount } from 'components/SwapForm/hooks/useSwapInputAmount'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import NonEvmProviders from 'components/Web3Provider/NonEvmProviders'
import { PopulatedSwapForm } from 'pages/Swap/components/PopulatedSwapForm'
import { SwapRightPanel } from 'pages/Swap/components/SwapRightPanel'
import HistoryButton from 'pages/Swap/components/crossChain/HistoryButton'
import { useSwapFormPair } from 'pages/Swap/hooks/useSwapFormPair'
import { useSwapLayoutPrefetch } from 'pages/Swap/hooks/useSwapLayoutPrefetch'
import { useTradeController } from 'pages/Swap/hooks/useTradeController'
import { Header } from 'pages/Swap/layout/Header'
import { TAB } from 'pages/Swap/layout/Tabs'
import { useAppSelector } from 'state/hooks'
import { Field } from 'state/swap/actions'
import type { DetailedRouteSummary } from 'types/route'
import { cn } from 'utils/cn'

const HistoryPanel = lazy(() => import('pages/Swap/components/crossChain/HistoryPanel'))
const TransactionHistoryUpdater = lazy(() => import('pages/Swap/components/crossChain/TransactionHistoryUpdater'))
const UnifiedCrossChainSwap = lazy(() => import('pages/Swap/components/crossChain/UnifiedCrossChainSwap'))
const CrossChainSwapSources = lazy(() => import('pages/Swap/components/crossChain/CrossChainSwapSources'))
const CrossChainRightPanel = lazy(() => import('pages/Swap/components/crossChain/CrossChainRightPanel'))
const CrossChainSwapProvider = lazy(() =>
  import('pages/Swap/hooks/crossChain/useCrossChainSwap').then(module => ({
    default: module.CrossChainSwapProvider,
  })),
)
const TokenInfo = lazy(() => import('components/TokenInfo'))
const SwapSettingsPanel = lazy(() => import('pages/Swap/components/SwapSettingsPanel'))
const LiquiditySourcesPanel = lazy(() => import('pages/Swap/components/LiquiditySourcesPanel'))

/** Owns the unified form/right-panel composition and History visibility.
 * Cross-chain form and route share one provider; chart/routes stay mounted while History is visible.
 * Saved-transaction polling lives outside both the panel visibility and swap-mode branches. */
const SwapPage = () => {
  const [showHistory, setShowHistory] = useState(false)
  const reduceMotion = useReducedMotion()
  const hasTransactions = useAppSelector(state => Boolean(state.crossChainSwap.transactions?.length))
  const {
    currencyIn,
    currencyOut,
    isInputCurrencyLoading,
    isOutputCurrencyLoading,
    inputId,
    outputId,
    selectCurrency,
    selectNonEvmCurrency,
    reversePair,
    isCrossChain,
    inputChain,
    outputChain,
  } = useSwapFormPair()
  const { typedValue, onUserInput } = useSwapInputAmount()
  const [routeSummary, setRouteSummary] = useState<DetailedRouteSummary>()
  useSwapLayoutPrefetch()
  const controller = useTradeController(TAB.SWAP)
  const { activeTab, setActiveTab, onBackToMainTab, highlightDegenMode } = controller

  const content = (
    <Stack className="w-full max-w-[1464px] gap-6 px-9 py-6 max-sm:gap-4 max-sm:px-4 max-sm:py-5">
      <HStack className="w-full items-start justify-center gap-12 max-lg:flex-col max-lg:items-center max-lg:gap-6">
        <Stack
          as="section"
          className="relative z-[1] w-full max-w-[425px] shrink-0 items-center gap-4 lg:sticky lg:top-4"
        >
          <Header
            activeTab={activeTab}
            activeMainTab={TAB.SWAP}
            setActiveTab={setActiveTab}
            isCrossChainMode={isCrossChain}
            historyButton={<HistoryButton active={showHistory} onClick={() => setShowHistory(value => !value)} />}
          />
          <div
            id={TutorialIds.SWAP_FORM}
            data-highlight={controller.shouldHighlightSwapBox}
            className={cn(
              'relative w-full rounded-[20px] bg-background shadow-[0_4px_16px_rgba(0,0,0,0.04)] data-[highlight=true]:animate-highlight',
              activeTab === TAB.INFO ? 'p-0' : 'p-4',
            )}
          >
            <Suspense
              fallback={
                <Center className="h-40">
                  <Loader size="20px" />
                </Center>
              }
            >
              {isCrossChain ? (
                <UnifiedCrossChainSwap
                  onChangeCurrencyIn={currency => selectCurrency(Field.INPUT, currency)}
                  onChangeCurrencyOut={currency => selectCurrency(Field.OUTPUT, currency)}
                  onSelectNonEvmCurrencyIn={(chain, currency) => selectNonEvmCurrency(Field.INPUT, chain, currency)}
                  onSelectNonEvmCurrencyOut={(chain, currency) => selectNonEvmCurrency(Field.OUTPUT, chain, currency)}
                  onReverse={reversePair}
                  hidden={activeTab !== TAB.SWAP}
                />
              ) : (
                <PopulatedSwapForm
                  isInputCurrencyLoading={isInputCurrencyLoading}
                  isOutputCurrencyLoading={isOutputCurrencyLoading}
                  chainId={inputChain as ChainId}
                  currencyIn={currencyIn}
                  currencyOut={currencyOut}
                  onChangeCurrencyIn={currency => selectCurrency(Field.INPUT, currency)}
                  onChangeCurrencyOut={currency => selectCurrency(Field.OUTPUT, currency)}
                  onSelectNonEvmCurrencyIn={(chain, currency) => selectNonEvmCurrency(Field.INPUT, chain, currency)}
                  onSelectNonEvmCurrencyOut={(chain, currency) => selectNonEvmCurrency(Field.OUTPUT, chain, currency)}
                  onRouteChange={setRouteSummary}
                  hidden={activeTab !== TAB.SWAP}
                />
              )}
              {activeTab === TAB.INFO && <TokenInfo tokens={[currencyIn, currencyOut]} onBack={onBackToMainTab} />}
              {activeTab === TAB.SETTINGS && (
                <SwapSettingsPanel
                  crossChainQuoteMode="stream"
                  showDisplaySettings
                  isSwapPage={!isCrossChain}
                  isCrossChainPage={isCrossChain}
                  highlightDegenMode={highlightDegenMode}
                  onBack={onBackToMainTab}
                  onClickLiquiditySources={() => setActiveTab(TAB.LIQUIDITY_SOURCES)}
                  onClickCrossChainSources={() => setActiveTab(TAB.CROSS_CHAIN_SOURCES)}
                />
              )}
              {activeTab === TAB.CROSS_CHAIN_SOURCES && (
                <CrossChainSwapSources onBack={() => setActiveTab(TAB.SETTINGS)} />
              )}
              {activeTab === TAB.LIQUIDITY_SOURCES && (
                <LiquiditySourcesPanel onBack={() => setActiveTab(TAB.SETTINGS)} />
              )}
            </Suspense>
          </div>
        </Stack>

        {/* Keep the right panel below the form's Route Options flyout. */}
        <Stack
          as="aside"
          id="swap-right-panel"
          className="relative z-0 min-w-0 max-w-[920px] flex-1 gap-5 max-lg:w-full max-lg:flex-none"
        >
          <motion.div
            initial={false}
            animate={{ opacity: showHistory ? 0 : 1, x: showHistory && !reduceMotion ? 8 : 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'relative flex w-full min-w-0 flex-col gap-5',
              showHistory && 'pointer-events-none absolute inset-x-0 top-0',
            )}
            aria-hidden={showHistory}
            inert={showHistory}
          >
            <Suspense fallback={<LocalLoader />}>
              {isCrossChain ? (
                <CrossChainRightPanel />
              ) : (
                <SwapRightPanel currencyIn={currencyIn} currencyOut={currencyOut} routeSummary={routeSummary} />
              )}
            </Suspense>
          </motion.div>
          <AnimatePresence initial={false} mode="popLayout">
            {showHistory && (
              <motion.div
                key="history"
                className="relative w-full min-w-0"
                initial={{ opacity: 0, x: reduceMotion ? 0 : -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: reduceMotion ? 0 : -8, pointerEvents: 'none' }}
                transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                <Suspense fallback={<LocalLoader />}>
                  <HistoryPanel onBack={() => setShowHistory(false)} />
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>
        </Stack>
      </HStack>
      <SwitchLocaleLink centered />
    </Stack>
  )

  return (
    <NonEvmProviders>
      {hasTransactions && (
        <Suspense fallback={null}>
          <TransactionHistoryUpdater />
        </Suspense>
      )}
      {isCrossChain ? (
        <Suspense fallback={<LocalLoader />}>
          <CrossChainSwapProvider
            amount={typedValue}
            onAmountChange={onUserInput}
            tokenIn={inputId}
            tokenOut={outputId}
            fromChain={inputChain}
            toChain={outputChain}
          >
            {content}
          </CrossChainSwapProvider>
        </Suspense>
      ) : (
        content
      )}
    </NonEvmProviders>
  )
}

export default SwapPage
