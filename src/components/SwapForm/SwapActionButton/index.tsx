import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useEffect, useState } from 'react'
import styled from 'styled-components'

import { ButtonConfirmed, ButtonLight, ButtonPrimary } from 'components/Button'
import Column from 'components/Column/index'
import InfoHelper from 'components/InfoHelper'
import Loader from 'components/Loader'
import ProgressSteps from 'components/ProgressSteps'
import { AutoRow, RowBetween, RowFit } from 'components/Row'
import SwapOnlyButton from 'components/SwapForm/SwapActionButton/SwapOnlyButton'
import { BuildRouteResult } from 'components/SwapForm/hooks/useBuildRoute'
import { SwapCallbackError } from 'components/swapv2/styleds'
import { useActiveWeb3React } from 'hooks'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { PermitState, usePermit } from 'hooks/usePermit'
import useTheme from 'hooks/useTheme'
import { WrapType } from 'hooks/useWrapCallback'
import ApprovalModal from 'pages/SwapV3/ApprovalModal'
import { ApplicationModal } from 'state/application/actions'
import { useToggleModal, useWalletModalToggle } from 'state/application/hooks'
import { DetailedRouteSummary } from 'types/route'

import { Props as SwapOnlyButtonProps } from './SwapOnlyButton'

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
  isAdvancedMode: boolean
  isGettingRoute: boolean
  isProcessingSwap: boolean

  typedValue: string
  parsedAmountFromTypedValue: CurrencyAmount<Currency> | undefined
  routeSummary: DetailedRouteSummary | undefined

  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  balanceIn: CurrencyAmount<Currency> | undefined
  balanceOut: CurrencyAmount<Currency> | undefined

  swapInputError: string | undefined
  wrapInputError: string | undefined
  wrapType: WrapType

  setProcessingSwap: React.Dispatch<React.SetStateAction<boolean>>
  onWrap: (() => Promise<string | undefined>) | undefined
  buildRoute: () => Promise<BuildRouteResult>
}

const SwapActionButton: React.FC<Props> = ({
  isAdvancedMode,
  isGettingRoute,
  isProcessingSwap,

  typedValue,
  parsedAmountFromTypedValue,
  routeSummary,

  currencyIn,
  currencyOut,
  balanceIn,
  balanceOut,

  swapInputError,
  wrapInputError,
  wrapType,

  setProcessingSwap,
  onWrap,
  buildRoute,
}) => {
  const theme = useTheme()
  const { account, walletKey } = useActiveWeb3React()

  const [errorWhileSwap, setErrorWhileSwap] = useState('')
  const noRouteFound = routeSummary && !routeSummary.route

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE

  const userHasSpecifiedInputOutput = Boolean(
    currencyIn && currencyOut && parsedAmountFromTypedValue && !parsedAmountFromTypedValue.equalTo(0),
  )

  // check whether the user has approved the router on the input token
  const [approval, approveCallback] = useApproveCallback(parsedAmountFromTypedValue, routeSummary?.routerAddress)

  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  const { permitState, permitCallback } = usePermit(parsedAmountFromTypedValue, routeSummary?.routerAddress)

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
    if (!isProcessingSwap) {
      setApprovalSubmitted(false)
    }
  }, [currencyIn, typedValue, isProcessingSwap])

  // show approve flow when: no error on inputs, not approved or pending, or approved in current session
  // never show if price impact is above threshold in non degen mode
  const showApproveFlow =
    !swapInputError &&
    (approval === ApprovalState.NOT_APPROVED ||
      approval === ApprovalState.PENDING ||
      (approvalSubmitted && approval === ApprovalState.APPROVED)) &&
    permitState !== PermitState.SIGNED

  const toggleApprovalModal = useToggleModal(ApplicationModal.SWAP_APPROVAL)

  const handleApproveClick = () => {
    if (walletKey && ['METAMASK', 'TRUST_WALLET'].includes(walletKey?.toString())) {
      approveCallback()
    } else {
      toggleApprovalModal()
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

    if (wrapInputError) {
      return <CustomPrimaryButton disabled>{wrapInputError}</CustomPrimaryButton>
    }

    if (showWrap) {
      return (
        <CustomPrimaryButton onClick={onWrap}>
          {wrapType === WrapType.WRAP ? <Trans>Wrap</Trans> : <Trans>Unwrap</Trans>}
        </CustomPrimaryButton>
      )
    }

    if (userHasSpecifiedInputOutput && noRouteFound) {
      return (
        <CustomPrimaryButton disabled>
          <Trans>Insufficient liquidity for this trade</Trans>
        </CustomPrimaryButton>
      )
    }

    if (swapInputError) {
      return <CustomPrimaryButton disabled>{swapInputError}</CustomPrimaryButton>
    }

    const swapOnlyButtonProps: SwapOnlyButtonProps = {
      isDegenMode: isAdvancedMode,
      routeSummary,
      isGettingRoute,
      isProcessingSwap,

      currencyIn,
      currencyOut,
      balanceIn,
      balanceOut,
      parsedAmount: parsedAmountFromTypedValue,
      isPermitSwap: permitState === PermitState.SIGNED,

      setProcessingSwap,
      setErrorWhileSwap,
      buildRoute,

      isApproved: approval === ApprovalState.APPROVED || permitState === PermitState.SIGNED,
    }

    if (showApproveFlow) {
      return (
        <>
          <RowBetween gap="12px">
            {permitState === PermitState.NOT_APPLICABLE ? (
              <ButtonConfirmed
                onClick={handleApproveClick}
                disabled={approval !== ApprovalState.NOT_APPROVED || approvalSubmitted}
                altDisabledStyle={approval === ApprovalState.PENDING} // show solid button while waiting
                confirmed={approval === ApprovalState.APPROVED}
                style={{
                  border: 'none',
                  flex: 1,
                }}
              >
                {approval === ApprovalState.PENDING ? (
                  <AutoRow gap="6px" justify="center">
                    <Trans>Approving</Trans> <Loader stroke="white" />
                  </AutoRow>
                ) : approvalSubmitted && approval === ApprovalState.APPROVED ? (
                  <Trans>Approved</Trans>
                ) : (
                  <RowFit gap="4px">
                    <InfoHelper
                      color={theme.textReverse}
                      placement="top"
                      text={
                        <Trans>
                          You need to first allow KyberSwap&apos;s smart contract to use your {currencyIn?.symbol}.{' '}
                          <a
                            href="https://docs.kyberswap.com/kyberswap-solutions/kyberswap-interface/user-guides/instantly-swap-at-the-best-rates#step-4-approve-contract-to-swap-tokens"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Read more ↗
                          </a>
                        </Trans>
                      }
                    />
                    <Trans>Approve {currencyIn?.symbol}</Trans>
                  </RowFit>
                )}
              </ButtonConfirmed>
            ) : (
              <ButtonConfirmed
                onClick={() => {
                  permitCallback()
                }}
                style={{
                  flex: 1,
                }}
              >
                <RowFit gap="4px">
                  <InfoHelper
                    color={theme.textReverse}
                    placement="top"
                    text={
                      <Trans>
                        You need to first give a temporary 24H approval to KyberSwaps smart contract to use your{' '}
                        {currencyIn?.symbol}. This doesnt require a gas fees.{' '}
                        <a
                          href="https://docs.kyberswap.com/reference/permitable-tokens"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Read more ↗
                        </a>
                      </Trans>
                    }
                  />
                  <Trans>Permit {currencyIn?.symbol}</Trans>
                </RowFit>
              </ButtonConfirmed>
            )}

            <SwapOnlyButton minimal {...swapOnlyButtonProps} />
          </RowBetween>
          <Column>
            <ProgressSteps steps={[approval === ApprovalState.APPROVED]} />
          </Column>
        </>
      )
    }

    return <SwapOnlyButton {...swapOnlyButtonProps} />
  }

  useEffect(() => {
    setErrorWhileSwap('')
  }, [typedValue])

  return (
    <>
      {renderButton()}
      {isAdvancedMode && errorWhileSwap ? (
        <SwapCallbackError style={{ margin: 0, zIndex: 'unset' }} error={errorWhileSwap} />
      ) : null}
      <ApprovalModal typedValue={typedValue} currencyInput={currencyIn} onApprove={approveCallback} />
    </>
  )
}

export default SwapActionButton
