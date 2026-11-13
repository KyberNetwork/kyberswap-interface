import type { Currency } from '@kyberswap/ks-sdk-core'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { type ReactNode, Suspense, lazy, useRef } from 'react'

import Loader from 'components/Loader'
import LocalLoader from 'components/LocalLoader'
import { Center, HStack, Stack } from 'components/Stack'
import { useOptionalCrossChainSwap } from 'components/SwapForm/CrossChain/hooks/useCrossChainSwap'
import { PendingSwapForm } from 'components/SwapForm/PendingSwapForm'
import { SwapForm } from 'components/SwapForm/SwapForm'
import HistoryPanel, { HistoryButton } from 'components/SwapTransactions/History/HistoryPanel'
import { useSwapWalletSnapshot, useSwapWallets } from 'components/SwapWallets/SwapWalletContext'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { Header } from 'components/TradeLayout/Header'
import { TAB } from 'components/TradeLayout/Tabs'
import { LiquiditySourcesPanel, SwapSettingsPanel, TokenInfo } from 'components/TradeLayout/lazyPanels'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import SwapRightPanel from 'pages/Swap/components/SwapRightPanel'
import { Field } from 'state/swap/actions'
import { MEDIA_WIDTHS } from 'theme'
import type { Chain, NonEvmChain, NonEvmCurrency } from 'types/crossChain'
import { cn } from 'utils/cn'

const ProcessingTransactions = lazy(() => import('components/SwapTransactions/Processing/ProcessingTransactions'))
const CrossChainSwapSources = lazy(() => import('components/SwapForm/Settings/SwapSettingsPanel/CrossChainSwapSources'))

type FormProps = {
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  inputChain: Chain
  outputSelectorChain?: Chain
  outputChain: Chain
  amount: string
  isCrossChain: boolean
  isInputCurrencyLoading: boolean
  isOutputCurrencyLoading: boolean
  activeTab: TAB
  highlightDegenMode: boolean
  selectCurrency: (field: Field, currency: Currency) => void
  selectNonEvmCurrency: (field: Field, chain: NonEvmChain, currency: NonEvmCurrency) => void
  reversePair: () => void
  onAmountChange: (amount: string) => void
  onTabChange: (tab: TAB) => void
  onBackToMainTab: () => void
}

export const SwapPageFormFallback = ({
  activeTab,
  ...props
}: Pick<FormProps, 'activeTab' | 'currencyIn' | 'currencyOut' | 'inputChain' | 'outputChain' | 'amount'>) =>
  activeTab === TAB.SWAP ? (
    <PendingSwapForm {...props} />
  ) : (
    <Center className="h-40">
      <Loader size="20px" />
    </Center>
  )

/** Mounted only inside the ready wallet providers; owns form/tab interactions. */
export const SwapPageForm = ({
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
  outputSelectorChain,
  amount,
  onAmountChange,
  activeTab,
  onTabChange,
  onBackToMainTab,
  highlightDegenMode,
}: FormProps) => {
  const crossChainReady = !!useOptionalCrossChainSwap()
  const wallets = useSwapWallets()
  const singleChainId = !isCrossChain && typeof inputChain === 'number' ? inputChain : undefined

  const handleReverse = (outputAmount?: string) => {
    wallets?.reverseConnections()
    reversePair()
    if (outputAmount !== undefined) onAmountChange(outputAmount)
  }

  return (
    <Suspense
      fallback={
        <SwapPageFormFallback
          activeTab={activeTab}
          currencyIn={currencyIn}
          currencyOut={currencyOut}
          inputChain={inputChain}
          outputChain={outputChain}
          amount={amount}
        />
      }
    >
      <SwapForm
        hidden={activeTab !== TAB.SWAP}
        isCrossChain={isCrossChain}
        inputChain={inputChain}
        outputChain={outputChain}
        outputSelectorChain={outputSelectorChain}
        currencyIn={currencyIn}
        currencyOut={currencyOut}
        amount={amount}
        onAmountChange={onAmountChange}
        isInputCurrencyLoading={isInputCurrencyLoading}
        isOutputCurrencyLoading={isOutputCurrencyLoading}
        onChangeCurrencyIn={currency => selectCurrency(Field.INPUT, currency)}
        onChangeCurrencyOut={currency => selectCurrency(Field.OUTPUT, currency)}
        onSelectNonEvmCurrencyIn={(chain, currency) => selectNonEvmCurrency(Field.INPUT, chain, currency)}
        onSelectNonEvmCurrencyOut={(chain, currency) => selectNonEvmCurrency(Field.OUTPUT, chain, currency)}
        onReverse={handleReverse}
      />
      {activeTab === TAB.INFO && <TokenInfo tokens={[currencyIn, currencyOut]} onBack={onBackToMainTab} />}
      {activeTab === TAB.SETTINGS && (
        <SwapSettingsPanel
          chainId={singleChainId}
          crossChainQuoteMode="stream"
          recipientSettingsReady={!isCrossChain || crossChainReady}
          showDisplaySettings
          mode={isCrossChain ? 'cross-chain' : 'single-chain'}
          highlightDegenMode={highlightDegenMode}
          onBack={onBackToMainTab}
          onClickLiquiditySources={() => onTabChange(TAB.LIQUIDITY_SOURCES)}
          onClickCrossChainSources={() => onTabChange(TAB.CROSS_CHAIN_SOURCES)}
        />
      )}
      {activeTab === TAB.CROSS_CHAIN_SOURCES && (
        <CrossChainSwapSources quoteMode="stream" onBack={() => onTabChange(TAB.SETTINGS)} />
      )}
      {activeTab === TAB.LIQUIDITY_SOURCES && (
        <LiquiditySourcesPanel chainId={singleChainId} onBack={() => onTabChange(TAB.SETTINGS)} />
      )}
    </Suspense>
  )
}

type Props = Pick<
  FormProps,
  | 'currencyIn'
  | 'currencyOut'
  | 'inputChain'
  | 'isCrossChain'
  | 'isInputCurrencyLoading'
  | 'isOutputCurrencyLoading'
  | 'activeTab'
  | 'onTabChange'
> & {
  form: ReactNode
  requiresWallets?: boolean
  shouldHighlightSwapBox: boolean
  showHistory: boolean
  onHistoryChange: (visible: boolean) => void
}

const SwapPageContent = ({
  form,
  currencyIn,
  currencyOut,
  isInputCurrencyLoading,
  isOutputCurrencyLoading,
  isCrossChain,
  requiresWallets = false,
  inputChain,
  activeTab,
  onTabChange,
  shouldHighlightSwapBox,
  showHistory,
  onHistoryChange,
}: Props) => {
  const wallets = useSwapWalletSnapshot()
  const reduceMotion = useReducedMotion()
  const rightPanelRef = useRef<HTMLElement>(null)

  const handleHistoryChange = (visible: boolean) => {
    onHistoryChange(visible)
    if (!visible || !window.matchMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`).matches) return

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        rightPanelRef.current?.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'start' })
      })
    })
  }

  return (
    <Stack className="w-full max-w-[1464px] gap-6 px-9 py-6 max-sm:gap-4 max-sm:px-4 max-sm:py-5">
      <HStack className="w-full items-start justify-center gap-12 max-lg:flex-col max-lg:items-center max-lg:gap-6">
        <Stack
          as="section"
          inert={requiresWallets && !wallets}
          className="relative z-[1] w-full max-w-[425px] shrink-0 items-center gap-4 lg:sticky lg:top-4"
        >
          <Header
            activeTab={activeTab}
            activeMainTab={TAB.SWAP}
            onTabChange={onTabChange}
            isCrossChainMode={isCrossChain}
            historyButton={<HistoryButton active={showHistory} onClick={() => handleHistoryChange(!showHistory)} />}
          />
          <div
            id={TutorialIds.SWAP_FORM}
            data-highlight={shouldHighlightSwapBox}
            className={cn(
              'relative w-full rounded-[20px] bg-background shadow-[0_4px_16px_rgba(0,0,0,0.04)] data-[highlight=true]:animate-highlight',
              activeTab === TAB.INFO ? 'p-0' : 'p-4',
            )}
          >
            {form}
          </div>
        </Stack>

        {/* Keep the right panel below the form's Route Options flyout. */}
        <Stack
          as="aside"
          ref={rightPanelRef}
          id="swap-right-panel"
          className="relative z-0 min-w-0 max-w-[920px] flex-1 scroll-mt-4 gap-5 max-lg:w-full max-lg:flex-none"
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
              <SwapRightPanel
                currencyIn={currencyIn}
                currencyOut={currencyOut}
                inputChain={inputChain}
                isCrossChain={isCrossChain}
                isTokenLoading={isInputCurrencyLoading || isOutputCurrencyLoading}
              />
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
                  <HistoryPanel inputChain={inputChain} onBack={() => handleHistoryChange(false)} />
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>
          {activeTab === TAB.SWAP && !showHistory && (
            <Suspense fallback={null}>
              <ProcessingTransactions onOpenHistory={() => handleHistoryChange(true)} />
            </Suspense>
          )}
        </Stack>
      </HStack>
      <SwitchLocaleLink centered />
    </Stack>
  )
}

export default SwapPageContent
