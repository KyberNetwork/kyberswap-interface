import { ChainId, Currency, Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { stringify } from 'querystring'
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { useLocation, useNavigate } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled, { DefaultTheme, keyframes } from 'styled-components'

import { ReactComponent as TutorialSvg } from 'assets/svg/play_circle_outline.svg'
import { ReactComponent as RoutingIcon } from 'assets/svg/routing-icon.svg'
import Banner from 'components/Banner'
import TransactionSettingsIcon from 'components/Icons/TransactionSettingsIcon'
import { RowBetween } from 'components/Row'
import { SEOSwap } from 'components/SEO'
import { ShareButtonWithModal } from 'components/ShareModal'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import TokenWarningModal from 'components/TokenWarningModal'
import { MouseoverTooltip } from 'components/Tooltip'
import TopTrendingSoonTokensInCurrentNetwork from 'components/TopTrendingSoonTokensInCurrentNetwork'
import Tutorial, { TutorialType } from 'components/Tutorial'
import TutorialSwap from 'components/Tutorial/TutorialSwap'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import AdvancedSwapDetailsDropdown from 'components/swapv2/AdvancedSwapDetailsDropdown'
import GasPriceTrackerPanel from 'components/swapv2/GasPriceTrackerPanel'
import LimitOrder from 'components/swapv2/LimitOrder'
import ListLimitOrder from 'components/swapv2/LimitOrder/ListOrder'
import { ListOrderHandle } from 'components/swapv2/LimitOrder/type'
import LiquiditySourcesPanel from 'components/swapv2/LiquiditySourcesPanel'
import MobileTokenInfo from 'components/swapv2/MobileTokenInfo'
import PairSuggestion, { PairSuggestionHandle } from 'components/swapv2/PairSuggestion'
import SwapForm from 'components/swapv2/SwapForm'
import SettingsPanel from 'components/swapv2/SwapSettingsPanel'
import TokenInfo from 'components/swapv2/TokenInfo'
import TokenInfoV2 from 'components/swapv2/TokenInfoV2'
import {
  Container,
  InfoComponentsWrapper,
  LiveChartWrapper,
  PageWrapper,
  RoutesWrapper,
  StyledActionButtonSwapForm,
  SwapFormActions,
  SwapFormWrapper,
  Tab,
  TabContainer,
  TabWrapper,
} from 'components/swapv2/styleds'
import { APP_PATHS } from 'constants/index'
import { STABLE_COINS_ADDRESS } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens, useIsLoadedTokenDefault } from 'hooks/Tokens'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useParsedQueryString from 'hooks/useParsedQueryString'
import usePrevious from 'hooks/usePrevious'
import { useSyncNetworkParamWithStore } from 'hooks/useSyncNetworkParamWithStore'
import useSyncTokenSymbolToUrl from 'hooks/useSyncTokenSymbolToUrl'
import useTheme from 'hooks/useTheme'
import useWrapCallback, { WrapType } from 'hooks/useWrapCallback'
import { BodyWrapper } from 'pages/AppBody'
import VerifyComponent from 'pages/Verify/VerifyComponent'
import { useLimitActionHandlers, useLimitState } from 'state/limit/hooks'
import { Field } from 'state/swap/actions'
import {
  useDefaultsFromURLSearch,
  useInputCurrency,
  useOutputCurrency,
  useSwapActionHandlers,
  useSwapState,
} from 'state/swap/hooks'
import useParsedAmountFromInputCurrency from 'state/swap/hooks/useParsedAmountFromInputCurrency'
import { useDerivedSwapInfoV2 } from 'state/swap/useAggregator'
import { useTutorialSwapGuide } from 'state/tutorial/hooks'
import {
  useExpertModeManager,
  useShowLiveChart,
  useShowTokenInfo,
  useShowTradeRoutes,
  useToggleProLiveChart,
  useUserAddedTokens,
  useUserSlippageTolerance,
} from 'state/user/hooks'
import { isSupportLimitOrder } from 'utils'
import { SwapRouteV2, getTradeComposition } from 'utils/aggregationRouting'
import { currencyId } from 'utils/currencyId'
import { getSymbolSlug } from 'utils/string'
import { checkPairInWhiteList } from 'utils/tokenInfo'

const LiveChart = lazy(() => import('components/LiveChart'))
const Routing = lazy(() => import('components/swapv2/Routing'))
const TutorialIcon = styled(TutorialSvg)`
  width: 22px;
  height: 22px;
  path {
    fill: ${({ theme }) => theme.subText};
    stroke: ${({ theme }) => theme.subText};
  }
`

enum TAB {
  SWAP = 'swap',
  INFO = 'info',
  SETTINGS = 'settings',
  GAS_PRICE_TRACKER = 'gas_price_tracker',
  LIQUIDITY_SOURCES = 'liquidity_sources',
  LIMIT = 'limit',
}

const highlight = (theme: DefaultTheme) => keyframes`
  0% {
    box-shadow: 0 0 0 0 ${theme.primary};
  }

  70% {
    box-shadow: 0 0 0 2px ${theme.primary};
  }

  100% {
    box-shadow: 0 0 0 0 ${theme.primary};
  }
`

const AppBodyWrapped = styled(BodyWrapper)`
  box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.04);
  padding: 16px 16px 24px;
  margin-top: 0;

  &[data-highlight='true'] {
    animation: ${({ theme }) => highlight(theme)} 2s 2 alternate ease-in-out;
  }
`

const SwitchLocaleLinkWrapper = styled.div`
  margin-bottom: 30px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
  margin-bottom: 0px;
`}
`

const RoutingIconWrapper = styled(RoutingIcon)`
  height: 27px;
  width: 27px;
  margin-right: 10px;
  path {
    fill: ${({ theme }) => theme.subText} !important;
  }
`

export default function Swap() {
  const navigateFn = useNavigate()
  const { chainId, networkInfo, isSolana } = useActiveWeb3React()
  const isShowLiveChart = useShowLiveChart()
  const toggleProLiveChart = useToggleProLiveChart()
  const isShowTradeRoutes = useShowTradeRoutes()
  const isShowTokenInfoSetting = useShowTokenInfo()
  const qs = useParsedQueryString<{
    highlightBox: string
    outputCurrency: string
    inputCurrency: string
  }>()
  const [{ show: isShowTutorial = false }] = useTutorialSwapGuide()
  const { pathname } = useLocation()
  useSyncNetworkParamWithStore()

  const refSuggestPair = useRef<PairSuggestionHandle>(null)
  const refListLimitOrder = useRef<ListOrderHandle>(null)

  const [showingPairSuggestionImport, setShowingPairSuggestionImport] = useState<boolean>(false) // show modal import when click pair suggestion

  const shouldHighlightSwapBox = qs.highlightBox === 'true'

  const [isSelectCurrencyManually, setIsSelectCurrencyManually] = useState(false) // true when: select token input, output manualy or click rotate token.
  // else select via url

  const isSwapPage = pathname.startsWith(APP_PATHS.SWAP)
  const isLimitPage = pathname.startsWith(APP_PATHS.LIMIT)
  const [activeTab, setActiveTab] = useState<TAB>(isSwapPage ? TAB.SWAP : TAB.LIMIT)
  const { onSelectPair: onSelectPairLimit } = useLimitActionHandlers()
  const limitState = useLimitState()
  const currenciesLimit = useMemo(() => {
    return { [Field.INPUT]: limitState.currencyIn, [Field.OUTPUT]: limitState.currencyOut }
  }, [limitState.currencyIn, limitState.currencyOut])

  useEffect(() => {
    setActiveTab(isSwapPage ? TAB.SWAP : TAB.LIMIT)
  }, [isSwapPage])

  const refreshListOrder = useCallback(() => {
    if (isLimitPage) {
      refListLimitOrder.current?.refreshListOrder()
    }
  }, [isLimitPage])

  useDefaultsFromURLSearch()
  const [dismissTokenWarning, setDismissTokenWarning] = useState<boolean>(false)

  const theme = useTheme()

  // for expert mode
  const [isExpertMode] = useExpertModeManager()

  // swap state
  const { independentField, typedValue, feeConfig, [Field.INPUT]: INPUT, [Field.OUTPUT]: OUTPUT } = useSwapState()

  const { onCurrencySelection, onResetSelectCurrency, onUserInput, onChangeRecipient } = useSwapActionHandlers()

  const { v2Trade } = useDerivedSwapInfoV2()

  const currencyIn = useInputCurrency()
  const currencyOut = useOutputCurrency()
  const parsedAmount = useParsedAmountFromInputCurrency()

  const currencies = useMemo(
    () => ({
      [Field.INPUT]: currencyIn,
      [Field.OUTPUT]: currencyOut,
    }),
    [currencyIn, currencyOut],
  )

  const urlLoadedTokens: Token[] = useMemo(
    () =>
      (isSwapPage ? [currencyIn, currencyOut] : [limitState.currencyIn, limitState.currencyOut])?.filter(
        (c): c is Token => c instanceof Token,
      ) ?? [],
    [isSwapPage, currencyIn, currencyOut, limitState.currencyIn, limitState.currencyOut],
  )
  // dismiss warning if all imported tokens are in active lists
  const defaultTokens = useAllTokens()
  const importTokensNotInDefault =
    urlLoadedTokens &&
    urlLoadedTokens.filter((token: Token) => {
      return !Boolean(token.address in defaultTokens)
    })

  const { wrapType } = useWrapCallback(currencyIn, currencyOut, typedValue)

  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE
  const trade = showWrap ? undefined : v2Trade

  const parsedAmounts = showWrap
    ? {
        [Field.INPUT]: parsedAmount,
        [Field.OUTPUT]: parsedAmount,
      }
    : {
        [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
        [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount,
      }

  // reset recipient
  useEffect(() => {
    onChangeRecipient(null)
  }, [onChangeRecipient, isExpertMode])

  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

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
    } else {
      setDismissTokenWarning(true)
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
      }
    },
    [isLimitPage, onSelectPairLimit, showingPairSuggestionImport, handleDismissTokenWarning],
  )

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: showWrap
      ? parsedAmounts[independentField]?.toExact() ?? ''
      : parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  }

  const { mixpanelHandler } = useMixpanel(trade, currencies)

  const onSelectSuggestedPair = useCallback(
    (fromToken: Currency | undefined, toToken: Currency | undefined, amount?: string) => {
      if (isLimitPage) {
        onSelectPairLimit(fromToken, toToken)
        return
      }
      if (fromToken) onCurrencySelection(Field.INPUT, fromToken)
      if (toToken) onCurrencySelection(Field.OUTPUT, toToken)
      if (amount) handleTypeInput(amount)
    },
    [handleTypeInput, onCurrencySelection, onSelectPairLimit, isLimitPage],
  )

  const tokenImports: Token[] = useUserAddedTokens()
  const prevTokenImports = usePrevious(tokenImports)

  useEffect(() => {
    // when remove token imported
    if (!prevTokenImports) return
    const isRemoved = prevTokenImports?.length > tokenImports.length
    if (!isRemoved || prevTokenImports[0].chainId !== chainId) return

    const addressIn = currencyIn?.wrapped?.address
    const addressOut = currencyOut?.wrapped?.address
    // removed token => deselect input
    const tokenRemoved = prevTokenImports.filter(
      token => !tokenImports.find(token2 => token2.address === token.address),
    )

    tokenRemoved.forEach(({ address }: Token) => {
      if (address === addressIn || !currencyIn) {
        onResetSelectCurrency(Field.INPUT)
      }
      if (address === addressOut || !currencyOut) {
        onResetSelectCurrency(Field.OUTPUT)
      }
    })
  }, [tokenImports, chainId, prevTokenImports, currencyIn, currencyOut, onResetSelectCurrency])

  useSyncTokenSymbolToUrl(currencyIn, currencyOut, onSelectSuggestedPair, isSelectCurrencyManually, isLimitPage)
  const isLoadedTokenDefault = useIsLoadedTokenDefault()

  useEffect(() => {
    if (isExpertMode) {
      mixpanelHandler(MIXPANEL_TYPE.ADVANCED_MODE_ON)
    }
  }, [isExpertMode, mixpanelHandler])

  const [rawSlippage, setRawSlippage] = useUserSlippageTolerance()

  const isStableCoinSwap =
    INPUT?.currencyId &&
    OUTPUT?.currencyId &&
    chainId &&
    STABLE_COINS_ADDRESS[chainId].includes(INPUT?.currencyId) &&
    STABLE_COINS_ADDRESS[chainId].includes(OUTPUT?.currencyId)

  const rawSlippageRef = useRef(rawSlippage)
  rawSlippageRef.current = rawSlippage

  useEffect(() => {
    if (isStableCoinSwap && rawSlippageRef.current > 10) {
      setRawSlippage(10)
    }
    if (!isStableCoinSwap && rawSlippageRef.current === 10) {
      setRawSlippage(50)
    }
  }, [isStableCoinSwap, setRawSlippage])

  const shareUrl = useMemo(() => {
    const tokenIn = isSwapPage ? currencyIn : limitState.currencyIn
    const tokenOut = isSwapPage ? currencyOut : limitState.currencyOut
    return `${window.location.origin}${isSwapPage ? APP_PATHS.SWAP : APP_PATHS.LIMIT}/${networkInfo.route}${
      tokenIn && tokenOut
        ? `?${stringify({
            inputCurrency: currencyId(tokenIn, chainId),
            outputCurrency: currencyId(tokenOut, chainId),
          })}`
        : ''
    }`
  }, [networkInfo.route, currencyIn, currencyOut, chainId, limitState.currencyIn, limitState.currencyOut, isSwapPage])

  const { isInWhiteList: isPairInWhiteList, canonicalUrl } = checkPairInWhiteList(
    chainId,
    getSymbolSlug(currencyIn),
    getSymbolSlug(currencyOut),
  )

  const onBackToSwapTab = () => setActiveTab(isLimitPage ? TAB.LIMIT : TAB.SWAP)
  const onToggleActionTab = (tab: TAB) => setActiveTab(activeTab === tab ? (isLimitPage ? TAB.LIMIT : TAB.SWAP) : tab)

  const shouldRenderTokenInfo = isShowTokenInfoSetting && currencyIn && currencyOut && isPairInWhiteList && isSwapPage

  const isShowModalImportToken =
    isLoadedTokenDefault && importTokensNotInDefault.length > 0 && (!dismissTokenWarning || showingPairSuggestionImport)

  const onClickTab = (tab: TAB) => {
    setActiveTab(tab)
    const isLimit = tab === TAB.LIMIT
    isLimit && toggleProLiveChart(true)
    const { inputCurrency, outputCurrency, ...newQs } = qs
    navigateFn({
      pathname: `${isLimit ? APP_PATHS.LIMIT : APP_PATHS.SWAP}/${networkInfo.route}`,
      search: stringify(newQs),
    })
  }

  const tradeComposition = useMemo((): SwapRouteV2[] | undefined => {
    try {
      return getTradeComposition(trade, chainId, defaultTokens)
    } catch (e) {
      return undefined
    }
  }, [trade, chainId, defaultTokens])

  return (
    <>
      {/**
       * /swap/bnb/knc-to-usdt vs /swap/bnb/usdt-to-knc has same content
       * => add canonical link that specify which is main page, => /swap/bnb/knc-to-usdt
       */}
      <SEOSwap canonicalUrl={canonicalUrl} />
      <TutorialSwap />
      <VerifyComponent />
      <TokenWarningModal
        isOpen={isShowModalImportToken}
        tokens={importTokensNotInDefault}
        onConfirm={handleConfirmTokenWarning}
        onDismiss={handleDismissTokenWarning}
      />
      <PageWrapper>
        <Banner />
        {chainId !== ChainId.ETHW && <TopTrendingSoonTokensInCurrentNetwork />}
        <Container>
          <SwapFormWrapper isShowTutorial={isShowTutorial}>
            <RowBetween>
              <TabContainer>
                <TabWrapper>
                  <Tab onClick={() => onClickTab(TAB.SWAP)} isActive={isSwapPage}>
                    <Text fontSize={20} fontWeight={500}>
                      <Trans>Swap</Trans>
                    </Text>
                  </Tab>
                  {isSupportLimitOrder(chainId) && (
                    <Tab onClick={() => onClickTab(TAB.LIMIT)} isActive={isLimitPage}>
                      <Text fontSize={20} fontWeight={500}>
                        <Trans>Limit</Trans>
                      </Text>
                    </Tab>
                  )}
                </TabWrapper>
              </TabContainer>

              <SwapFormActions>
                <Tutorial
                  type={TutorialType.SWAP}
                  customIcon={
                    <StyledActionButtonSwapForm>
                      <TutorialIcon />
                    </StyledActionButtonSwapForm>
                  }
                />
                {chainId !== ChainId.ETHW && (
                  <MobileTokenInfo
                    currencies={isSwapPage ? currencies : currenciesLimit}
                    onClick={() => onToggleActionTab(TAB.INFO)}
                  />
                )}
                <ShareButtonWithModal
                  title={t`Share this with your friends!`}
                  url={shareUrl}
                  onShared={() => {
                    mixpanelHandler(MIXPANEL_TYPE.TOKEN_SWAP_LINK_SHARED)
                  }}
                />
                <StyledActionButtonSwapForm
                  active={activeTab === TAB.SETTINGS}
                  onClick={() => onToggleActionTab(TAB.SETTINGS)}
                  aria-label="Swap Settings"
                >
                  <MouseoverTooltip
                    text={!isExpertMode ? <Trans>Settings</Trans> : <Trans>Advanced mode is on!</Trans>}
                    placement="top"
                    width="fit-content"
                  >
                    <span id={TutorialIds.BUTTON_SETTING_SWAP_FORM}>
                      <TransactionSettingsIcon fill={isExpertMode ? theme.warning : theme.subText} />
                    </span>
                  </MouseoverTooltip>
                </StyledActionButtonSwapForm>
              </SwapFormActions>
            </RowBetween>

            <RowBetween>
              <Text fontSize={12} color={theme.subText}>
                {isLimitPage ? (
                  <Trans>Buy or sell any token at a specific price</Trans>
                ) : (
                  <Trans>Buy or sell any token instantly at the best price</Trans>
                )}
              </Text>
            </RowBetween>

            {chainId !== ChainId.ETHW && !isSolana && (
              <RowBetween>
                <PairSuggestion
                  ref={refSuggestPair}
                  onSelectSuggestedPair={onSelectSuggestedPair}
                  setShowModalImportToken={setShowingPairSuggestionImport}
                />
              </RowBetween>
            )}

            <AppBodyWrapped data-highlight={shouldHighlightSwapBox} id={TutorialIds.SWAP_FORM}>
              {activeTab === TAB.SWAP && ( // todo danh split component, check router api call
                <SwapForm />
              )}
              {activeTab === TAB.INFO && (
                <TokenInfo currencies={isSwapPage ? currencies : currenciesLimit} onBack={onBackToSwapTab} />
              )}
              {activeTab === TAB.SETTINGS && (
                <SettingsPanel
                  isLimitOrder={isLimitPage}
                  onBack={onBackToSwapTab}
                  onClickLiquiditySources={() => setActiveTab(TAB.LIQUIDITY_SOURCES)}
                  onClickGasPriceTracker={() => setActiveTab(TAB.GAS_PRICE_TRACKER)}
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
            </AppBodyWrapped>
            {isSwapPage && <AdvancedSwapDetailsDropdown trade={trade} feeConfig={feeConfig} />}
          </SwapFormWrapper>

          {(isShowLiveChart || isShowTradeRoutes || shouldRenderTokenInfo || isLimitPage) && (
            <InfoComponentsWrapper>
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
                    <LiveChart currencies={isSwapPage ? currencies : currenciesLimit} />
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
                      <Routing
                        tradeComposition={tradeComposition}
                        currencies={currencies}
                        formattedAmounts={formattedAmounts}
                      />
                    </Suspense>
                  </Flex>
                </RoutesWrapper>
              )}
              {isLimitPage && <ListLimitOrder ref={refListLimitOrder} />}
              {shouldRenderTokenInfo && <TokenInfoV2 currencyIn={currencyIn} currencyOut={currencyOut} />}
            </InfoComponentsWrapper>
          )}
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
