import { Currency } from '@kyberswap/ks-sdk-core'
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Flex } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as RoutingIcon } from 'assets/svg/routing-icon.svg'
import Banner from 'components/Banner'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import TutorialSwap from 'components/Tutorial/TutorialSwap'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import GasPriceTrackerPanel from 'components/swapv2/GasPriceTrackerPanel'
import GasTokenSetting from 'components/swapv2/GasTokenSetting'
import LimitOrder from 'components/swapv2/LimitOrder'
import ListLimitOrder from 'components/swapv2/LimitOrder/ListOrder'
import LiquiditySourcesPanel from 'components/swapv2/LiquiditySourcesPanel'
import SettingsPanel from 'components/swapv2/SwapSettingsPanel'
import TokenInfoTab from 'components/swapv2/TokenInfo'
import { Container, InfoComponentsWrapper, PageWrapper, SwapFormWrapper, highlight } from 'components/swapv2/styleds'
import { APP_PATHS } from 'constants/index'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { BodyWrapper } from 'pages/AppBody'
import CrossChain from 'pages/CrossChain'
import CrossChainLink from 'pages/CrossChain/CrossChainLink'
import CrossChainTransfersHistory from 'pages/CrossChain/TransfersHistory'
import Header from 'pages/SwapV3/Header'
import useCurrenciesByPage from 'pages/SwapV3/useCurrenciesByPage'
import { useLimitActionHandlers } from 'state/limit/hooks'
import { Field } from 'state/swap/actions'
import { useDefaultsFromURLSearch, useSwapActionHandlers } from 'state/swap/hooks'
import { useTutorialSwapGuide } from 'state/tutorial/hooks'
import { DetailedRouteSummary } from 'types/route'

import PopulatedSwapForm from './PopulatedSwapForm'

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
  GAS_TOKEN = 'gas_token',
}

export const isSettingTab = (tab: TAB) =>
  [TAB.INFO, TAB.SETTINGS, TAB.GAS_PRICE_TRACKER, TAB.LIQUIDITY_SOURCES].includes(tab)

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
  const qs = useParsedQueryString<{ highlightBox: string }>()
  const [{ show: isShowTutorial = false }] = useTutorialSwapGuide()
  const [routeSummary, setRouteSummary] = useState<DetailedRouteSummary>()
  const [isSelectCurrencyManually, setIsSelectCurrencyManually] = useState(false) // true when: select token input, output manually or click rotate token.

  const { pathname } = useLocation()

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

  useDefaultsFromURLSearch()

  const { onCurrencySelection, onUserInput } = useSwapActionHandlers()
  const { currencies } = useCurrenciesByPage()

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
    },
    [onUserInput],
  )

  const onSelectSuggestedPair = useCallback(
    (fromToken: Currency | undefined, toToken: Currency | undefined, amount?: string) => {
      if (isLimitPage) {
        onSelectPairLimit(fromToken, toToken, amount)
        setIsSelectCurrencyManually(true)
        return
      }

      if (fromToken) onCurrencySelection(Field.INPUT, fromToken)
      if (toToken) onCurrencySelection(Field.OUTPUT, toToken)
      if (amount) handleTypeInput(amount)
    },
    [handleTypeInput, onCurrencySelection, onSelectPairLimit, isLimitPage],
  )

  const onBackToSwapTab = () => setActiveTab(getDefaultTab())

  const swapActionsRef = useRef(null)

  return (
    <>
      {isSwapPage && <TutorialSwap />}
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
                  onSelectSuggestedPair={onSelectSuggestedPair}
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
                />
              )}
              {isCrossChainPage && <CrossChain visible={activeTab === TAB.CROSS_CHAIN} />}
              {activeTab === TAB.GAS_TOKEN && <GasTokenSetting onBack={() => setActiveTab(TAB.SWAP)} />}
            </AppBodyWrapped>
            {isCrossChainPage && <CrossChainLink isBridge />}
          </SwapFormWrapper>

          <InfoComponents>
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
