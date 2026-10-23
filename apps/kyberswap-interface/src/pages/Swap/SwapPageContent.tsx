import type { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Suspense, lazy } from 'react'

import Loader from 'components/Loader'
import LocalLoader from 'components/LocalLoader'
import { Center, HStack, Stack } from 'components/Stack'
import CrossChainSwapPending from 'components/SwapForm/CrossChain/CrossChainSwapPending'
import { SingleChainSwapForm } from 'components/SwapForm/SingleChain/SingleChainSwapForm'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import type { NonEvmChain, NonEvmCurrency } from 'pages/CrossChainSwap/adapters/types'
import { Header } from 'pages/Swap/Layout/Header'
import { TAB } from 'pages/Swap/Layout/Tabs'
import CrossChainRightPanel from 'pages/Swap/components/CrossChainRightPanel'
import HistoryPanel, { HistoryButton } from 'pages/Swap/components/HistoryPanel'
import { SingleChainRightPanel } from 'pages/Swap/components/SingleChainRightPanel'
import type { useSwapFormPair } from 'pages/Swap/hooks/useSwapFormPair'
import type { useTradeController } from 'pages/Swap/hooks/useTradeController'
import { Field } from 'state/swap/actions'
import type { DetailedRouteSummary } from 'types/route'
import { cn } from 'utils/cn'

const CrossChainSwap = lazy(() => import('components/SwapForm/CrossChain/CrossChainSwap'))
const CrossChainSwapSources = lazy(() => import('pages/CrossChainSwap/components/CrossChainSwapSources'))
const TokenInfo = lazy(() => import('components/TokenInfo'))
const SwapSettingsPanel = lazy(() => import('components/SwapForm/Settings/SwapSettingsPanel'))
const LiquiditySourcesPanel = lazy(() => import('components/SwapForm/Settings/LiquiditySourcesPanel'))

const SwapFormLoader = () => (
  <Center className="h-40">
    <Loader size="20px" />
  </Center>
)

type Props = ReturnType<typeof useSwapFormPair> &
  ReturnType<typeof useTradeController> & {
    amount: string
    onAmountChange: (amount: string) => void
    isProviderLoading?: boolean
    showHistory: boolean
    routeSummary: DetailedRouteSummary | undefined
    routeLoading: boolean
    onRouteLoadingChange: (loading: boolean) => void
    onHistoryChange: (visible: boolean) => void
    onRouteChange: (route: DetailedRouteSummary | undefined) => void
  }

const SwapPageContent = ({
  currencyIn,
  currencyOut,
  isInputCurrencyLoading,
  isOutputCurrencyLoading,
  selectCurrency,
  selectNonEvmCurrency,
  reversePair,
  isCrossChain,
  inputChain,
  outputChain,
  inputId,
  outputId,
  amount,
  onAmountChange,
  activeTab,
  setActiveTab,
  onBackToMainTab,
  highlightDegenMode,
  shouldHighlightSwapBox,
  isProviderLoading = false,
  showHistory,
  routeSummary,
  routeLoading,
  onRouteLoadingChange,
  onHistoryChange,
  onRouteChange,
}: Props) => {
  const reduceMotion = useReducedMotion()
  const crossChainSelectionProps = {
    hidden: activeTab !== TAB.SWAP,
    onChangeCurrencyIn: (currency: Currency) => selectCurrency(Field.INPUT, currency),
    onChangeCurrencyOut: (currency: Currency) => selectCurrency(Field.OUTPUT, currency),
    onSelectNonEvmCurrencyIn: (chain: NonEvmChain, currency: NonEvmCurrency) =>
      selectNonEvmCurrency(Field.INPUT, chain, currency),
    onSelectNonEvmCurrencyOut: (chain: NonEvmChain, currency: NonEvmCurrency) =>
      selectNonEvmCurrency(Field.OUTPUT, chain, currency),
    onReverse: reversePair,
  }
  const pendingFormProps = {
    ...crossChainSelectionProps,
    amount,
    setAmount: onAmountChange,
    currencyIn,
    currencyOut,
    fromChainId: inputChain,
    toChainId: outputChain,
    tokenIn: inputId,
    tokenOut: outputId,
    isInputCurrencyLoading,
    isOutputCurrencyLoading,
  }

  return (
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
            historyButton={<HistoryButton active={showHistory} onClick={() => onHistoryChange(!showHistory)} />}
          />
          <div
            id={TutorialIds.SWAP_FORM}
            data-highlight={shouldHighlightSwapBox}
            className={cn(
              'relative w-full rounded-[20px] bg-background shadow-[0_4px_16px_rgba(0,0,0,0.04)] data-[highlight=true]:animate-highlight',
              activeTab === TAB.INFO ? 'p-0' : 'p-4',
            )}
          >
            <Suspense fallback={<SwapFormLoader />}>
              {isCrossChain ? (
                <Suspense fallback={<CrossChainSwapPending {...pendingFormProps} />}>
                  {isProviderLoading ? (
                    <CrossChainSwapPending {...pendingFormProps} />
                  ) : (
                    <CrossChainSwap {...crossChainSelectionProps} />
                  )}
                </Suspense>
              ) : (
                <SingleChainSwapForm
                  isInputCurrencyLoading={isInputCurrencyLoading}
                  isOutputCurrencyLoading={isOutputCurrencyLoading}
                  chainId={inputChain as ChainId}
                  currencyIn={currencyIn}
                  currencyOut={currencyOut}
                  onChangeCurrencyIn={currency => selectCurrency(Field.INPUT, currency)}
                  onChangeCurrencyOut={currency => selectCurrency(Field.OUTPUT, currency)}
                  onSelectNonEvmCurrencyIn={(chain, currency) => selectNonEvmCurrency(Field.INPUT, chain, currency)}
                  onSelectNonEvmCurrencyOut={(chain, currency) => selectNonEvmCurrency(Field.OUTPUT, chain, currency)}
                  onRouteChange={onRouteChange}
                  onRouteLoadingChange={onRouteLoadingChange}
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
                <CrossChainSwapSources quoteMode="stream" onBack={() => setActiveTab(TAB.SETTINGS)} />
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
                <CrossChainRightPanel
                  currencyIn={currencyIn}
                  currencyOut={currencyOut}
                  isProviderLoading={isProviderLoading}
                />
              ) : (
                <SingleChainRightPanel
                  currencyIn={currencyIn}
                  currencyOut={currencyOut}
                  routeSummary={routeSummary}
                  loading={routeLoading || isInputCurrencyLoading || isOutputCurrencyLoading}
                />
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
                  <HistoryPanel onBack={() => onHistoryChange(false)} />
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>
        </Stack>
      </HStack>
      <SwitchLocaleLink centered />
    </Stack>
  )
}

export default SwapPageContent
