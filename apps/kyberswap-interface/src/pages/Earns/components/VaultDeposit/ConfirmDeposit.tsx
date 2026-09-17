import { t } from '@lingui/macro'
import { VaultApiDetailItem } from 'services/vault'

import { ReactComponent as SwapArrowIcon } from 'assets/svg/earn/ic_swap_arrow.svg'
import {
  ButtonGroup,
  DetailsBox,
  InfoLabel,
  InfoRow,
  InfoValue,
  ModalHeader,
  ModalSubtitle,
  ModalTitle,
  ModalTitleRow,
  OutlinedButton,
  PrimaryButton,
  SummaryAmount,
  SummaryLabel,
  SummaryRow,
  SummaryUsd,
} from 'pages/Earns/components/VaultDeposit/styles'
import { DepositFormState } from 'pages/Earns/components/VaultDeposit/useDepositForm'
import { formatDisplayNumber } from 'utils/numbers'
import { formatSlippage } from 'utils/slippage'
import { formatUnits } from 'utils/viem'

const CloseButton = ({ onClose }: { onClose: () => void }) => (
  <button
    type="button"
    aria-label={t`Close`}
    onClick={onClose}
    className="cursor-pointer border-none bg-transparent p-0 text-xl leading-5 text-subText hover:text-text"
  >
    ×
  </button>
)

/** Review step: what is being spent, what the vault will hold, and the terms of the route. */
const ConfirmDeposit = ({
  vault,
  form,
  onBack,
  onClose,
  onSubmit,
}: {
  vault: VaultApiDetailItem
  form: DepositFormState
  onBack: () => void
  onClose: () => void
  /** Hands over to the step sequence, which keeps its own modal open until the deposit confirms. */
  onSubmit: () => void
}) => {
  const shareSymbol = vault.shareToken?.symbol ?? ''
  const shareDecimals = vault.shareToken?.decimals ?? 18

  const amountIn = form.parsedAmount ? formatDisplayNumber(form.parsedAmount.toExact(), { significantDigits: 6 }) : '--'
  const amountInUsd = form.route
    ? formatDisplayNumber(form.route.zapDetails.initialAmountUsd, { style: 'currency', significantDigits: 4 })
    : undefined
  const sharesOut = form.sharesOutRaw
    ? formatDisplayNumber(formatUnits(form.sharesOutRaw, shareDecimals), { significantDigits: 6 })
    : '--'
  const sharesOutUsd = form.route
    ? formatDisplayNumber(form.route.zapDetails.finalAmountUsd, { style: 'currency', significantDigits: 4 })
    : undefined
  const minSharesOut = form.minSharesOutRaw
    ? formatDisplayNumber(formatUnits(form.minSharesOutRaw, shareDecimals), { significantDigits: 6 })
    : '--'

  return (
    <>
      <ModalHeader>
        <ModalTitleRow>
          <ModalTitle>{t`Confirm Deposit`}</ModalTitle>
          <CloseButton onClose={onClose} />
        </ModalTitleRow>
        <ModalSubtitle>{t`Please review the details of your deposit:`}</ModalSubtitle>
      </ModalHeader>

      {form.isVaultAsset ? (
        <div className="flex w-full flex-col gap-2">
          <SummaryLabel>{t`You are depositing:`}</SummaryLabel>
          <SummaryRow>
            <SummaryAmount>
              {amountIn} {form.currency?.symbol}
            </SummaryAmount>
            {amountInUsd ? <SummaryUsd>~ {amountInUsd}</SummaryUsd> : null}
          </SummaryRow>
        </div>
      ) : (
        <div className="flex w-full flex-col gap-2">
          <SummaryLabel>{t`You are swapping:`}</SummaryLabel>
          <SummaryRow className="justify-center gap-4">
            <span className="flex items-center gap-2">
              <SummaryAmount>
                {amountIn} {form.currency?.symbol}
              </SummaryAmount>
              {amountInUsd ? <SummaryUsd>~ {amountInUsd}</SummaryUsd> : null}
            </span>
            <span className="flex size-5 shrink-0 -rotate-90 items-center justify-center rounded-full border border-white-08 text-subText">
              <SwapArrowIcon width={12} height={12} />
            </span>
            <span className="flex items-center gap-2">
              <SummaryAmount>
                {sharesOut} {shareSymbol}
              </SummaryAmount>
              {sharesOutUsd ? <SummaryUsd>~ {sharesOutUsd}</SummaryUsd> : null}
            </span>
          </SummaryRow>
        </div>
      )}

      <DetailsBox>
        {!form.isVaultAsset ? (
          <>
            <InfoRow>
              <InfoLabel
                tooltip={t`The least you will receive if the price moves against you by the full slippage tolerance.`}
              >{t`Minimum Receiving`}</InfoLabel>
              <InfoValue>
                {minSharesOut} {shareSymbol}
              </InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel
                tooltip={t`How far this trade moves the price of the pools it routes through. A large impact means thin liquidity.`}
              >{t`Price Impact`}</InfoLabel>
              <InfoValue>
                {form.route
                  ? formatDisplayNumber(form.route.zapDetails.priceImpact / 100, {
                      style: 'percent',
                      fractionDigits: 2,
                    })
                  : '--'}
              </InfoValue>
            </InfoRow>
          </>
        ) : null}
        <InfoRow>
          <InfoLabel
            tooltip={t`Estimated network fee for this transaction. What you actually pay depends on network conditions.`}
          >{t`Est. Gas Fee`}</InfoLabel>
          <InfoValue>
            {form.route ? formatDisplayNumber(form.route.gasUsd, { style: 'currency', significantDigits: 4 }) : '--'}
          </InfoValue>
        </InfoRow>
        <InfoRow>
          <InfoLabel>{t`Max Slippage`}</InfoLabel>
          <InfoValue>{formatSlippage(form.slippage)}</InfoValue>
        </InfoRow>
      </DetailsBox>

      {/* Nothing on this screen otherwise says how the money comes back out, and the queue is the
          part people are surprised by. The wait is stated in words rather than read from the queue:
          its terms live behind the vault's `contracts.withdrawQueue`, which the API does not return. */}
      <div className="flex w-full flex-col gap-1">
        <p className="m-0 text-xs italic leading-4 text-subText">
          {t`Earnings auto-compound into your balance — there is nothing to claim.`}
        </p>
        <p className="m-0 text-xs italic leading-4 text-subText">
          {t`Native withdrawals are not instant: they queue for ~3 days and can take longer depending on the strategy.`}
        </p>
      </div>

      <ButtonGroup>
        <OutlinedButton onClick={onBack}>{t`Cancel`}</OutlinedButton>
        <PrimaryButton onClick={onSubmit} disabled={!form.isReady}>
          {t`Deposit`}
        </PrimaryButton>
      </ButtonGroup>
    </>
  )
}

export default ConfirmDeposit
export { CloseButton }
