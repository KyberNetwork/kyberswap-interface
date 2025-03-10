import { Currency, WETH } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { Text } from 'rebass'

import {
  ButtonApprove,
  ButtonError,
  ButtonLight,
  ButtonPrimary,
  ButtonWarning,
  ButtonWithInfoHelper,
} from 'components/Button'
import ProgressSteps from 'components/ProgressSteps'
import { RowBetween } from 'components/Row'
import { EditOrderInfo } from 'components/swapv2/LimitOrder/type'
import { useActiveWeb3React } from 'hooks'
import { ApprovalState } from 'hooks/useApproveCallback'
import { useWalletModalToggle } from 'state/application/hooks'
import { isTokenNative } from 'utils/tokenInfo'

export default function ActionButtonLimitOrder({
  showWrap,
  approval,
  currencyIn,
  currencyOut,
  isWrappingEth,
  wrapInputError,
  approveCallback,
  onWrapToken,
  checkingAllowance,
  showPreview,
  isNotFillAllInput,
  enoughAllowance,
  hasInputError,
  approvalSubmitted,
  showApproveFlow,
  showWarning,
  editOrderInfo,
}: {
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  approval: ApprovalState
  showWrap: boolean
  isWrappingEth: boolean
  isNotFillAllInput: boolean
  hasInputError: boolean
  approvalSubmitted: boolean
  enoughAllowance: boolean
  checkingAllowance: boolean
  showApproveFlow: boolean
  wrapInputError: any
  showWarning: boolean
  approveCallback: () => Promise<void>
  onWrapToken: () => Promise<void>
  showPreview: () => void
  editOrderInfo?: EditOrderInfo
}) {
  const { isEdit, renderCancelButtons } = editOrderInfo || {}
  const disableBtnApproved =
    approval === ApprovalState.PENDING ||
    !!hasInputError ||
    ((approval !== ApprovalState.NOT_APPROVED || approvalSubmitted) && enoughAllowance)

  const disableBtnReview =
    checkingAllowance ||
    isNotFillAllInput ||
    !!hasInputError ||
    approval !== ApprovalState.APPROVED ||
    isWrappingEth ||
    (showWrap && !isWrappingEth) ||
    (currencyIn?.equals(WETH[currencyIn.chainId]) && isTokenNative(currencyOut, currencyOut?.chainId))

  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  if (!account)
    return (
      <ButtonLight onClick={toggleWalletModal}>
        <Trans>Connect</Trans>
      </ButtonLight>
    )

  const inSymbol = currencyIn?.symbol
  const wrapSymbol = currencyIn?.wrapped.symbol
  if (showApproveFlow || showWrap)
    return (
      <>
        <RowBetween>
          {showWrap ? (
            <ButtonWithInfoHelper
              loading={isWrappingEth}
              tooltipMsg={t`You will need to wrap your ${inSymbol} to ${wrapSymbol} before you can place a limit order. Your tokens will be exchanged 1 to 1.`}
              text={isWrappingEth ? t`Wrapping` : t`Wrap ${inSymbol}`}
              onClick={onWrapToken}
              disabled={Boolean(wrapInputError) || isNotFillAllInput || isWrappingEth}
            />
          ) : (
            <ButtonApprove
              forceApprove={!enoughAllowance}
              tokenSymbol={currencyIn?.symbol}
              tooltipMsg={t`You need to first allow KyberSwap smart contracts to use your ${inSymbol}. This has to be done only once for each token.`}
              approveCallback={approveCallback}
              disabled={!!disableBtnApproved}
              approval={approval}
            />
          )}
          <ButtonError width="48%" id="review-order-button" disabled={disableBtnReview} onClick={showPreview}>
            <Text fontSize={16} fontWeight={500}>
              <Trans>Review Order</Trans>
            </Text>
          </ButtonError>
        </RowBetween>
        {showApproveFlow && <ProgressSteps steps={[approval === ApprovalState.APPROVED]} />}
      </>
    )

  const contentButton = (
    <Text fontWeight={500}>
      {checkingAllowance ? <Trans>Checking Allowance...</Trans> : <Trans>Review Order</Trans>}
    </Text>
  )

  if (isEdit) {
    return checkingAllowance ? <ButtonPrimary disabled>{contentButton}</ButtonPrimary> : renderCancelButtons?.() || null
  }

  if (showWarning && !disableBtnReview) return <ButtonWarning onClick={showPreview}>{contentButton}</ButtonWarning>

  return (
    <ButtonPrimary id="review-order-button" onClick={showPreview} disabled={disableBtnReview}>
      {contentButton}
    </ButtonPrimary>
  )
}
