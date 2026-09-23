import { t } from '@lingui/macro'
import { VaultApiDetailItem } from 'services/vault'

import { ReactComponent as SwapArrowIcon } from 'assets/svg/earn/ic_swap_arrow.svg'
import TokenLogo from 'components/TokenLogo'
import { CloseButton } from 'pages/Earns/components/VaultDeposit/ConfirmDeposit'
import {
  ButtonGroup,
  DetailsBox,
  FieldNote,
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
import VaultIdentityRow from 'pages/Earns/components/VaultIdentityRow'
import VaultPriceImpactNote from 'pages/Earns/components/VaultPriceImpactNote'
import { WithdrawFormState } from 'pages/Earns/components/VaultWithdraw/useWithdrawForm'
import { formatTerm } from 'pages/Earns/hooks/useCountdown'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'
import { formatSlippage } from 'utils/slippage'
import { formatUnits } from 'utils/viem'

/** Review step: what leaves the vault, what comes back, and on what terms. */
const ConfirmWithdraw = ({
  vault,
  form,
  onBack,
  onClose,
  onSubmit,
}: {
  vault: VaultApiDetailItem
  form: WithdrawFormState
  onBack: () => void
  onClose: () => void
  /** Hands over to the step sequence, which keeps its own modal open until the tx confirms. */
  onSubmit: () => void
}) => {
  const shareLogo = vault.shareToken?.logo
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

  // The route prices what it delivers, not the floor; the floor's worth follows the same ratio.
  const zapMinOutUsd =
    form.zapRoute && form.zapMinAmountOutRaw !== undefined && form.zapAmountOutRaw
      ? formatDisplayNumber(
          (Number(form.zapRoute.zapDetails.finalAmountUsd) * Number(form.zapMinAmountOutRaw)) /
            Number(form.zapAmountOutRaw),
          { style: 'currency', significantDigits: 4 },
        )
      : undefined

  const sharesUsd = form.zapRoute
    ? formatDisplayNumber(form.zapRoute.zapDetails.initialAmountUsd, { style: 'currency', significantDigits: 4 })
    : undefined
  const zapOutUsd = form.zapRoute
    ? formatDisplayNumber(form.zapRoute.zapDetails.finalAmountUsd, { style: 'currency', significantDigits: 4 })
    : undefined

  const isImpactBad = form.priceImpactResult.isVeryHigh || form.priceImpactResult.isInvalid

  return (
    <>
      <ModalHeader>
        <ModalTitleRow>
          <ModalTitle>{t`Confirm Withdraw`}</ModalTitle>
          <CloseButton onClose={onClose} />
        </ModalTitleRow>
      </ModalHeader>

      <VaultIdentityRow vault={vault} />

      <div className="flex w-full flex-col gap-2">
        <SummaryLabel>{t`You are withdrawing:`}</SummaryLabel>
        <SummaryRow>
          {shareLogo ? <TokenLogo src={shareLogo} alt={form.shareSymbol} size={20} /> : null}
          <SummaryAmount>
            {sharesIn} {form.shareSymbol}
          </SummaryAmount>
          {sharesUsd ? <SummaryUsd>~ {sharesUsd}</SummaryUsd> : null}
        </SummaryRow>
      </div>

      {!form.isNative ? (
        <div className="flex w-full flex-col gap-2">
          <SummaryLabel>{t`Then swap:`}</SummaryLabel>
          <SummaryRow className="items-center justify-between gap-3 py-3">
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="flex items-center gap-2">
                {shareLogo ? <TokenLogo src={shareLogo} alt={form.shareSymbol} size={20} /> : null}
                <SummaryAmount>
                  {sharesIn} {form.shareSymbol}
                </SummaryAmount>
              </span>
              {sharesUsd ? <SummaryUsd>~ {sharesUsd}</SummaryUsd> : null}
            </span>
            <span className="flex size-5 shrink-0 -rotate-90 items-center justify-center rounded-full border border-white-08 text-subText">
              <SwapArrowIcon width={12} height={12} />
            </span>
            <span className="flex min-w-0 flex-col items-end gap-0.5">
              <span className="flex items-center gap-2">
                {form.swapToken?.logo ? (
                  <TokenLogo src={form.swapToken.logo} alt={form.swapToken.symbol} size={20} />
                ) : null}
                <SummaryAmount>{zapOut}</SummaryAmount>
              </span>
              {zapOutUsd ? <SummaryUsd>~ {zapOutUsd}</SummaryUsd> : null}
            </span>
          </SummaryRow>
        </div>
      ) : null}

      <DetailsBox>
        {/* One label for both paths, as the design has it. Only the aggregator route has a slippage
            floor, so on the queue path the tooltip says the figure is exact. */}
        <InfoRow>
          <InfoLabel
            tooltip={
              form.isNative
                ? t`The queue prices this redemption when you submit it and locks the amount into the request, so it is what you receive rather than a floor.`
                : t`The least you will receive if the price moves against you by the full slippage tolerance.`
            }
          >{t`Est. Min Received`}</InfoLabel>
          <InfoValue>
            {form.isNative ? nativeOut : zapMinOut}
            {!form.isNative && zapMinOutUsd ? <span className="text-subText">~{zapMinOutUsd}</span> : null}
          </InfoValue>
        </InfoRow>

        {form.isNative ? (
          <InfoRow>
            <InfoLabel
              tooltip={t`How long the withdrawal usually takes. A solver fills the request out of the queue, so the vault does not pay out on a fixed schedule.`}
            >{t`Processing Time`}</InfoLabel>
            <InfoValue>{form.queueLimits ? formatTerm(form.queueLimits.minimumSecondsToDeadline) : '--'}</InfoValue>
          </InfoRow>
        ) : (
          <>
            <InfoRow>
              <InfoLabel>{t`Max Slippage`}</InfoLabel>
              <InfoValue>{formatSlippage(form.slippage)}</InfoValue>
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
          </>
        )}
      </DetailsBox>

      {form.isNative ? (
        <FieldNote className="text-gray">
          {t`When completed, tokens are automatically sent to your wallet, no need to claim.`}
        </FieldNote>
      ) : null}

      <VaultPriceImpactNote result={form.priceImpactResult} />

      <ButtonGroup>
        <OutlinedButton onClick={onBack}>{t`Cancel`}</OutlinedButton>
        <PrimaryButton className={cn(isImpactBad && 'bg-red text-white')} onClick={onSubmit} disabled={!form.isReady}>
          {isImpactBad ? t`Withdraw Anyway` : t`Withdraw`}
        </PrimaryButton>
      </ButtonGroup>
    </>
  )
}

export default ConfirmWithdraw
