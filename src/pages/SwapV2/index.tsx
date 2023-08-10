import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import JSBI from 'jsbi'
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Info } from 'react-feather'
import Skeleton from 'react-loading-skeleton'
import { useLocation } from 'react-router-dom'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'

import christmasImg from 'assets/images/christmas-decor2.svg'
import AddressInputPanel from 'components/AddressInputPanel'
import ApproveMessage from 'components/ApproveMessage'
import ArrowRotate from 'components/ArrowRotate'
import Banner from 'components/Banner'
import { ButtonConfirmed, ButtonError, ButtonLight, ButtonPrimary } from 'components/Button'
import { GreyCard } from 'components/Card'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import InfoHelper from 'components/InfoHelper'
import Loader from 'components/Loader'
import ProgressSteps from 'components/ProgressSteps'
import Row, { AutoRow, RowBetween } from 'components/Row'
import { SEOSwap } from 'components/SEO'
import SlippageWarningNote from 'components/SlippageWarningNote'
import { Label } from 'components/SwapForm/OutputCurrencyPanel'
import PriceImpactNote from 'components/SwapForm/PriceImpactNote'
import SlippageSettingGroup from 'components/SwapForm/SlippageSettingGroup'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import TokenWarningModal from 'components/TokenWarningModal'
import { MouseoverTooltip } from 'components/Tooltip'
import TutorialSwap from 'components/Tutorial/TutorialSwap'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import AdvancedSwapDetailsDropdown from 'components/swapv2/AdvancedSwapDetailsDropdown'
import ConfirmSwapModal from 'components/swapv2/ConfirmSwapModal'
import GasPriceTrackerPanel from 'components/swapv2/GasPriceTrackerPanel'
import LiquiditySourcesPanel from 'components/swapv2/LiquiditySourcesPanel'
import RefreshButton from 'components/swapv2/RefreshButton'
import SettingsPanel from 'components/swapv2/SwapSettingsPanel'
import TokenInfoTab from 'components/swapv2/TokenInfoTab'
import TokenInfoV2 from 'components/swapv2/TokenInfoV2'
import TradePrice from 'components/swapv2/TradePrice'
import TradeTypeSelection from 'components/swapv2/TradeTypeSelection'
import {
  BottomGrouping,
  Container,
  Dots,
  LiveChartWrapper,
  PageWrapper,
  RoutesWrapper,
  SwapCallbackError,
  SwapFormWrapper,
  Wrapper,
} from 'components/swapv2/styleds'
import { AGGREGATOR_WAITING_TIME, APP_PATHS, TIME_TO_REFRESH_SWAP_RATE } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens, useIsLoadedTokenDefault, useStableCoins } from 'hooks/Tokens'
import { ApprovalState, useApproveCallbackFromTradeV2 } from 'hooks/useApproveCallback'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useSwapV2Callback } from 'hooks/useSwapV2Callback'
import useSyncTokenSymbolToUrl from 'hooks/useSyncTokenSymbolToUrl'
import useTheme from 'hooks/useTheme'
import useWrapCallback, { WrapType } from 'hooks/useWrapCallback'
import { AppBodyWrapped, InfoComponents, RoutingIconWrapper, SwitchLocaleLinkWrapper, TAB } from 'pages/SwapV3'
import Header from 'pages/SwapV3/Header'
import useResetCurrenciesOnRemoveImportedTokens from 'pages/SwapV3/useResetCurrenciesOnRemoveImportedTokens'
import useTokenNotInDefault from 'pages/SwapV3/useTokenNotInDefault'
import useUpdateSlippageInStableCoinSwap from 'pages/SwapV3/useUpdateSlippageInStableCoinSwap'
import { useWalletModalToggle } from 'state/application/hooks'
import { Field } from 'state/swap/actions'
import { useDefaultsFromURLSearch, useEncodeSolana, useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import { useDerivedSwapInfoV2 } from 'state/swap/useAggregator'
import { useTutorialSwapGuide } from 'state/tutorial/hooks'
import {
  useDegenModeManager,
  useHolidayMode,
  useShowLiveChart,
  useShowTokenInfo,
  useShowTradeRoutes,
  useUserSlippageTolerance,
} from 'state/user/hooks'
import { formattedNum } from 'utils'
import { getTradeComposition } from 'utils/aggregationRouting'
import { Aggregator } from 'utils/aggregator'
import { halfAmountSpend, maxAmountSpend } from 'utils/maxAmountSpend'
import { checkPriceImpact } from 'utils/prices'
import { captureSwapError } from 'utils/sentry'
import { getSymbolSlug } from 'utils/string'
import { checkPairInWhiteList } from 'utils/tokenInfo'

const LiveChart = lazy(() => import('components/LiveChart'))
const Routing = lazy(() => import('components/TradeRouting'))

const ChristmasDecor = styled.div`
  position: absolute;
  top: -20px;
  right: -8px;
  left: -8px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    top: -16px;
    right: -6px;
    left: -4px;
  `}
`

export default function Swap() {
  const { account, chainId, isSolana, isEVM } = useActiveWeb3React()
  const [rotate, setRotate] = useState(false)
  const isShowLiveChart = useShowLiveChart()
  const [holidayMode] = useHolidayMode()
  const isShowTradeRoutes = useShowTradeRoutes()
  const isShowTokenInfoSetting = useShowTokenInfo()
  const qs = useParsedQueryString<{ highlightBox: string }>()
  const [{ show: isShowTutorial = false }] = useTutorialSwapGuide()
  const { pathname } = useLocation()
  const [encodeSolana] = useEncodeSolana()

  const shouldHighlightSwapBox = qs.highlightBox === 'true'

  const [isSelectCurrencyManually, setIsSelectCurrencyManually] = useState(false) // true when: select token input, output manualy or click rotate token.
  // else select via url

  const isSwapPage = pathname.startsWith(APP_PATHS.SWAP)
  const [activeTab, setActiveTab] = useState<TAB>(TAB.SWAP)

  useEffect(() => {
    setActiveTab(TAB.SWAP)
  }, [isSwapPage])

  useDefaultsFromURLSearch()
  const [dismissTokenWarning, setDismissTokenWarning] = useState<boolean>(false)

  const theme = useTheme()

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

  const [isDegenMode] = useDegenModeManager()

  // get custom setting values for user
  const [allowedSlippage] = useUserSlippageTolerance()

  // swap state
  const { independentField, typedValue, recipient, [Field.INPUT]: INPUT, [Field.OUTPUT]: OUTPUT } = useSwapState()

  const {
    onSwitchTokensV2,
    onCurrencySelection,
    onResetSelectCurrency,
    onUserInput,
    onChangeRecipient,
    onChangeTrade,
  } = useSwapActionHandlers()

  const {
    v2Trade,
    currencyBalances,
    parsedAmount,
    currencies,
    inputError: swapInputError,
    onRefresh,
    loading: loadingAPI,
  } = useDerivedSwapInfoV2()

  // modal and loading
  const [{ showConfirm, tradeToConfirm, swapErrorMessage, attemptingTxn, txHash }, setSwapState] = useState<{
    showConfirm: boolean
    tradeToConfirm: Aggregator | undefined
    attemptingTxn: boolean
    swapErrorMessage: string | undefined
    txHash: string | undefined
  }>({
    showConfirm: false,
    tradeToConfirm: undefined,
    attemptingTxn: false,
    swapErrorMessage: undefined,
    txHash: undefined,
  })

  const currencyIn: Currency | undefined = currencies[Field.INPUT]
  const currencyOut: Currency | undefined = currencies[Field.OUTPUT]

  // dismiss warning if all imported tokens are in active lists
  const defaultTokens = useAllTokens()
  const importTokensNotInDefault = useTokenNotInDefault()

  const balanceIn: CurrencyAmount<Currency> | undefined = currencyBalances[Field.INPUT]
  const balanceOut: CurrencyAmount<Currency> | undefined = currencyBalances[Field.OUTPUT]

  const { wrapType, execute: onWrap, inputError: wrapInputError } = useWrapCallback(currencyIn, currencyOut, typedValue)

  const isSolanaUnwrap = isSolana && wrapType === WrapType.UNWRAP
  useEffect(() => {
    // reset value for unwrapping WSOL
    // because on Solana, unwrap WSOL is closing WSOL account,
    // which mean it will unwrap all WSOL at once and we can't unwrap partial amount of WSOL
    if (isSolanaUnwrap) onUserInput(Field.INPUT, balanceIn?.toExact() ?? '')
  }, [balanceIn, isSolanaUnwrap, onUserInput, parsedAmount])

  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE
  const trade = showWrap ? undefined : v2Trade

  const priceImpact = trade?.priceImpact
  const {
    isInvalid: isPriceImpactInvalid,
    isHigh: isPriceImpactHigh,
    isVeryHigh: isPriceImpactVeryHigh,
  } = checkPriceImpact(priceImpact)

  const parsedAmounts = showWrap
    ? {
        [Field.INPUT]: parsedAmount,
        [Field.OUTPUT]: parsedAmount,
      }
    : {
        [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
        [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount,
      }

  const { mixpanelHandler } = useMixpanel(currencies)

  // reset recipient
  useEffect(() => {
    onChangeRecipient(null)
  }, [onChangeRecipient, isDegenMode])

  useEffect(() => {
    // Save current trade to store
    onChangeTrade(trade)
  }, [trade, onChangeTrade])

  const handleRecipientChange = (value: string | null) => {
    if (recipient === null && value !== null) {
      mixpanelHandler(MIXPANEL_TYPE.ADD_RECIPIENT_CLICKED)
    }
    onChangeRecipient(value)
  }

  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
    },
    [onUserInput],
  )

  // reset if they close warning without tokens in params
  const handleDismissTokenWarning = useCallback(() => {
    setDismissTokenWarning(true)
  }, [])

  const handleConfirmTokenWarning = useCallback(() => {
    handleDismissTokenWarning()
  }, [handleDismissTokenWarning])

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: showWrap
      ? parsedAmounts[independentField]?.toExact() ?? ''
      : parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  }

  const userHasSpecifiedInputOutput = Boolean(
    currencyIn && currencyOut && parsedAmounts[independentField]?.greaterThan(JSBI.BigInt(0)),
  )
  const noRoute = !trade?.swaps?.length

  // check whether the user has approved the router on the input token
  const [approval, approveCallback] = useApproveCallbackFromTradeV2(trade, allowedSlippage) //

  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  const handleRotateClick = useCallback(() => {
    setApprovalSubmitted(false) // reset 2 step UI for approvals
    setRotate(prev => !prev)
    onSwitchTokensV2()
    setIsSelectCurrencyManually(true)
  }, [onSwitchTokensV2])

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    if (approval === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
    if (approval === ApprovalState.NOT_APPROVED) {
      setApprovalSubmitted(false)
    }
  }, [approval, approvalSubmitted])

  const maxAmountInput: string | undefined = useMemo(() => maxAmountSpend(balanceIn)?.toExact(), [balanceIn])
  const halfAmountInput: string | undefined = useMemo(() => halfAmountSpend(balanceIn)?.toExact(), [balanceIn])

  // the callback to execute the swap
  const { callback: swapCallback, error: swapCallbackError } = useSwapV2Callback(trade)

  const handleSwap = useCallback(() => {
    if (!swapCallback) {
      return
    }
    mixpanelHandler(MIXPANEL_TYPE.SWAP_CONFIRMED, {
      gasUsd: trade?.gasUsd,
      inputAmount: trade?.inputAmount,
      priceImpact: trade?.priceImpact,
    })
    setSwapState({ attemptingTxn: true, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: undefined })
    swapCallback()
      .then(hash => {
        setSwapState({ attemptingTxn: false, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: hash })
      })
      .catch(error => {
        if (error?.code !== 4001 && error?.code !== 'ACTION_REJECTED') captureSwapError(error)
        setSwapState({
          attemptingTxn: false,
          tradeToConfirm,
          showConfirm,
          swapErrorMessage: error.message,
          txHash: undefined,
        })
      })
  }, [
    swapCallback,
    tradeToConfirm,
    showConfirm,
    mixpanelHandler,
    trade?.gasUsd,
    trade?.inputAmount,
    trade?.priceImpact,
  ])

  // show approve flow when: no error on inputs, not approved or pending, or approved in current session
  // never show if price impact is above threshold in non degen mode
  const showApproveFlow =
    !swapInputError &&
    (approval === ApprovalState.NOT_APPROVED ||
      approval === ApprovalState.PENDING ||
      (approvalSubmitted && approval === ApprovalState.APPROVED))

  const tradeLoadedRef = useRef(0)
  useEffect(() => {
    tradeLoadedRef.current = Date.now()
  }, [trade])

  const handleConfirmDismiss = useCallback(() => {
    setSwapState({ showConfirm: false, tradeToConfirm, attemptingTxn, swapErrorMessage, txHash })

    // when open modal, trade is locked from to be updated
    // if user open modal too long, trade is outdated
    // need to refresh data on close modal
    if (Date.now() - tradeLoadedRef.current > TIME_TO_REFRESH_SWAP_RATE * 1000) {
      onRefresh(false, AGGREGATOR_WAITING_TIME)
    }

    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.INPUT, '')
    }
  }, [attemptingTxn, onUserInput, swapErrorMessage, tradeToConfirm, txHash, onRefresh])

  const handleInputSelect = useCallback(
    (inputCurrency: Currency) => {
      setIsSelectCurrencyManually(true)
      setApprovalSubmitted(false) // reset 2 step UI for approvals
      onCurrencySelection(Field.INPUT, inputCurrency)
    },
    [onCurrencySelection],
  )

  const handleMaxInput = useCallback(() => {
    onUserInput(Field.INPUT, maxAmountInput || '')
  }, [maxAmountInput, onUserInput])

  const handleHalfInput = useCallback(() => {
    !isSolanaUnwrap && onUserInput(Field.INPUT, halfAmountInput || '')
  }, [isSolanaUnwrap, halfAmountInput, onUserInput])

  const handleOutputSelect = useCallback(
    (outputCurrency: Currency) => {
      setIsSelectCurrencyManually(true)
      onCurrencySelection(Field.OUTPUT, outputCurrency)
    },
    [onCurrencySelection],
  )

  const isLoading = loadingAPI || ((!balanceIn || !balanceOut) && userHasSpecifiedInputOutput && !v2Trade)

  const mixpanelSwapInit = () => {
    mixpanelHandler(MIXPANEL_TYPE.SWAP_INITIATED, {
      gasUsd: trade?.gasUsd,
      inputAmount: trade?.inputAmount,
      priceImpact: trade?.priceImpact,
    })
  }

  const onSelectSuggestedPair = useCallback(
    (fromToken: Currency | undefined, toToken: Currency | undefined, amount?: string) => {
      if (fromToken) onCurrencySelection(Field.INPUT, fromToken)
      if (toToken) onCurrencySelection(Field.OUTPUT, toToken)
      if (amount) handleTypeInput(amount)
    },
    [handleTypeInput, onCurrencySelection],
  )

  useResetCurrenciesOnRemoveImportedTokens(currencyIn, currencyOut, onResetSelectCurrency)

  useSyncTokenSymbolToUrl(currencyIn, currencyOut, onSelectSuggestedPair, isSelectCurrencyManually)
  const isLoadedTokenDefault = useIsLoadedTokenDefault()
  const { isStableCoin } = useStableCoins(chainId)

  const [rawSlippage] = useUserSlippageTolerance()

  const isStableCoinSwap = isStableCoin(INPUT?.currencyId) && isStableCoin(OUTPUT?.currencyId)

  useUpdateSlippageInStableCoinSwap()

  const { isInWhiteList: isPairInWhiteList, canonicalUrl } = checkPairInWhiteList(
    chainId,
    getSymbolSlug(currencyIn),
    getSymbolSlug(currencyOut),
  )

  const onBackToSwapTab = () => setActiveTab(TAB.SWAP)

  const shouldRenderTokenInfo = isShowTokenInfoSetting && currencyIn && currencyOut && isPairInWhiteList && isSwapPage

  const isShowModalImportToken = isLoadedTokenDefault && importTokensNotInDefault.length > 0 && !dismissTokenWarning

  const tradeRouteComposition = useMemo(() => {
    return getTradeComposition(chainId, trade?.inputAmount, trade?.tokens, trade?.swaps, defaultTokens)
  }, [chainId, defaultTokens, trade])

  return (
    <>
      <SEOSwap canonicalUrl={canonicalUrl} />
      <TutorialSwap />
      <TokenWarningModal
        isOpen={isShowModalImportToken}
        tokens={importTokensNotInDefault}
        onConfirm={handleConfirmTokenWarning}
      />
      <PageWrapper>
        <Banner />
        <Container>
          <SwapFormWrapper isShowTutorial={isShowTutorial}>
            <Header activeTab={activeTab} setActiveTab={setActiveTab} />

            <AppBodyWrapped data-highlight={shouldHighlightSwapBox} id={TutorialIds.SWAP_FORM}>
              {activeTab === TAB.SWAP && (
                <>
                  <Wrapper
                    id={TutorialIds.SWAP_FORM_CONTENT}
                    style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                  >
                    <ConfirmSwapModal
                      isOpen={showConfirm}
                      trade={trade}
                      originalTrade={tradeToConfirm}
                      attemptingTxn={attemptingTxn}
                      txHash={txHash}
                      allowedSlippage={allowedSlippage}
                      onConfirm={handleSwap}
                      swapErrorMessage={swapErrorMessage}
                      onDismiss={handleConfirmDismiss}
                      tokenAddToMetaMask={currencyOut}
                    />

                    <Flex flexDirection="column" sx={{ gap: '0.75rem' }}>
                      <CurrencyInputPanel
                        value={formattedAmounts[Field.INPUT]}
                        positionMax="top"
                        currency={currencyIn}
                        onUserInput={handleTypeInput}
                        onMax={handleMaxInput}
                        onHalf={isSolanaUnwrap ? null : handleHalfInput}
                        onCurrencySelect={handleInputSelect}
                        otherCurrency={currencyOut}
                        id="swap-currency-input"
                        showCommonBases={true}
                        estimatedUsd={
                          trade?.amountInUsd ? `${formattedNum(trade.amountInUsd.toString(), true)}` : undefined
                        }
                      />
                      <AutoRow justify="space-between">
                        <Flex alignItems="center">
                          {!showWrap && (
                            <>
                              <RefreshButton isConfirming={showConfirm} trade={trade} onRefresh={onRefresh} />
                              <TradePrice price={trade?.executionPrice} />
                            </>
                          )}
                        </Flex>

                        <ArrowRotate rotate={rotate} onClick={handleRotateClick} />
                      </AutoRow>
                      <Box sx={{ position: 'relative' }}>
                        <CurrencyInputPanel
                          disabledInput
                          value={formattedAmounts[Field.OUTPUT]}
                          onMax={null}
                          onHalf={null}
                          currency={currencyOut}
                          onCurrencySelect={handleOutputSelect}
                          otherCurrency={currencyIn}
                          id="swap-currency-output"
                          showCommonBases={true}
                          estimatedUsd={
                            trade?.amountOutUsd ? `${formattedNum(trade.amountOutUsd.toString(), true)}` : undefined
                          }
                          label={
                            isEVM ? (
                              <Label>
                                <MouseoverTooltip
                                  placement="right"
                                  width="200px"
                                  text={
                                    <Text fontSize={12}>
                                      <Trans>
                                        This is the estimated output amount. Do review the actual output amount in the
                                        confirmation screen.
                                      </Trans>
                                    </Text>
                                  }
                                >
                                  <Trans>Est. Output</Trans>
                                </MouseoverTooltip>
                              </Label>
                            ) : (
                              ''
                            )
                          }
                          positionLabel="in"
                        />
                      </Box>

                      {isDegenMode && isEVM && !showWrap && (
                        <AddressInputPanel id="recipient" value={recipient} onChange={handleRecipientChange} />
                      )}

                      <SlippageSettingGroup isWrapOrUnwrap={showWrap} isStablePairSwap={isStableCoinSwap} />
                    </Flex>

                    <TradeTypeSelection />

                    {!showWrap && <SlippageWarningNote rawSlippage={rawSlippage} isStablePairSwap={isStableCoinSwap} />}

                    <PriceImpactNote priceImpact={trade?.priceImpact} isDegenMode={isDegenMode} />

                    <ApproveMessage
                      routerAddress={trade?.routerAddress}
                      isCurrencyInNative={Boolean(currencyIn?.isNative)}
                    />

                    <BottomGrouping>
                      {!account ? (
                        <ButtonLight onClick={toggleWalletModal}>
                          <Trans>Connect Wallet</Trans>
                        </ButtonLight>
                      ) : showWrap ? (
                        <ButtonPrimary disabled={Boolean(wrapInputError)} onClick={onWrap}>
                          {wrapInputError ??
                            (wrapType === WrapType.WRAP ? (
                              <Trans>Wrap</Trans>
                            ) : wrapType === WrapType.UNWRAP ? (
                              <Trans>Unwrap</Trans>
                            ) : null)}
                        </ButtonPrimary>
                      ) : noRoute && userHasSpecifiedInputOutput ? (
                        <ButtonPrimary disabled={true} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MouseoverTooltip
                            text={
                              <Trans>
                                There was an issue while trying to find a price for these tokens. Please try again.
                                Otherwise, you may select some other tokens to swap
                              </Trans>
                            }
                          >
                            <Info size={14} />
                          </MouseoverTooltip>
                          <Text>
                            <Trans>Swap Disabled</Trans>
                          </Text>
                        </ButtonPrimary>
                      ) : showApproveFlow ? (
                        <>
                          <RowBetween gap="16px">
                            <ButtonConfirmed
                              onClick={approveCallback}
                              disabled={approval !== ApprovalState.NOT_APPROVED || approvalSubmitted}
                              altDisabledStyle={approval === ApprovalState.PENDING} // show solid button while waiting
                              confirmed={approval === ApprovalState.APPROVED}
                              style={{ flex: 1 }}
                            >
                              {approval === ApprovalState.PENDING ? (
                                <Row gap="6px" justify="center">
                                  <Trans>Approving</Trans> <Loader stroke="white" />
                                </Row>
                              ) : approvalSubmitted && approval === ApprovalState.APPROVED ? (
                                <Trans>Approved</Trans>
                              ) : (
                                <Row justify="center" gap="6px">
                                  <InfoHelper
                                    color={theme.textReverse}
                                    text={t`You need to first allow KyberSwap's smart contract to use your ${currencyIn?.symbol}`}
                                    placement="top"
                                    size={14}
                                  />
                                  <Trans>Approve {currencyIn?.symbol}</Trans>
                                </Row>
                              )}
                            </ButtonConfirmed>
                            <ButtonError
                              onClick={() => {
                                // TODO check this button, it will never run, is it?
                                // console.error('This will never be run')
                                mixpanelSwapInit()
                                if (isDegenMode) {
                                  handleSwap()
                                } else {
                                  setSwapState({
                                    tradeToConfirm: trade,
                                    attemptingTxn: false,
                                    swapErrorMessage: undefined,
                                    showConfirm: true,
                                    txHash: undefined,
                                  })
                                }
                              }}
                              id="swap-button"
                              disabled={!!swapInputError || approval !== ApprovalState.APPROVED}
                              backgroundColor={
                                isPriceImpactVeryHigh || isPriceImpactInvalid
                                  ? theme.red
                                  : isPriceImpactHigh
                                  ? theme.warning
                                  : undefined
                              }
                              color={isPriceImpactHigh || isPriceImpactInvalid ? theme.white : undefined}
                              style={{ flex: 1 }}
                            >
                              <Text fontSize={16} fontWeight={500}>
                                {isPriceImpactVeryHigh ? <Trans>Swap Anyway</Trans> : <Trans>Swap</Trans>}
                              </Text>
                            </ButtonError>
                          </RowBetween>
                          <ProgressSteps steps={[approval === ApprovalState.APPROVED]} />
                        </>
                      ) : isLoading ? (
                        <GreyCard style={{ textAlign: 'center', borderRadius: '999px', padding: '12px' }}>
                          <Text color={theme.subText} fontSize="14px">
                            <Dots>
                              <Trans>Calculating best route</Trans>
                            </Dots>
                          </Text>
                        </GreyCard>
                      ) : (
                        <ButtonError
                          onClick={() => {
                            mixpanelSwapInit()
                            setSwapState({
                              tradeToConfirm: trade,
                              attemptingTxn: false,
                              swapErrorMessage: undefined,
                              showConfirm: true,
                              txHash: undefined,
                            })
                          }}
                          id="swap-button"
                          disabled={
                            !!swapInputError ||
                            !!swapCallbackError ||
                            approval !== ApprovalState.APPROVED ||
                            (!isDegenMode && (isPriceImpactVeryHigh || isPriceImpactInvalid)) ||
                            (isDegenMode && isSolana && !encodeSolana)
                          }
                          style={{
                            position: 'relative',
                            border: 'none',
                            ...(!(
                              !!swapInputError ||
                              !!swapCallbackError ||
                              approval !== ApprovalState.APPROVED ||
                              (!isDegenMode && (isPriceImpactVeryHigh || isPriceImpactInvalid)) ||
                              (isDegenMode && isSolana && !encodeSolana)
                            ) &&
                            (isPriceImpactVeryHigh || isPriceImpactInvalid)
                              ? {
                                  background: isPriceImpactVeryHigh || isPriceImpactInvalid ? theme.red : theme.warning,
                                  color: theme.textReverse,
                                }
                              : {}),
                          }}
                        >
                          <Text fontWeight={500}>
                            {swapInputError ? (
                              swapInputError
                            ) : approval !== ApprovalState.APPROVED ? (
                              <Dots>
                                <Trans>Checking allowance</Trans>
                              </Dots>
                            ) : isDegenMode && isSolana && !encodeSolana ? (
                              <Dots>
                                <Trans>Checking accounts</Trans>
                              </Dots>
                            ) : !isDegenMode && (isPriceImpactVeryHigh || isPriceImpactInvalid) ? (
                              <Flex alignItems="center" style={{ gap: '4px' }}>
                                <MouseoverTooltip
                                  text={
                                    isPriceImpactVeryHigh ? (
                                      <Trans>
                                        To ensure you dont lose funds due to very high price impact (≥10%), swap has
                                        been disabled for this trade. If you still wish to continue, you can turn on
                                        Degen Mode from Settings
                                      </Trans>
                                    ) : (
                                      <Trans>
                                        There was an issue while trying to find a price for these tokens. Please try
                                        again. Otherwise, you may select some other tokens to swap
                                      </Trans>
                                    )
                                  }
                                >
                                  <Info size={14} />
                                </MouseoverTooltip>
                                <Text>
                                  <Trans>Swap Disabled</Trans>
                                </Text>
                              </Flex>
                            ) : isDegenMode && (isPriceImpactVeryHigh || isPriceImpactInvalid) ? (
                              <Trans>Swap Anyway</Trans>
                            ) : (
                              <Trans>Swap</Trans>
                            )}
                          </Text>

                          {holidayMode && !swapInputError && (
                            <ChristmasDecor>
                              <img src={christmasImg} width="100%" alt="" />
                            </ChristmasDecor>
                          )}
                        </ButtonError>
                      )}

                      {isDegenMode && swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
                    </BottomGrouping>
                  </Wrapper>
                </>
              )}
              {activeTab === TAB.INFO && <TokenInfoTab currencies={currencies} onBack={onBackToSwapTab} />}
              {activeTab === TAB.SETTINGS && (
                <SettingsPanel
                  isSwapPage
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
              {isSwapPage && <AdvancedSwapDetailsDropdown trade={trade} />}
            </AppBodyWrapped>
          </SwapFormWrapper>

          <InfoComponents>
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
                  <LiveChart currencies={currencies} />
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
                      tradeComposition={tradeRouteComposition}
                      currencyIn={currencyIn}
                      currencyOut={currencyOut}
                      inputAmount={trade?.inputAmount}
                      outputAmount={trade?.outputAmount}
                    />
                  </Suspense>
                </Flex>
              </RoutesWrapper>
            )}
            {shouldRenderTokenInfo && <TokenInfoV2 currencyIn={currencyIn} currencyOut={currencyOut} />}
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
