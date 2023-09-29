import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { ReactNode, Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { useLocation } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as RoutingIcon } from 'assets/svg/routing-icon.svg'
import Banner from 'components/Banner'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import TokenWarningModal from 'components/TokenWarningModal'
import TutorialSwap from 'components/Tutorial/TutorialSwap'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import GasPriceTrackerPanel from 'components/swapv2/GasPriceTrackerPanel'
import LimitOrder from 'components/swapv2/LimitOrder'
import ListLimitOrder from 'components/swapv2/LimitOrder/ListOrder'
import { ListOrderHandle } from 'components/swapv2/LimitOrder/type'
import LiquiditySourcesPanel from 'components/swapv2/LiquiditySourcesPanel'
import PairSuggestion, { PairSuggestionHandle } from 'components/swapv2/PairSuggestion'
import SettingsPanel from 'components/swapv2/SwapSettingsPanel'
import TokenInfoTab from 'components/swapv2/TokenInfo'
import {
  Container,
  InfoComponentsWrapper,
  KyberAIBannerWrapper,
  LiveChartWrapper,
  PageWrapper,
  RoutesWrapper,
  SwapFormWrapper,
  highlight,
} from 'components/swapv2/styleds'
import { APP_PATHS, TYPE_AND_SWAP_NOT_SUPPORTED_CHAINS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens, useIsLoadedTokenDefault } from 'hooks/Tokens'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import { BodyWrapper } from 'pages/AppBody'
import CrossChain from 'pages/CrossChain'
import CrossChainLink from 'pages/CrossChain/CrossChainLink'
import CrossChainTransfersHistory from 'pages/CrossChain/TransfersHistory'
import Header from 'pages/SwapV3/Header'
import useCurrenciesByPage from 'pages/SwapV3/useCurrenciesByPage'
import useTokenNotInDefault from 'pages/SwapV3/useTokenNotInDefault'
import { useLimitActionHandlers } from 'state/limit/hooks'
import { Field } from 'state/swap/actions'
import { useDefaultsFromURLSearch, useSwapActionHandlers } from 'state/swap/hooks'
import { useTutorialSwapGuide } from 'state/tutorial/hooks'
import { useShowKyberAIBanner, useShowLiveChart, useShowTradeRoutes } from 'state/user/hooks'
import { DetailedRouteSummary } from 'types/route'
import { getTradeComposition } from 'utils/aggregationRouting'

import KyberAIWidget from '../TrueSightV2/components/KyberAIWidget'
import PopulatedSwapForm from './PopulatedSwapForm'

const TradeRouting = lazy(() => import('components/TradeRouting'))

const LiveChart = lazy(() => import('components/LiveChart'))

const KyberAITokenBanner = lazy(() => import('components/KyberAITokenBanner'))

export const InfoComponents = ({ children }: { children: ReactNode[] }) => {
  return children.filter(Boolean).length ? <InfoComponentsWrapper>{children}</InfoComponentsWrapper> : null
}

export enum TAB {
  SWAP = 'swap',
  INFO = 'info',
  SETTINGS = 'settings',
  GAS_PRICE_TRACKER = 'gas_price_tracker',
  LIQUIDITY_SOURCES = 'liquidity_sources',
  LIMIT = 'limit',
  CROSS_CHAIN = 'cross_chain',
}

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
  const isShowLiveChart = useShowLiveChart()
  const isShowTradeRoutes = useShowTradeRoutes()
  const isShowKyberAIBanner = useShowKyberAIBanner()
  const qs = useParsedQueryString<{ highlightBox: string }>()
  const [{ show: isShowTutorial = false }] = useTutorialSwapGuide()
  const [routeSummary, setRouteSummary] = useState<DetailedRouteSummary>()
  const [isSelectCurrencyManually, setIsSelectCurrencyManually] = useState(false) // true when: select token input, output manually or click rotate token.

  const { pathname } = useLocation()

  const refSuggestPair = useRef<PairSuggestionHandle>(null)
  const refListLimitOrder = useRef<ListOrderHandle>(null)

  const [showingPairSuggestionImport, setShowingPairSuggestionImport] = useState<boolean>(false) // show modal import when click pair suggestion

  const shouldHighlightSwapBox = qs.highlightBox === 'true'

  const isSwapPage = pathname.startsWith(APP_PATHS.SWAP)
  const isLimitPage = pathname.startsWith(APP_PATHS.LIMIT)
  const isCrossChainPage = pathname.startsWith(APP_PATHS.CROSS_CHAIN)

  const getDefaultTab = useCallback(
    () => (isSwapPage ? TAB.SWAP : isLimitPage ? TAB.LIMIT : TAB.CROSS_CHAIN),
    [isSwapPage, isLimitPage],
  )

  const [activeTab, setActiveTab] = useState<TAB>(getDefaultTab())

  const { onSelectPair: onSelectPairLimit } = useLimitActionHandlers()

  useEffect(() => {
    setActiveTab(getDefaultTab())
  }, [getDefaultTab])

  const refreshListOrder = useCallback(() => {
    if (isLimitPage) {
      refListLimitOrder.current?.refreshListOrder()
    }
  }, [isLimitPage])

  useDefaultsFromURLSearch()

  const theme = useTheme()

  const { onCurrencySelection, onUserInput } = useSwapActionHandlers()
  const { currencies, currencyIn, currencyOut } = useCurrenciesByPage()

  // dismiss warning if all imported tokens are in active lists
  const defaultTokens = useAllTokens()
  const importTokensNotInDefault = useTokenNotInDefault()

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
    },
    [onUserInput],
  )

  // reset if they close warning without tokens in params
  const handleDismissTokenWarning = useCallback(() => {
    if (showingPairSuggestionImport) {
      setShowingPairSuggestionImport(false)
    }
  }, [showingPairSuggestionImport])

  const handleConfirmTokenWarning = useCallback(
    (tokens: Currency[]) => {
      handleDismissTokenWarning()
      if (showingPairSuggestionImport) {
        refSuggestPair.current?.onConfirmImportToken() // callback from children
      }
      if (isLimitPage) {
        onSelectPairLimit(tokens[0], tokens[1])
        setIsSelectCurrencyManually(true)
      }
    },
    [isLimitPage, onSelectPairLimit, showingPairSuggestionImport, handleDismissTokenWarning],
  )

  const onSelectSuggestedPair = useCallback(
    (fromToken: Currency | undefined, toToken: Currency | undefined, amount?: string) => {
      if (isLimitPage) {
        onSelectPairLimit(fromToken, toToken)
        setIsSelectCurrencyManually(true)
        return
      }

      if (fromToken) onCurrencySelection(Field.INPUT, fromToken)
      if (toToken) onCurrencySelection(Field.OUTPUT, toToken)
      if (amount) handleTypeInput(amount)
    },
    [handleTypeInput, onCurrencySelection, onSelectPairLimit, isLimitPage],
  )

  const isLoadedTokenDefault = useIsLoadedTokenDefault()

  const onBackToSwapTab = () => setActiveTab(getDefaultTab())

  const isShowModalImportToken =
    !isCrossChainPage && isLoadedTokenDefault && importTokensNotInDefault.length > 0 && showingPairSuggestionImport

  const tradeRouteComposition = useMemo(() => {
    return getTradeComposition(chainId, routeSummary?.parsedAmountIn, undefined, routeSummary?.route, defaultTokens)
  }, [chainId, defaultTokens, routeSummary])
  const swapActionsRef = useRef(null)

  return (
    <>
      {isSwapPage && <TutorialSwap />}
      <TokenWarningModal
        isOpen={isShowModalImportToken}
        tokens={importTokensNotInDefault}
        onConfirm={handleConfirmTokenWarning}
      />
      <PageWrapper>
        <Banner />
        <Container>
          <SwapFormWrapper isShowTutorial={isShowTutorial}>
            <Header activeTab={activeTab} setActiveTab={setActiveTab} swapActionsRef={swapActionsRef} />

            {(isLimitPage || isSwapPage) && !TYPE_AND_SWAP_NOT_SUPPORTED_CHAINS.includes(chainId) && (
              <PairSuggestion
                ref={refSuggestPair}
                onSelectSuggestedPair={onSelectSuggestedPair}
                setShowModalImportToken={setShowingPairSuggestionImport}
              />
            )}

            <AppBodyWrapped
              data-highlight={shouldHighlightSwapBox}
              id={TutorialIds.SWAP_FORM}
              style={activeTab === TAB.INFO ? { padding: 0 } : undefined}
            >
              {isSwapPage && (
                <PopulatedSwapForm
                  onSelectSuggestedPair={onSelectSuggestedPair}
                  routeSummary={routeSummary}
                  setRouteSummary={setRouteSummary}
                  goToSettingsView={() => setActiveTab(TAB.SETTINGS)}
                  hidden={activeTab !== TAB.SWAP}
                />
              )}
              {activeTab === TAB.INFO && <TokenInfoTab currencies={currencies} onBack={onBackToSwapTab} />}
              {activeTab === TAB.SETTINGS && (
                <SettingsPanel
                  isCrossChainPage={isCrossChainPage}
                  isLimitOrder={isLimitPage}
                  isSwapPage={isSwapPage}
                  onBack={onBackToSwapTab}
                  onClickLiquiditySources={() => setActiveTab(TAB.LIQUIDITY_SOURCES)}
                  onClickGasPriceTracker={() => setActiveTab(TAB.GAS_PRICE_TRACKER)}
                  swapActionsRef={swapActionsRef}
                />
              )}
              {activeTab === TAB.GAS_PRICE_TRACKER && (
                <GasPriceTrackerPanel onBack={() => setActiveTab(TAB.SETTINGS)} />
              )}
              {activeTab === TAB.LIQUIDITY_SOURCES && (
                <LiquiditySourcesPanel onBack={() => setActiveTab(TAB.SETTINGS)} />
              )}
              {activeTab === TAB.LIMIT && (
                <LimitOrder
                  isSelectCurrencyManual={isSelectCurrencyManually}
                  setIsSelectCurrencyManual={setIsSelectCurrencyManually}
                  refreshListOrder={refreshListOrder}
                />
              )}
              {isCrossChainPage && <CrossChain visible={activeTab === TAB.CROSS_CHAIN} />}
            </AppBodyWrapped>
            {isCrossChainPage && <CrossChainLink isBridge />}
          </SwapFormWrapper>

          <InfoComponents>
            {isShowKyberAIBanner && (
              <KyberAIBannerWrapper>
                <Suspense
                  fallback={
                    <Skeleton
                      height="84px"
                      baseColor={theme.background}
                      highlightColor={theme.buttonGray}
                      borderRadius="24px"
                    />
                  }
                >
                  <KyberAITokenBanner currencyIn={currencyIn} currencyOut={currencyOut} />
                </Suspense>
              </KyberAIBannerWrapper>
            )}
            {isShowLiveChart && (
              <LiveChartWrapper>
                <Suspense
                  fallback={
                    <Skeleton
                      height="100%"
                      baseColor={theme.background}
                      highlightColor={theme.buttonGray}
                      borderRadius="1rem"
                    />
                  }
                >
                  <LiveChart currencies={currencies} enableProChart={isSwapPage} />
                </Suspense>
              </LiveChartWrapper>
            )}
            {isShowTradeRoutes && isSwapPage && (
              <RoutesWrapper isOpenChart={isShowLiveChart}>
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
            {isLimitPage && <ListLimitOrder ref={refListLimitOrder} />}
            {isCrossChainPage && <CrossChainTransfersHistory />}
          </InfoComponents>
        </Container>
        <Flex justifyContent="center">
          <SwitchLocaleLinkWrapper>
            <SwitchLocaleLink />
          </SwitchLocaleLinkWrapper>
        </Flex>
        <KyberAIWidget />
      </PageWrapper>
    </>
  )
}
