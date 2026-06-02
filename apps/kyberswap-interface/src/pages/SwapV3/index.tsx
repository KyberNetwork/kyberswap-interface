import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import Banner from 'components/Banner'
import { FarmingPoolBanner, TrendingPoolBanner } from 'components/EarnBanner'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import LimitOrder from 'components/swapv2/LimitOrder'
import ListLimitOrder from 'components/swapv2/LimitOrder/ListLimitOrder'
import LiquiditySourcesPanel from 'components/swapv2/LiquiditySourcesPanel'
import SettingsPanel from 'components/swapv2/SwapSettingsPanel'
import TokenInfoTab from 'components/swapv2/TokenInfo'
import { Container, InfoComponentsWrapper, PageWrapper, SwapFormWrapper } from 'components/swapv2/styleds'
import { APP_PATHS } from 'constants/index'
import { PRICE_CHART_QUOTE_TOKEN_BY_CHAIN } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens } from 'hooks/Tokens'
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
import { getTradeComposition } from 'utils/aggregationRouting'

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

export const isSettingTab = (tab: TAB) => [TAB.INFO, TAB.SETTINGS, TAB.LIQUIDITY_SOURCES].includes(tab)

export default function Swap() {
  const { chainId } = useActiveWeb3React()
  const isShowPricingChart = useShowPricingChart()
  const isShowTradeRoutes = useShowTradeRoutes()
  const defaultTokens = useAllTokens()
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

  const enableDegenMode = searchParams.get('enableDegenMode') === 'true'

  const getDefaultTab = useCallback(
    () => (isSwapPage ? TAB.SWAP : isLimitPage ? TAB.LIMIT : TAB.CROSS_CHAIN),
    [isSwapPage, isLimitPage],
  )

  const [activeTab, setActiveTab] = useState<TAB>(getDefaultTab())
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)

  useEffect(() => {
    if (enableDegenMode && activeTab !== TAB.SETTINGS) {
      setActiveTab(TAB.SETTINGS)
      setTimeout(() => {
        searchParams.delete('enableDegenMode')
        setSearchParams(searchParams)
      }, 4000)
    }
  }, [enableDegenMode, activeTab, searchParams, setSearchParams])

  useEffect(() => {
    setActiveTab(getDefaultTab())
  }, [getDefaultTab])

  const tabFromUrl = searchParams.get('tab')
  useEffect(() => {
    if (tabFromUrl === 'settings') {
      setActiveTab(TAB.SETTINGS)
      searchParams.delete('tab')
      setSearchParams(searchParams)
    }
  }, [tabFromUrl, searchParams, setSearchParams])

  const tradeRouteComposition = useMemo(() => {
    return getTradeComposition(chainId, routeSummary?.parsedAmountIn, undefined, routeSummary?.route, defaultTokens)
  }, [chainId, defaultTokens, routeSummary])

  const isSmartSettlementActive = useMemo(
    () => routeSummary?.route?.some(route => route.some(swap => swap.extra?._ce)),
    [routeSummary?.route],
  )

  const hasSupportedTokenPriceChart = Boolean(PRICE_CHART_QUOTE_TOKEN_BY_CHAIN[chainId])

  const onBackToSwapTab = () => setActiveTab(getDefaultTab())

  return (
    <>
      <PageWrapper>
        <Banner />
        <Container>
          <SwapFormWrapper>
            <Header activeTab={activeTab} setActiveTab={setActiveTab} />

            <AppBodyWrapped
              data-highlight={shouldHighlightSwapBox}
              id={TutorialIds.SWAP_FORM}
              style={[TAB.INFO, TAB.LIMIT].includes(activeTab) ? { padding: 0 } : undefined}
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
                  onBack={onBackToSwapTab}
                  onClickLiquiditySources={() => setActiveTab(TAB.LIQUIDITY_SOURCES)}
                  onClickCrossChainSources={() => setActiveTab(TAB.CROSS_CHAIN_SOURCES)}
                />
              )}
              {activeTab === TAB.LIQUIDITY_SOURCES && (
                <LiquiditySourcesPanel onBack={() => setActiveTab(TAB.SETTINGS)} />
              )}
              {activeTab === TAB.LIMIT && <LimitOrder />}
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

            {isLimitPage && <ListLimitOrder />}
            {isCrossChainPage && (
              <div className="flex flex-col gap-4">
                <QuoteSteps quote={selectedQuote} />
                <TransactionHistory />
              </div>
            )}
          </InfoComponents>
        </Container>
        <div className="flex justify-center">
          <SwitchLocaleLinkWrapper>
            <SwitchLocaleLink />
          </SwitchLocaleLinkWrapper>
        </div>
      </PageWrapper>
    </>
  )
}
