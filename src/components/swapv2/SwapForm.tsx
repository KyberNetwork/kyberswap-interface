import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import JSBI from 'jsbi'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle } from 'react-feather'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'

import christmasImg from 'assets/images/christmas-decor2.svg'
import AddressInputPanel from 'components/AddressInputPanel'
import ArrowRotate from 'components/ArrowRotate'
import { ButtonConfirmed, ButtonError, ButtonLight, ButtonPrimary } from 'components/Button'
import { GreyCard } from 'components/Card/index'
import Column from 'components/Column/index'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import InfoHelper from 'components/InfoHelper'
import Loader from 'components/Loader'
import ProgressSteps from 'components/ProgressSteps'
import { AutoRow, RowBetween } from 'components/Row'
import TrendingSoonTokenBanner from 'components/TrendingSoonTokenBanner'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import ConfirmSwapModal from 'components/swapv2/ConfirmSwapModal'
import RefreshButton from 'components/swapv2/RefreshButton'
import TradePrice from 'components/swapv2/TradePrice'
import TradeTypeSelection from 'components/swapv2/TradeTypeSelection'
import { BottomGrouping, Dots, KyberTag, PriceImpactHigh, SwapCallbackError, Wrapper } from 'components/swapv2/styleds'
import { AGGREGATOR_WAITING_TIME, TIME_TO_REFRESH_SWAP_RATE } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { ApprovalState, useApproveCallbackFromTradeV2 } from 'hooks/useApproveCallback'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { useSwapV2Callback } from 'hooks/useSwapV2Callback'
import useSyncTokenSymbolToUrl from 'hooks/useSyncTokenSymbolToUrl'
import useTheme from 'hooks/useTheme'
import useWrapCallback, { WrapType } from 'hooks/useWrapCallback'
import { ClickableText } from 'pages/Pool/styleds'
import { useToggleTransactionSettingsMenu, useWalletModalToggle } from 'state/application/hooks'
import { useAllDexes } from 'state/customizeDexes/hooks'
import { Field } from 'state/swap/actions'
import { useEncodeSolana, useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import { useDerivedSwapInfoV2 } from 'state/swap/useAggregator'
import { useExpertModeManager, useHolidayMode, useUserSlippageTolerance } from 'state/user/hooks'
import { TYPE } from 'theme'
import { formattedNum } from 'utils'
import { Aggregator } from 'utils/aggregator'
import { halfAmountSpend, maxAmountSpend } from 'utils/maxAmountSpend'

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

const SwapForm = () => {
  const { account, chainId, isSolana, isEVM } = useActiveWeb3React()
  const [rotate, setRotate] = useState(false)
  const [holidayMode] = useHolidayMode()
  const allDexes = useAllDexes()
  const [encodeSolana] = useEncodeSolana()

  const [isSelectCurrencyManually, setIsSelectCurrencyManually] = useState(false) // true when: select token input, output manually or click rotate token.

  const theme = useTheme()

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

  // for expert mode
  const toggleSettings = useToggleTransactionSettingsMenu()
  const [isExpertMode] = useExpertModeManager()

  // get custom setting values for user
  const [allowedSlippage] = useUserSlippageTolerance()

  // swap state
  const { independentField, typedValue, recipient } = useSwapState()

  const { onSwitchTokensV2, onCurrencySelection, onUserInput, onChangeRecipient, onChangeTrade } =
    useSwapActionHandlers()

  const {
    v2Trade,
    currencyBalances,
    parsedAmount,
    currencies,
    inputError: swapInputError,
    tradeComparer,
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

  const comparedDex = useMemo(
    () => allDexes?.find(dex => dex.id === tradeComparer?.comparedDex),
    [allDexes, tradeComparer],
  )
  const currencyIn: Currency | undefined = currencies[Field.INPUT]
  const currencyOut: Currency | undefined = currencies[Field.OUTPUT]

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
  const isPriceImpactInvalid = !!trade?.priceImpact && trade?.priceImpact === -1
  const isPriceImpactHigh = !!trade?.priceImpact && trade?.priceImpact > 5
  const isPriceImpactVeryHigh = !!trade?.priceImpact && trade?.priceImpact > 15

  const parsedAmounts = showWrap
    ? {
        [Field.INPUT]: parsedAmount,
        [Field.OUTPUT]: parsedAmount,
      }
    : {
        [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
        [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount,
      }

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
  const handleTypeOutput = useCallback((): void => {
    // ...
  }, [])

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
  const [approval, approveCallback] = useApproveCallbackFromTradeV2(trade, allowedSlippage)

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
    setSwapState({ attemptingTxn: true, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: undefined })
    swapCallback()
      .then(hash => {
        setSwapState({ attemptingTxn: false, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: hash })
      })
      .catch(error => {
        setSwapState({
          attemptingTxn: false,
          tradeToConfirm,
          showConfirm,
          swapErrorMessage: error.message,
          txHash: undefined,
        })
      })
  }, [swapCallback, tradeToConfirm, showConfirm])

  // show approve flow when: no error on inputs, not approved or pending, or approved in current session
  // never show if price impact is above threshold in non expert mode
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

  const handleAcceptChanges = useCallback(() => {
    setSwapState({ tradeToConfirm: trade, swapErrorMessage, txHash, attemptingTxn, showConfirm })
  }, [attemptingTxn, setSwapState, showConfirm, swapErrorMessage, trade, txHash])

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

  const onSelectSuggestedPair = useCallback(
    (fromToken: Currency | undefined, toToken: Currency | undefined, amount?: string) => {
      if (fromToken) onCurrencySelection(Field.INPUT, fromToken)
      if (toToken) onCurrencySelection(Field.OUTPUT, toToken)
      if (amount) handleTypeInput(amount)
    },
    [handleTypeInput, onCurrencySelection],
  )

  const isLoading = loadingAPI || ((!balanceIn || !balanceOut) && userHasSpecifiedInputOutput && !v2Trade)

  const { mixpanelHandler } = useMixpanel(trade, currencies)
  const mixpanelSwapInit = () => {
    mixpanelHandler(MIXPANEL_TYPE.SWAP_INITIATED)
  }

  const isLargeSwap = useMemo((): boolean => {
    return false // todo: not used for current release yet
    // if these line is 6 months old, feel free to delete it
    /*
    if (!isSolana) return false
    if (!trade) return false
    try {
      return trade.swaps.some(swapPath =>
        swapPath.some(swap => {
          // return swapAmountInUsd / swap.reserveUsd > 1%
          //  =  (swap.swapAmount / 10**decimal * tokenIn.price) / swap.reserveUsd > 1%
          //  = swap.swapAmount * tokenIn.price / (10**decimal * swap.reserveUsd) > 1%
          //  = 10**decimal * swap.reserveUsd / (swap.swapAmount * tokenIn.price) < 100
          const tokenIn = trade.tokens[swap.tokenIn]
          if (!tokenIn || !tokenIn.decimals) return false

          return JSBI.lessThan(
            JSBI.divide(
              JSBI.multiply(
                JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(tokenIn.decimals + 20)),
                JSBI.BigInt(swap.reserveUsd * 10 ** 20),
              ),
              JSBI.multiply(JSBI.BigInt(tokenIn.price * 10 ** 20), JSBI.BigInt(Number(swap.swapAmount) * 10 ** 20)),
            ),
            JSBI.BigInt(100),
          )
        }),
      )
    } catch (e) {
      return false
    }
  }, [isSolana, trade])
  */
  }, [])

  useSyncTokenSymbolToUrl(currencyIn, currencyOut, onSelectSuggestedPair, isSelectCurrencyManually)

  return (
    <Wrapper id={TutorialIds.SWAP_FORM_CONTENT}>
      <ConfirmSwapModal
        isOpen={showConfirm}
        trade={trade}
        originalTrade={tradeToConfirm}
        onAcceptChanges={handleAcceptChanges}
        attemptingTxn={attemptingTxn}
        txHash={txHash}
        recipient={recipient}
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
          estimatedUsd={trade?.amountInUsd ? `${formattedNum(trade.amountInUsd.toString(), true)}` : undefined}
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
          {tradeComparer?.tradeSaved?.usd && comparedDex && (
            <KyberTag>
              <Trans>You save</Trans>{' '}
              {formattedNum(tradeComparer.tradeSaved.usd, true) +
                ` (${
                  tradeComparer?.tradeSaved?.percent &&
                  (tradeComparer.tradeSaved.percent < 0.01 ? '<0.01' : tradeComparer.tradeSaved.percent.toFixed(2))
                }%)`}
              <InfoHelper
                text={
                  <Text>
                    <Trans>
                      The amount you save compared to{' '}
                      <Text as="span" color={theme.warning}>
                        {comparedDex.name}
                      </Text>
                      .
                    </Trans>{' '}
                    <Trans>
                      <Text color={theme.primary} fontWeight={500} as="span">
                        KyberSwap
                      </Text>{' '}
                      gets you the best token rates
                    </Trans>
                  </Text>
                }
                size={14}
                color={theme.apr}
              />
            </KyberTag>
          )}

          <CurrencyInputPanel
            disabledInput
            value={formattedAmounts[Field.OUTPUT]}
            onUserInput={handleTypeOutput}
            onMax={null}
            onHalf={null}
            currency={currencyOut}
            onCurrencySelect={handleOutputSelect}
            otherCurrency={currencyIn}
            id="swap-currency-output"
            showCommonBases={true}
            estimatedUsd={trade?.amountOutUsd ? `${formattedNum(trade.amountOutUsd.toString(), true)}` : undefined}
          />
        </Box>

        {isExpertMode && isEVM && !showWrap && (
          <AddressInputPanel id="recipient" value={recipient} onChange={handleRecipientChange} />
        )}

        {!showWrap && (
          <Flex alignItems="center" fontSize={12} color={theme.subText} onClick={toggleSettings} width="fit-content">
            <ClickableText color={theme.subText} fontWeight={500}>
              <Trans>Max Slippage:</Trans>&nbsp;
              {allowedSlippage / 100}%
            </ClickableText>
          </Flex>
        )}
      </Flex>

      <TradeTypeSelection />

      {chainId !== ChainId.ETHW && (
        <TrendingSoonTokenBanner currencyIn={currencyIn} currencyOut={currencyOut} style={{ marginTop: '24px' }} />
      )}

      {isPriceImpactInvalid ? (
        <PriceImpactHigh>
          <AlertTriangle color={theme.warning} size={16} style={{ marginRight: '10px' }} />
          <Trans>Unable to calculate Price Impact</Trans>
          <InfoHelper text={t`Turn on Advanced Mode to trade`} color={theme.text} />
        </PriceImpactHigh>
      ) : (
        isPriceImpactHigh && (
          <PriceImpactHigh veryHigh={isPriceImpactVeryHigh}>
            <AlertTriangle
              color={isPriceImpactVeryHigh ? theme.red : theme.warning}
              size={16}
              style={{ marginRight: '10px' }}
            />
            {isPriceImpactVeryHigh ? <Trans>Price Impact is Very High</Trans> : <Trans>Price Impact is High</Trans>}
            <InfoHelper
              text={
                isExpertMode
                  ? t`You have turned on Advanced Mode from settings. Trades with high price impact can be executed`
                  : t`Turn on Advanced Mode from settings to execute trades with high price impact`
              }
              color={theme.text}
            />
          </PriceImpactHigh>
        )
      )}
      {isLargeSwap && (
        <PriceImpactHigh>
          <AlertTriangle color={theme.warning} size={24} style={{ marginRight: '10px' }} />
          <Trans>Your transaction may not be successful. We recommend increasing the slippage for this trade</Trans>
        </PriceImpactHigh>
      )}
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
          <GreyCard style={{ textAlign: 'center', borderRadius: '999px', padding: '12px' }}>
            <TYPE.main>
              <Trans>Insufficient liquidity for this trade.</Trans>
            </TYPE.main>
          </GreyCard>
        ) : showApproveFlow ? (
          <>
            <RowBetween>
              <ButtonConfirmed
                onClick={approveCallback}
                disabled={approval !== ApprovalState.NOT_APPROVED || approvalSubmitted}
                width="48%"
                altDisabledStyle={approval === ApprovalState.PENDING} // show solid button while waiting
                confirmed={approval === ApprovalState.APPROVED}
              >
                {approval === ApprovalState.PENDING ? (
                  <AutoRow gap="6px" justify="center">
                    <Trans>Approving</Trans> <Loader stroke="white" />
                  </AutoRow>
                ) : approvalSubmitted && approval === ApprovalState.APPROVED ? (
                  <Trans>Approved</Trans>
                ) : (
                  <Trans>Approve ${currencyIn?.symbol}</Trans>
                )}
              </ButtonConfirmed>
              <ButtonError
                onClick={() => {
                  // TODO check this button, it will never run, is it?
                  // console.error('This will never be run')
                  mixpanelSwapInit()
                  if (isExpertMode) {
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
                width="48%"
                id="swap-button"
                disabled={!!swapInputError || approval !== ApprovalState.APPROVED}
                backgroundColor={
                  isPriceImpactHigh || isPriceImpactInvalid
                    ? isPriceImpactVeryHigh
                      ? theme.red
                      : theme.warning
                    : undefined
                }
                color={isPriceImpactHigh || isPriceImpactInvalid ? theme.white : undefined}
              >
                <Text fontSize={16} fontWeight={500}>
                  {isPriceImpactHigh ? <Trans>Swap Anyway</Trans> : <Trans>Swap</Trans>}
                </Text>
              </ButtonError>
            </RowBetween>
            <Column style={{ marginTop: '1rem' }}>
              <ProgressSteps steps={[approval === ApprovalState.APPROVED]} />
            </Column>
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
              if (isExpertMode) {
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
            disabled={
              !!swapInputError ||
              !!swapCallbackError ||
              approval !== ApprovalState.APPROVED ||
              (!isExpertMode && (isPriceImpactVeryHigh || isPriceImpactInvalid)) ||
              (isExpertMode && isSolana && !encodeSolana)
            }
            style={{
              position: 'relative',
              border: 'none',
              ...(!(
                !!swapInputError ||
                !!swapCallbackError ||
                approval !== ApprovalState.APPROVED ||
                (!isExpertMode && (isPriceImpactVeryHigh || isPriceImpactInvalid)) ||
                (isExpertMode && isSolana && !encodeSolana)
              ) &&
              (isPriceImpactHigh || isPriceImpactInvalid)
                ? { background: isPriceImpactVeryHigh ? theme.red : theme.warning, color: theme.white }
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
              ) : isExpertMode && isSolana && !encodeSolana ? (
                <Dots>
                  <Trans>Checking accounts</Trans>
                </Dots>
              ) : isPriceImpactHigh || isPriceImpactInvalid ? (
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

        {isExpertMode && swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
      </BottomGrouping>
    </Wrapper>
  )
}

export default SwapForm
