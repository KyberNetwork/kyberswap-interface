import { Suspense, useState } from 'react'

import Loader from 'components/Loader'
import LocalLoader from 'components/LocalLoader'
import { Center, HStack, Stack } from 'components/Stack'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { PopulatedSwapForm } from 'pages/Swap/components/PopulatedSwapForm'
import { SwapRightPanel } from 'pages/Swap/components/SwapRightPanel'
import { useCurrenciesByPage } from 'pages/Swap/hooks/useCurrenciesByPage'
import { useSwapLayoutPrefetch } from 'pages/Swap/hooks/useSwapLayoutPrefetch'
import { useTradeController } from 'pages/Swap/hooks/useTradeController'
import { Header } from 'pages/Swap/layout/Header'
import { TAB } from 'pages/Swap/layout/Tabs'
import { LiquiditySourcesPanel, SwapSettingsPanel, TokenInfo } from 'pages/Swap/layout/lazyPanels'
import type { DetailedRouteSummary } from 'types/route'
import { cn } from 'utils/cn'

const SwapPage = () => {
  const { currencies, currencyIn, currencyOut } = useCurrenciesByPage()
  const [routeSummary, setRouteSummary] = useState<DetailedRouteSummary>()
  useSwapLayoutPrefetch()
  const controller = useTradeController(TAB.SWAP)
  const { activeTab, setActiveTab, onBackToMainTab, highlightDegenMode } = controller

  return (
    <Stack className="w-full max-w-[1464px] gap-6 px-9 py-6 max-sm:gap-4 max-sm:px-4 max-sm:py-5">
      <HStack className="w-full items-start justify-center gap-12 max-lg:flex-col max-lg:items-center max-lg:gap-6">
        <Stack as="section" className="z-[1] w-full max-w-[425px] shrink-0 items-center gap-4 lg:sticky lg:top-4">
          <Header activeTab={activeTab} activeMainTab={TAB.SWAP} setActiveTab={setActiveTab} />
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
              <PopulatedSwapForm
                routeSummary={routeSummary}
                setRouteSummary={setRouteSummary}
                hidden={activeTab !== TAB.SWAP}
              />
              {activeTab === TAB.INFO && <TokenInfo currencies={currencies} onBack={onBackToMainTab} />}
              {activeTab === TAB.SETTINGS && (
                <SwapSettingsPanel
                  isSwapPage
                  highlightDegenMode={highlightDegenMode}
                  onBack={onBackToMainTab}
                  onClickLiquiditySources={() => setActiveTab(TAB.LIQUIDITY_SOURCES)}
                  onClickCrossChainSources={() => setActiveTab(TAB.CROSS_CHAIN_SOURCES)}
                />
              )}
              {activeTab === TAB.LIQUIDITY_SOURCES && (
                <LiquiditySourcesPanel onBack={() => setActiveTab(TAB.SETTINGS)} />
              )}
            </Suspense>
          </div>
        </Stack>

        <Stack as="aside" className="min-w-0 max-w-[920px] flex-1 gap-5 max-lg:w-full max-lg:flex-none">
          <Suspense fallback={<LocalLoader />}>
            <SwapRightPanel currencyIn={currencyIn} currencyOut={currencyOut} routeSummary={routeSummary} />
          </Suspense>
        </Stack>
      </HStack>
      <SwitchLocaleLink centered />
    </Stack>
  )
}

export default SwapPage
