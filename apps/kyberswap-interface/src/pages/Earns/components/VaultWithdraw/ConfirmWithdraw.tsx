import { t } from '@lingui/macro'

import { ReactComponent as SwapArrowIcon } from 'assets/svg/earn/ic_swap_arrow.svg'
import { CloseButton } from 'pages/Earns/components/VaultDeposit/ConfirmDeposit'
import {
  ButtonGroup,
  DetailsBox,
  InfoLabel,
  InfoRow,
  InfoValue,
  ModalHeader,
  ModalTitle,
  ModalTitleRow,
  OutlinedButton,
  PrimaryButton,
  SummaryAmount,
  SummaryLabel,
  SummaryRow,
  SummaryUsd,
} from 'pages/Earns/components/VaultDeposit/styles'
import { WithdrawFormState } from 'pages/Earns/components/VaultWithdraw/useWithdrawForm'
import { formatDuration } from 'pages/Earns/hooks/useCountdown'
import { formatDisplayNumber } from 'utils/numbers'
import { formatSlippage } from 'utils/slippage'
import { formatUnits } from 'utils/viem'

/** Review step: what leaves the vault, what comes back, and on what terms. */
const ConfirmWithdraw = ({
  form,
  onBack,
  onClose,
  onSubmit,
}: {
  form: WithdrawFormState
  onBack: () => void
  onClose: () => void
  /** Hands over to the step sequence, which keeps its own modal open until the tx confirms. */
  onSubmit: () => void
}) => {
  const sharesIn = form.shares
    ? formatDisplayNumber(formatUnits(form.shares, form.shareDecimals), { significantDigits: 6 })
    : '--'

  const nativeOut =
    form.nativeAmountOut !== undefined && form.nativeAsset
      ? `${formatDisplayNumber(formatUnits(form.nativeAmountOut, form.nativeAsset.decimals), {
          significantDigits: 6,
        })} ${form.nativeAsset.symbol}`
      : '--'

  const zapOut =
    form.zapAmountOutRaw !== undefined && form.swapToken
      ? `${formatDisplayNumber(formatUnits(form.zapAmountOutRaw, form.swapToken.decimals), {
          significantDigits: 6,
        })} ${form.swapToken.symbol}`
      : '--'

  const zapMinOut =
    form.zapMinAmountOutRaw !== undefined && form.swapToken
      ? `${formatDisplayNumber(formatUnits(form.zapMinAmountOutRaw, form.swapToken.decimals), {
          significantDigits: 6,
        })} ${form.swapToken.symbol}`
      : '--'

  const sharesUsd = form.zapRoute
    ? formatDisplayNumber(form.zapRoute.zapDetails.initialAmountUsd, { style: 'currency', significantDigits: 4 })
    : undefined
  const zapOutUsd = form.zapRoute
    ? formatDisplayNumber(form.zapRoute.zapDetails.finalAmountUsd, { style: 'currency', significantDigits: 4 })
    : undefined

  return (
    <>
      <ModalHeader>
        <ModalTitleRow>
          <ModalTitle>{t`Confirm Withdraw`}</ModalTitle>
          <CloseButton onClose={onClose} />
        </ModalTitleRow>
      </ModalHeader>

      <div className="flex w-full flex-col gap-2">
        <SummaryLabel>{t`You are withdrawing:`}</SummaryLabel>
        <SummaryRow>
          <SummaryAmount>
            {sharesIn} {form.shareSymbol}
          </SummaryAmount>
          {sharesUsd ? <SummaryUsd>~ {sharesUsd}</SummaryUsd> : null}
        </SummaryRow>
      </div>

      {!form.isNative ? (
        <div className="flex w-full flex-col gap-2">
          <SummaryLabel>{t`Then swap:`}</SummaryLabel>
          <SummaryRow className="justify-center gap-4">
            <span className="flex items-center gap-2">
              <SummaryAmount>
                {sharesIn} {form.shareSymbol}
              </SummaryAmount>
            </span>
            <span className="flex size-5 shrink-0 -rotate-90 items-center justify-center rounded-full border border-white-08 text-subText">
              <SwapArrowIcon width={12} height={12} />
            </span>
            <span className="flex items-center gap-2">
              <SummaryAmount>{zapOut}</SummaryAmount>
              {zapOutUsd ? <SummaryUsd>~ {zapOutUsd}</SummaryUsd> : null}
            </span>
          </SummaryRow>
        </div>
      ) : null}

      <DetailsBox>
        {form.isNative ? (
          <>
            <InfoRow>
              <InfoLabel
                tooltip={t`Quoted by the vault's withdrawal queue and locked into the request when you submit it.`}
              >{t`You receive`}</InfoLabel>
              <InfoValue>{nativeOut}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel
                tooltip={t`How long the vault's withdrawal queue waits before a solver can fill your request.`}
              >{t`Ready in`}</InfoLabel>
              <InfoValue>{form.queueConfig ? formatDuration(form.queueConfig.secondsToMaturity) : '--'}</InfoValue>
            </InfoRow>
          </>
        ) : (
          <>
            <InfoRow>
              <InfoLabel
                tooltip={t`The least you will receive if the price moves against you by the full slippage tolerance.`}
              >{t`Minimum Receiving`}</InfoLabel>
              <InfoValue>{zapMinOut}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel
                tooltip={t`How far this trade moves the price of the pools it routes through. A large impact means thin liquidity.`}
              >{t`Price Impact`}</InfoLabel>
              <InfoValue>
                {form.zapRoute
                  ? formatDisplayNumber(form.zapRoute.zapDetails.priceImpact / 100, {
                      style: 'percent',
                      fractionDigits: 2,
                    })
                  : '--'}
              </InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel
                tooltip={t`Estimated network fee for this transaction. What you actually pay depends on network conditions.`}
              >{t`Est. Gas Fee`}</InfoLabel>
              <InfoValue>
                {form.zapRoute
                  ? formatDisplayNumber(form.zapRoute.gasUsd, { style: 'currency', significantDigits: 4 })
                  : '--'}
              </InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>{t`Max Slippage`}</InfoLabel>
              <InfoValue>{formatSlippage(form.slippage)}</InfoValue>
            </InfoRow>
          </>
        )}
      </DetailsBox>

      {form.isNative ? (
        <p className="m-0 w-full text-xs italic leading-4 text-gray">
          {t`When completed, tokens are automatically sent to your wallet, no need to claim.`}
        </p>
      ) : null}

      <ButtonGroup>
        <OutlinedButton onClick={onBack}>{t`Cancel`}</OutlinedButton>
        <PrimaryButton onClick={onSubmit} disabled={!form.isReady}>
          {t`Withdraw`}
        </PrimaryButton>
      </ButtonGroup>
    </>
  )
}

export default ConfirmWithdraw
