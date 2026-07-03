import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import Banner from 'components/Banner'
import { FarmingPoolBanner, TrendingPoolBanner } from 'components/EarnBanner'
import LimitOrderForm from 'components/LimitOrder/Form/LimitOrderForm'
import { LimitOrderProvider } from 'components/LimitOrder/LimitOrderContext'
import OrderList from 'components/LimitOrder/OrderList'
import { HStack, Stack } from 'components/Stack'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import LiquiditySourcesPanel from 'components/swapv2/LiquiditySourcesPanel'
import SettingsPanel from 'components/swapv2/SwapSettingsPanel'
import useRequiredDegenMode from 'components/swapv2/SwapSettingsPanel/useRequiredDegenMode'
import TokenInfoTab from 'components/swapv2/TokenInfo'
import { Container, InfoComponentsWrapper, PageWrapper, SwapFormWrapper } from 'components/swapv2/styleds'
import { APP_PATHS } from 'constants/index'
import { PRICE_CHART_QUOTE_TOKEN_BY_CHAIN } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useParsedQueryString from 'hooks/useParsedQueryString'
import CrossChainSwap from 'pages/CrossChainSwap'
import { CrossChainSwapSources } from 'pages/CrossChainSwap/components/CrossChainSwapSources'
import QuoteSteps from 'pages/CrossChainSwap/components/QuoteSteps'
import { TransactionHistory } from 'pages/CrossChainSwap/components/TransactionHistory'
import { Quote } from 'pages/CrossChainSwap/registry'
import SwapTradeRoute from 'pages/SwapV3/Components/SwapTradeRoute'
import TokenPriceChart from 'pages/SwapV3/Components/TokenPriceChart'
import Header from 'pages/SwapV3/Header'
import PopulatedSwapForm from 'pages/SwapV3/PopulatedSwapForm'
import { AppBodyWrapped, BannerWrapper, SwitchLocaleLinkWrapper } from 'pages/SwapV3/styles'
import useCurrenciesByPage from 'pages/SwapV3/useCurrenciesByPage'
import { useShowPricingChart, useShowTradeRoutes } from 'state/user/hooks'
import { DetailedRouteSummary } from 'types/route'
import { useTradeComposition } from 'utils/aggregationRouting'

const InfoComponents = ({ children }: { children: ReactNode[] }) => {
  return children.filter(Boolean).length ? <InfoComponentsWrapper>{children}</InfoComponentsWrapper> : null
}

export enum TAB {
  SWAP = 'swap',
  INFO = 'info',
  SETTINGS = 'settings',
  LIQUIDITY_SOURCES = 'liquidity_sources',
  LIMIT = 'limit',
  CROSS_CHAIN = 'cross_chain',
  CROSS_CHAIN_SOURCES = 'cross_chain_sources',
}

export const isSettingTab = (tab: TAB) =>
  [TAB.INFO, TAB.SETTINGS, TAB.LIQUIDITY_SOURCES, TAB.CROSS_CHAIN_SOURCES].includes(tab)

export default function Swap() {
  const { chainId } = useActiveWeb3React()
  const isShowPricingChart = useShowPricingChart()
  const isShowTradeRoutes = useShowTradeRoutes()
  const { currencies, currencyIn, currencyOut } = useCurrenciesByPage()
  const qs = useParsedQueryString<{ highlightBox: string }>()
  const [routeSummary, setRouteSummary] = useState<DetailedRouteSummary>()

  const { pathname } = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const inputCurrency = searchParams.get('inputCurrency')
    const outputCurrency = searchParams.get('outputCurrency')

    if (inputCurrency || outputCurrency) {
      if (pathname.includes(APP_PATHS.LIMIT))
        navigate(`${APP_PATHS.LIMIT}/${NETWORKS_INFO[chainId].route}/${inputCurrency || ''}-to-${outputCurrency || ''}`)
      else navigate(`/swap/${NETWORKS_INFO[chainId].route}/${inputCurrency || ''}-to-${outputCurrency || ''}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, chainId, navigate])

  const shouldHighlightSwapBox = qs.highlightBox === 'true'

  const isSwapPage = pathname.startsWith(APP_PATHS.SWAP)
  const isLimitPage = pathname.startsWith(APP_PATHS.LIMIT)
  const isCrossChainPage = pathname.startsWith(APP_PATHS.CROSS_CHAIN)
  const isPartnerSwap = pathname.startsWith(APP_PATHS.PARTNER_SWAP)

  const getDefaultTab = useCallback(
    () => (isSwapPage ? TAB.SWAP : isLimitPage ? TAB.LIMIT : TAB.CROSS_CHAIN),
    [isSwapPage, isLimitPage],
  )

  const [activeTab, setActiveTab] = useState<TAB>(getDefaultTab())
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)

  const highlightDegenMode = useRequiredDegenMode({ setActiveTab })

  useEffect(() => {
    setActiveTab(getDefaultTab())
  }, [getDefaultTab])

  const isSetting = isSettingTab(activeTab)
  const activeMainTab = isSetting ? getDefaultTab() : activeTab

  const tabFromUrl = searchParams.get('tab')
  useEffect(() => {
    if (tabFromUrl === 'settings') {
      setActiveTab(TAB.SETTINGS)
      searchParams.delete('tab')
      setSearchParams(searchParams)
    }
  }, [tabFromUrl, searchParams, setSearchParams])

  const tradeRouteComposition = useTradeComposition({
    chainId,
    inputAmount: routeSummary?.parsedAmountIn,
    swaps: routeSummary?.route,
  })

  const isSmartSettlementActive = useMemo(
    () => routeSummary?.route?.some(route => route.some(swap => swap.extra?._ce)),
    [routeSummary?.route],
  )

  const hasSupportedTokenPriceChart = Boolean(PRICE_CHART_QUOTE_TOKEN_BY_CHAIN[chainId])

  const onBackToSwapTab = () => setActiveTab(getDefaultTab())

  return (
    <PageWrapper>
      <Banner />
      <Container>
        <LimitOrderProvider>
          <SwapFormWrapper>
            <Header activeTab={activeTab} setActiveTab={setActiveTab} activeMainTab={activeMainTab} />

            <AppBodyWrapped
              data-highlight={shouldHighlightSwapBox}
              id={TutorialIds.SWAP_FORM}
              style={activeTab === TAB.INFO ? { padding: 0 } : undefined}
            >
              {isSwapPage && (
                <PopulatedSwapForm
                  routeSummary={routeSummary}
                  setRouteSummary={setRouteSummary}
                  hidden={activeTab !== TAB.SWAP}
                />
              )}
              {activeTab === TAB.INFO && <TokenInfoTab currencies={currencies} onBack={onBackToSwapTab} />}
              {activeTab === TAB.SETTINGS && (
                <SettingsPanel
                  isCrossChainPage={isCrossChainPage}
                  isSwapPage={isSwapPage}
                  highlightDegenMode={highlightDegenMode}
                  onBack={onBackToSwapTab}
                  onClickLiquiditySources={() => setActiveTab(TAB.LIQUIDITY_SOURCES)}
                  onClickCrossChainSources={() => setActiveTab(TAB.CROSS_CHAIN_SOURCES)}
                />
              )}
              {activeTab === TAB.LIQUIDITY_SOURCES && (
                <LiquiditySourcesPanel onBack={() => setActiveTab(TAB.SETTINGS)} />
              )}
              {activeTab === TAB.LIMIT && <LimitOrderForm />}
              {activeTab === TAB.CROSS_CHAIN && <CrossChainSwap onQuoteChange={setSelectedQuote} />}
              {activeTab === TAB.CROSS_CHAIN_SOURCES && (
                <CrossChainSwapSources onBack={() => setActiveTab(TAB.SETTINGS)} />
              )}
            </AppBodyWrapped>
          </SwapFormWrapper>

          <InfoComponents>
            {(isSwapPage || isLimitPage || isCrossChainPage) && !isPartnerSwap && (
              <BannerWrapper>
                <TrendingPoolBanner />
                <FarmingPoolBanner />
              </BannerWrapper>
            )}
            {isSwapPage && isShowPricingChart && <TokenPriceChart tokens={[currencyIn, currencyOut]} />}
            {isShowTradeRoutes && isSwapPage && (
              <SwapTradeRoute
                tradeComposition={tradeRouteComposition}
                currencyIn={currencyIn}
                currencyOut={currencyOut}
                defaultCollapsed={hasSupportedTokenPriceChart && isShowPricingChart}
                inputAmount={routeSummary?.parsedAmountIn}
                outputAmount={routeSummary?.parsedAmountOut}
                isSmartSettlementActive={isSmartSettlementActive}
              />
            )}

            {isLimitPage && <OrderList />}
            {isCrossChainPage && (
              <Stack className="gap-4">
                <QuoteSteps visible={false} quote={selectedQuote} />
                <TransactionHistory />
              </Stack>
            )}
          </InfoComponents>
        </LimitOrderProvider>
      </Container>
      <HStack className="justify-center">
        <SwitchLocaleLinkWrapper>
          <SwitchLocaleLink />
        </SwitchLocaleLinkWrapper>
      </HStack>
    </PageWrapper>
  )
}
