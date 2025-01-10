import { Trans } from '@lingui/macro'
import { ReactNode, Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as RoutingIcon } from 'assets/svg/routing-icon.svg'
import Banner from 'components/Banner'
import EarnBanner from 'components/EarnBanner'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import GasTokenSetting from 'components/swapv2/GasTokenSetting'
import LimitOrder from 'components/swapv2/LimitOrder'
import ListLimitOrder from 'components/swapv2/LimitOrder/ListLimitOrder'
import LiquiditySourcesPanel from 'components/swapv2/LiquiditySourcesPanel'
import SettingsPanel from 'components/swapv2/SwapSettingsPanel'
import TokenInfoTab from 'components/swapv2/TokenInfo'
import {
  Container,
  InfoComponentsWrapper,
  PageWrapper,
  RoutesWrapper,
  SwapFormWrapper,
  highlight,
} from 'components/swapv2/styleds'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens } from 'hooks/Tokens'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import { BodyWrapper } from 'pages/AppBody'
import CrossChain from 'pages/CrossChain'
import CrossChainLink from 'pages/CrossChain/CrossChainLink'
import CrossChainTransfersHistory from 'pages/CrossChain/TransfersHistory'
import Header from 'pages/SwapV3/Header'
import useCurrenciesByPage from 'pages/SwapV3/useCurrenciesByPage'
import { useTutorialSwapGuide } from 'state/tutorial/hooks'
import { useShowTradeRoutes } from 'state/user/hooks'
import { DetailedRouteSummary } from 'types/route'
import { getTradeComposition } from 'utils/aggregationRouting'

import PopulatedSwapForm from './PopulatedSwapForm'

const TradeRouting = lazy(() => import('components/TradeRouting'))

export const InfoComponents = ({ children }: { children: ReactNode[] }) => {
  return children.filter(Boolean).length ? <InfoComponentsWrapper>{children}</InfoComponentsWrapper> : null
}

export enum TAB {
  SWAP = 'swap',
  INFO = 'info',
  SETTINGS = 'settings',
  LIQUIDITY_SOURCES = 'liquidity_sources',
  LIMIT = 'limit',
  CROSS_CHAIN = 'cross_chain',
  GAS_TOKEN = 'gas_token',
}

export const isSettingTab = (tab: TAB) => [TAB.INFO, TAB.SETTINGS, TAB.LIQUIDITY_SOURCES].includes(tab)

export const AppBodyWrapped = styled(BodyWrapper)`
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  padding: 16px;
  margin-top: 0;

  &[data-highlight='true'] {
    animation: ${({ theme }) => highlight(theme)} 2s 2 alternate ease-in-out;
  }
`

export const SwitchLocaleLinkWrapper = styled.div`
  margin-bottom: 30px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
  margin-bottom: 0px;
`}
`

export const RoutingIconWrapper = styled(RoutingIcon)`
  height: 27px;
  width: 27px;
  margin-right: 10px;
  path {
    fill: ${({ theme }) => theme.subText} !important;
  }
`

export default function Swap() {
  const { chainId } = useActiveWeb3React()
  const isShowTradeRoutes = useShowTradeRoutes()
  const defaultTokens = useAllTokens()
  const theme = useTheme()
  const { currencies, currencyIn, currencyOut } = useCurrenciesByPage()
  const qs = useParsedQueryString<{ highlightBox: string }>()
  const [{ show: isShowTutorial = false }] = useTutorialSwapGuide()
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

  const onBackToSwapTab = () => setActiveTab(getDefaultTab())

  return (
    <>
      <PageWrapper>
        <Banner />
        <Container>
          <SwapFormWrapper isShowTutorial={isShowTutorial}>
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
                  onOpenGasToken={() => setActiveTab(TAB.GAS_TOKEN)}
                />
              )}
              {activeTab === TAB.INFO && <TokenInfoTab currencies={currencies} onBack={onBackToSwapTab} />}
              {activeTab === TAB.SETTINGS && (
                <SettingsPanel
                  isCrossChainPage={isCrossChainPage}
                  isSwapPage={isSwapPage}
                  onBack={onBackToSwapTab}
                  onClickLiquiditySources={() => setActiveTab(TAB.LIQUIDITY_SOURCES)}
                />
              )}
              {activeTab === TAB.LIQUIDITY_SOURCES && (
                <LiquiditySourcesPanel onBack={() => setActiveTab(TAB.SETTINGS)} />
              )}
              {activeTab === TAB.LIMIT && <LimitOrder />}
              {isCrossChainPage && <CrossChain visible={activeTab === TAB.CROSS_CHAIN} />}
              {activeTab === TAB.GAS_TOKEN && <GasTokenSetting onBack={() => setActiveTab(TAB.SWAP)} />}
            </AppBodyWrapped>
            {isCrossChainPage && <CrossChainLink isBridge />}
          </SwapFormWrapper>

          <InfoComponents>
            {(isSwapPage || isLimitPage) && !isPartnerSwap && <EarnBanner />}
            {isShowTradeRoutes && isSwapPage && (
              <RoutesWrapper isOpenChart={false}>
                <Flex flexDirection="column" width="100%">
                  <Flex alignItems={'center'}>
                    <RoutingIconWrapper />
                    <Text fontSize={20} fontWeight={500} color={theme.subText}>
                      <Trans>Your trade route</Trans>
                    </Text>
                  </Flex>
                  <Suspense
                    fallback={
                      <Skeleton
                        height="100px"
                        baseColor={theme.background}
                        highlightColor={theme.buttonGray}
                        borderRadius="1rem"
                      />
                    }
                  >
                    <TradeRouting
                      tradeComposition={tradeRouteComposition}
                      currencyIn={currencyIn}
                      currencyOut={currencyOut}
                      inputAmount={routeSummary?.parsedAmountIn}
                      outputAmount={routeSummary?.parsedAmountOut}
                    />
                  </Suspense>
                </Flex>
              </RoutesWrapper>
            )}

            {isLimitPage && <ListLimitOrder />}
            {isCrossChainPage && <CrossChainTransfersHistory />}
          </InfoComponents>
        </Container>
        <Flex justifyContent="center">
          <SwitchLocaleLinkWrapper>
            <SwitchLocaleLink />
          </SwitchLocaleLinkWrapper>
        </Flex>
      </PageWrapper>
    </>
  )
}
