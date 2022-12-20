import { Trans } from '@lingui/macro'
import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Flex } from 'rebass'
import styled from 'styled-components'

import { ButtonConfirmed, ButtonLight, ButtonPrimary } from 'components/Button'
import Column from 'components/Column/index'
import Loader from 'components/Loader'
import ProgressSteps from 'components/ProgressSteps'
import { AutoRow, RowBetween } from 'components/Row'
import { Dots, SwapCallbackError } from 'components/swapv2/styleds'
import { useActiveWeb3React } from 'hooks'
import { ApprovalState, useApproveCallbackV3 } from 'hooks/useApproveCallback'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useSwapCallbackV3 from 'hooks/useSwapCallbackV3'
import useTheme from 'hooks/useTheme'
import useWrapCallback, { WrapType } from 'hooks/useWrapCallback'
import { AppState } from 'state'
import { useWalletModalToggle } from 'state/application/hooks'
import { Field, setConfirming } from 'state/swap/actions'
import {
  useEncodeSolana,
  useInputCurrency,
  useOutputCurrency,
  useSwapActionHandlers,
  useSwapState,
} from 'state/swap/hooks'
import useParsedAmountFromInputCurrency from 'state/swap/hooks/useParsedAmountFromInputCurrency'
import { useExpertModeManager } from 'state/user/hooks'
import { useCurrencyBalances } from 'state/wallet/hooks'
import { Aggregator } from 'utils/aggregator'

import SwapModal from './SwapModalV2'
import useGetError from './useGetError'
import { isHighPriceImpact, isInvalidPriceImpact, isVeryHighPriceImpact } from './utils'

const CustomPrimaryButton = styled(ButtonPrimary).attrs({
  id: 'swap-button',
})`
  border: none;
  font-weight: 500;

  &:disabled {
    border: none;
  }
`

const ActionButton: React.FC = () => {
  const { account, isSolana } = useActiveWeb3React()
  const [encodeSolana] = useEncodeSolana()
  const theme = useTheme()
  const dispatch = useDispatch()

  const isLoadingRoute = useSelector((state: AppState) => !!state.swap.isLoadingRoute)
  const hasNoRoute = useSelector((state: AppState) => state.swap?.routeSummary?.route.length === 0)

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()
  const [isExpertMode] = useExpertModeManager()
  const {
    typedValue,
    isConfirming,
    [Field.INPUT]: { currencyId: inputCurrencyId },
  } = useSwapState()
  const { onUserInput } = useSwapActionHandlers()
  const priceImpact = useSelector((state: AppState) => state.swap.routeSummary?.priceImpact)
  const inputAmount = useSelector((state: AppState) => state.swap.routeSummary?.parsedAmountIn)
  const outputAmount = useSelector((state: AppState) => state.swap.routeSummary?.parsedAmountOut)
  const routerAddress = useSelector((state: AppState) => state.swap.routerAddress)

  const swapInputError = useGetError()

  const parsedAmount = useParsedAmountFromInputCurrency()

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

  const currencyIn = useInputCurrency()
  const currencyOut = useOutputCurrency()

  const [balanceIn, balanceOut] = useCurrencyBalances(
    useMemo(() => [currencyIn, currencyOut], [currencyIn, currencyOut]),
  )

  const { wrapType, execute: onWrap, inputError: wrapInputError } = useWrapCallback(currencyIn, currencyOut, typedValue)

  const isSolanaUnwrap = isSolana && wrapType === WrapType.UNWRAP
  useEffect(() => {
    // reset value for unwrapping WSOL
    // because on Solana, unwrap WSOL is closing WSOL account,
    // which mean it will unwrap all WSOL at once and we can't unwrap partial amount of WSOL
    if (isSolanaUnwrap) onUserInput(Field.INPUT, balanceIn?.toExact() ?? '')
  }, [balanceIn, isSolanaUnwrap, onUserInput, parsedAmount])

  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE

  const userHasSpecifiedInputOutput = Boolean(currencyIn && currencyOut && parsedAmount)

  // check whether the user has approved the router on the input token
  const [approval, approveCallback] = useApproveCallbackV3()

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
  const { callback: swapCallback, error: swapCallbackError } = useSwapCallbackV3(
    inputAmount,
    outputAmount,
    priceImpact,
    routerAddress,
    '',
  )

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
    setSwapState({ tradeToConfirm: undefined, swapErrorMessage, txHash, attemptingTxn })
  }

  // show approve flow when: no error on inputs, not approved or pending, or approved in current session
  // never show if price impact is above threshold in non expert mode
  const showApproveFlow =
    !swapInputError &&
    (approval === ApprovalState.NOT_APPROVED ||
      approval === ApprovalState.PENDING ||
      (approvalSubmitted && approval === ApprovalState.APPROVED))

  const isLoading = isLoadingRoute || ((!balanceIn || !balanceOut) && userHasSpecifiedInputOutput)

  // TODO: fix mixpanel
  const { mixpanelHandler } = useMixpanel(undefined, {
    [Field.INPUT]: currencyIn,
    [Field.OUTPUT]: currencyOut,
  })
  const mixpanelSwapInit = () => {
    mixpanelHandler(MIXPANEL_TYPE.SWAP_INITIATED)
  }

  const handleConfirmDismiss = () => {
    dispatch(setConfirming(false))

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
        tradeToConfirm: undefined,
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

    if (userHasSpecifiedInputOutput && hasNoRoute) {
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
                    tradeToConfirm: undefined,
                    attemptingTxn: false,
                    swapErrorMessage: undefined,
                    txHash: undefined,
                  })
                }
              }}
              width="48%"
              disabled={!!swapInputError || approval !== ApprovalState.APPROVED}
              backgroundColor={
                isHighPriceImpact(priceImpact)
                  ? theme.red
                  : isInvalidPriceImpact(priceImpact)
                  ? theme.warning
                  : undefined
              }
              color={isHighPriceImpact(priceImpact) || isInvalidPriceImpact(priceImpact) ? theme.white : undefined}
            >
              {isHighPriceImpact(priceImpact) ? <Trans>Swap Anyway</Trans> : <Trans>Swap</Trans>}
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

    if (isInvalidPriceImpact(priceImpact) || isHighPriceImpact(priceImpact)) {
      return (
        <CustomPrimaryButton
          onClick={handleClickSwapButton}
          disabled={!isExpertMode}
          style={
            isExpertMode
              ? { background: isVeryHighPriceImpact(priceImpact) ? theme.red : theme.warning, color: theme.white }
              : undefined
          }
        >
          <Trans>Swap Anyway</Trans>
        </CustomPrimaryButton>
      )
    }

    return (
      <CustomPrimaryButton
        onClick={handleClickSwapButton}
        // disabled={!!swapCallbackError}
      >
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
      <SwapModal
        isOpen={isConfirming}
        onAcceptChanges={handleAcceptChanges}
        attemptingTxn={attemptingTxn}
        txHash={txHash}
        onConfirm={handleSwap}
        swapErrorMessage={swapErrorMessage}
        onDismiss={handleConfirmDismiss}
        tokenAddToMetaMask={currencyOut}
      />
    </>
  )
}

export default ActionButton
