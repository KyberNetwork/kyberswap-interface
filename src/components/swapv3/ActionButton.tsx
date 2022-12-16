import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import JSBI from 'jsbi'
import { useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Flex } from 'rebass'
import styled from 'styled-components'

import { ButtonConfirmed, ButtonLight, ButtonPrimary } from 'components/Button'
import Column from 'components/Column/index'
import Loader from 'components/Loader'
import ProgressSteps from 'components/ProgressSteps'
import { AutoRow, RowBetween } from 'components/Row'
import ConfirmSwapModal from 'components/swapv2/ConfirmSwapModal'
import { Dots, SwapCallbackError } from 'components/swapv2/styleds'
import { AGGREGATOR_WAITING_TIME, TIME_TO_REFRESH_SWAP_RATE } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { ApprovalState, useApproveCallbackFromTradeV2 } from 'hooks/useApproveCallback'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { useSwapV2Callback } from 'hooks/useSwapV2Callback'
import useTheme from 'hooks/useTheme'
import useWrapCallback, { WrapType } from 'hooks/useWrapCallback'
import { useWalletModalToggle } from 'state/application/hooks'
import { Field, setConfirming } from 'state/swap/actions'
import { useEncodeSolana, useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import { useDerivedSwapInfoV2 } from 'state/swap/useAggregator'
import { useExpertModeManager, useUserSlippageTolerance } from 'state/user/hooks'
import { Aggregator } from 'utils/aggregator'

import { isHighPriceImpact, isInvalidPriceImpact } from './utils'

const CustomPrimaryButton = styled(ButtonPrimary).attrs({
  id: 'swap-button',
})`
  border: none;
  font-weight: 500;

  &:disabled {
    border: none;
  }
`
type Props = {
  derivedSwapInfoV2: ReturnType<typeof useDerivedSwapInfoV2>
}
const ActionButton: React.FC<Props> = ({ derivedSwapInfoV2 }) => {
  const { account, isSolana } = useActiveWeb3React()
  const [encodeSolana] = useEncodeSolana()
  const theme = useTheme()
  const dispatch = useDispatch()

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()
  const [isExpertMode] = useExpertModeManager()
  const [allowedSlippage] = useUserSlippageTolerance()
  const {
    independentField,
    typedValue,
    recipient,
    isConfirming,
    [Field.INPUT]: { currencyId: inputCurrencyId },
  } = useSwapState()
  const { onUserInput } = useSwapActionHandlers()

  const {
    onRefresh,
    v2Trade,
    currencyBalances,
    parsedAmount,
    currencies,
    inputError: swapInputError,
    loading: loadingAPI,
  } = derivedSwapInfoV2

  // modal and loading
  const [{ tradeToConfirm, swapErrorMessage, attemptingTxn, txHash }, setSwapState] = useState<{
    tradeToConfirm: Aggregator | undefined
    attemptingTxn: boolean
    swapErrorMessage: string | undefined
    txHash: string | undefined
  }>({
    tradeToConfirm: undefined,
    attemptingTxn: false,
    swapErrorMessage: undefined,
    txHash: undefined,
  })

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

  const userHasSpecifiedInputOutput = Boolean(
    currencyIn && currencyOut && parsedAmounts[independentField]?.greaterThan(JSBI.BigInt(0)),
  )
  const noRoute = !trade?.swaps?.length

  // check whether the user has approved the router on the input token
  const [approval, approveCallback] = useApproveCallbackFromTradeV2(trade, allowedSlippage)

  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    if (approval === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
    if (approval === ApprovalState.NOT_APPROVED) {
      setApprovalSubmitted(false)
    }
  }, [approval, approvalSubmitted])

  useEffect(() => {
    // reset approval submitted when input token changes
    setApprovalSubmitted(false)
  }, [inputCurrencyId])

  // the callback to execute the swap
  const { callback: swapCallback, error: swapCallbackError } = useSwapV2Callback(trade)

  const handleSwap = () => {
    if (!swapCallback) {
      return
    }
    setSwapState({ attemptingTxn: true, tradeToConfirm, swapErrorMessage: undefined, txHash: undefined })
    swapCallback()
      .then(hash => {
        setSwapState({ attemptingTxn: false, tradeToConfirm, swapErrorMessage: undefined, txHash: hash })
      })
      .catch(error => {
        setSwapState({
          attemptingTxn: false,
          tradeToConfirm,
          swapErrorMessage: error.message,
          txHash: undefined,
        })
      })
  }

  const handleAcceptChanges = () => {
    setSwapState({ tradeToConfirm: trade, swapErrorMessage, txHash, attemptingTxn })
  }

  // show approve flow when: no error on inputs, not approved or pending, or approved in current session
  // never show if price impact is above threshold in non expert mode
  const showApproveFlow =
    !swapInputError &&
    (approval === ApprovalState.NOT_APPROVED ||
      approval === ApprovalState.PENDING ||
      (approvalSubmitted && approval === ApprovalState.APPROVED))

  const isLoading = loadingAPI || ((!balanceIn || !balanceOut) && userHasSpecifiedInputOutput && !v2Trade)

  const { mixpanelHandler } = useMixpanel(trade, currencies)
  const mixpanelSwapInit = () => {
    mixpanelHandler(MIXPANEL_TYPE.SWAP_INITIATED)
  }

  const tradeLoadedRef = useRef(0)
  useEffect(() => {
    tradeLoadedRef.current = Date.now()
  }, [trade])

  const handleConfirmDismiss = () => {
    dispatch(setConfirming(false))

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
  }

  const handleClickSwapButton = () => {
    mixpanelSwapInit()
    if (isExpertMode) {
      handleSwap()
    } else {
      dispatch(setConfirming(true))
      setSwapState({
        tradeToConfirm: trade,
        attemptingTxn: false,
        swapErrorMessage: undefined,
        txHash: undefined,
      })
    }
  }

  const renderButton = () => {
    if (!account) {
      return (
        <ButtonLight onClick={toggleWalletModal}>
          <Trans>Connect Wallet</Trans>
        </ButtonLight>
      )
    }

    if (showWrap) {
      return (
        <CustomPrimaryButton disabled={!!wrapInputError} onClick={onWrap}>
          {wrapInputError || (wrapType === WrapType.WRAP ? <Trans>Wrap</Trans> : <Trans>Unwrap</Trans>)}
        </CustomPrimaryButton>
      )
    }

    if (userHasSpecifiedInputOutput && noRoute) {
      return (
        <CustomPrimaryButton disabled>
          <Trans>Insufficient liquidity for this trade</Trans>
        </CustomPrimaryButton>
      )
    }

    if (showApproveFlow) {
      return (
        <>
          <RowBetween>
            <ButtonConfirmed
              onClick={approveCallback}
              disabled={approval !== ApprovalState.NOT_APPROVED || approvalSubmitted}
              width="48%"
              altDisabledStyle={approval === ApprovalState.PENDING} // show solid button while waiting
              confirmed={approval === ApprovalState.APPROVED}
              style={{
                border: 'none',
              }}
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
            {/* TODO: create a common component for this small button (inside Approve flow) and the regular Swap button */}
            <CustomPrimaryButton
              onClick={() => {
                // TODO check this button, it will never run, is it?
                // console.error('This will never be run')
                mixpanelSwapInit()
                if (isExpertMode) {
                  handleSwap()
                } else {
                  dispatch(setConfirming(true))
                  setSwapState({
                    tradeToConfirm: trade,
                    attemptingTxn: false,
                    swapErrorMessage: undefined,
                    txHash: undefined,
                  })
                }
              }}
              width="48%"
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
              {isPriceImpactHigh ? <Trans>Swap Anyway</Trans> : <Trans>Swap</Trans>}
            </CustomPrimaryButton>
          </RowBetween>
          <Column style={{ marginTop: '1rem' }}>
            <ProgressSteps steps={[approval === ApprovalState.APPROVED]} />
          </Column>
        </>
      )
    }

    if (isLoading) {
      return (
        <CustomPrimaryButton disabled>
          <Dots>
            <Trans>Calculating best route</Trans>
          </Dots>
        </CustomPrimaryButton>
      )
    }

    if (swapInputError) {
      return <CustomPrimaryButton disabled>{swapInputError}</CustomPrimaryButton>
    }

    if (approval !== ApprovalState.APPROVED) {
      return (
        <CustomPrimaryButton disabled>
          <Dots>
            <Trans>Checking allowance</Trans>
          </Dots>
        </CustomPrimaryButton>
      )
    }

    if (isExpertMode && isSolana && !encodeSolana) {
      return (
        <CustomPrimaryButton disabled>
          <Dots>
            <Trans>Checking accounts</Trans>
          </Dots>
        </CustomPrimaryButton>
      )
    }

    if (isInvalidPriceImpact(trade?.priceImpact) || isHighPriceImpact(trade?.priceImpact)) {
      return (
        <CustomPrimaryButton
          onClick={handleClickSwapButton}
          disabled={!isExpertMode}
          style={
            isExpertMode
              ? { background: isPriceImpactVeryHigh ? theme.red : theme.warning, color: theme.white }
              : undefined
          }
        >
          <Trans>Swap Anyway</Trans>
        </CustomPrimaryButton>
      )
    }

    return (
      <CustomPrimaryButton onClick={handleClickSwapButton} disabled={!!swapCallbackError}>
        <Trans>Swap</Trans>
      </CustomPrimaryButton>
    )
  }

  return (
    <>
      <Flex
        sx={{
          marginTop: '24px',
          flexDirection: 'column',
        }}
      >
        {renderButton()}
        {isExpertMode && swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
      </Flex>
      <ConfirmSwapModal
        isOpen={isConfirming}
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
    </>
  )
}

export default ActionButton
