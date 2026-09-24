import { t } from '@lingui/macro'
import { VaultApiDetailItem } from 'services/vault'

import CurrencyLogo from 'components/CurrencyLogo'
import TokenLogo from 'components/TokenLogo'
import { maxSlippageTooltip } from 'pages/Earns/components/VaultDeposit/SlippageSelect'
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
import VaultIdentityRow from 'pages/Earns/components/VaultIdentityRow'
import VaultPriceImpactNote, {
  getPriceImpactTone,
  isPriceImpactBad,
  priceImpactButtonClass,
} from 'pages/Earns/components/VaultPriceImpactNote'
import VaultPriceImpactRow from 'pages/Earns/components/VaultPriceImpactRow'
import { cn } from 'utils/cn'
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

  const shareLogo = vault.shareToken?.logo

  /** Only the rows carrying an amount are being spent; an untouched row is not part of the deposit. */
  const spent = form.rows.filter(row => row.parsedAmount?.greaterThan(0))
  const totalUsd =
    form.totalUsd === undefined
      ? undefined
      : formatDisplayNumber(form.totalUsd, { style: 'currency', significantDigits: 4 })
  const sharesOut = form.sharesOutRaw
    ? formatDisplayNumber(formatUnits(form.sharesOutRaw, shareDecimals), { significantDigits: 6 })
    : '--'
  const sharesOutUsd = form.route
    ? formatDisplayNumber(form.route.zapDetails.finalAmountUsd, { style: 'currency', significantDigits: 4 })
    : undefined
  const minSharesOut = form.minSharesOutRaw
    ? formatDisplayNumber(formatUnits(form.minSharesOutRaw, shareDecimals), { significantDigits: 6 })
    : '--'
  // The route prices the shares it delivers, not the floor; the floor's worth follows the ratio.
  const minReceiveUsd =
    form.route && form.minSharesOutRaw && form.sharesOutRaw
      ? formatDisplayNumber(
          (Number(form.route.zapDetails.finalAmountUsd) * Number(form.minSharesOutRaw)) / Number(form.sharesOutRaw),
          { style: 'currency', significantDigits: 4 },
        )
      : undefined

  const impactTone = getPriceImpactTone(form.priceImpactResult)
  const isImpactBad = isPriceImpactBad(form.priceImpactResult)

  return (
    <>
      <ModalHeader>
        <ModalTitleRow>
          <ModalTitle>{t`Confirm Deposit`}</ModalTitle>
          <CloseButton onClose={onClose} />
        </ModalTitleRow>
        <ModalSubtitle>{t`Please review the details of your deposit:`}</ModalSubtitle>
      </ModalHeader>

      <VaultIdentityRow vault={vault} />

      <SummaryRow className="flex-col items-stretch gap-2 py-3">
        <div className="flex w-full items-center justify-between gap-2">
          <SummaryLabel>{t`You are depositing:`}</SummaryLabel>
          {totalUsd ? <SummaryAmount>{totalUsd}</SummaryAmount> : null}
        </div>
        {spent.map(row => (
          <span key={row.key} className="flex items-center gap-2">
            {row.logo ? (
              <TokenLogo src={row.logo} alt={row.currency.symbol} size={20} />
            ) : (
              <CurrencyLogo currency={row.currency} size="20px" />
            )}
            <SummaryAmount>
              {formatDisplayNumber(row.parsedAmount?.toExact() ?? '0', { significantDigits: 6 })} {row.currency.symbol}
            </SummaryAmount>
            {row.amountUsd !== undefined ? (
              <SummaryUsd>
                ~ {formatDisplayNumber(row.amountUsd, { style: 'currency', significantDigits: 4 })}
              </SummaryUsd>
            ) : null}
          </span>
        ))}
      </SummaryRow>

      <SummaryRow className="justify-between bg-white-04">
        <SummaryLabel>{t`Est. Receive`}</SummaryLabel>
        <span className="flex items-center gap-2">
          {shareLogo ? <TokenLogo src={shareLogo} alt={shareSymbol} size={20} /> : null}
          <SummaryAmount>
            {sharesOut} {shareSymbol}
          </SummaryAmount>
          {sharesOutUsd ? <SummaryUsd>~ {sharesOutUsd}</SummaryUsd> : null}
        </span>
      </SummaryRow>

      <DetailsBox>
        <InfoRow>
          <InfoLabel
            tooltip={t`The least you will receive if the price moves against you by the full slippage tolerance.`}
          >{t`Est. Min Received`}</InfoLabel>
          <InfoValue>
            {shareLogo ? <TokenLogo src={shareLogo} alt={shareSymbol} size={16} /> : null}
            {minSharesOut} {shareSymbol}
            {minReceiveUsd ? <span className="text-subText">~{minReceiveUsd}</span> : null}
          </InfoValue>
        </InfoRow>
        <VaultPriceImpactRow priceImpact={form.route?.zapDetails.priceImpact} result={form.priceImpactResult} />
        <InfoRow>
          <InfoLabel tooltip={maxSlippageTooltip()}>{t`Max Slippage`}</InfoLabel>
          <InfoValue>{formatSlippage(form.slippage)}</InfoValue>
        </InfoRow>
        <InfoRow>
          <InfoLabel
            tooltip={t`Estimated network fee for this transaction. What you actually pay depends on network conditions.`}
          >{t`Est. Gas Fee`}</InfoLabel>
          <InfoValue>
            {form.route ? formatDisplayNumber(form.route.gasUsd, { style: 'currency', significantDigits: 4 }) : '--'}
          </InfoValue>
        </InfoRow>
      </DetailsBox>

      <VaultPriceImpactNote result={form.priceImpactResult} />

      <ButtonGroup>
        <OutlinedButton onClick={onBack}>{t`Cancel`}</OutlinedButton>
        <PrimaryButton className={cn(priceImpactButtonClass(impactTone))} onClick={onSubmit} disabled={!form.isReady}>
          {isImpactBad ? t`Deposit Anyway` : t`Deposit`}
        </PrimaryButton>
      </ButtonGroup>
    </>
  )
}

export default ConfirmDeposit
export { CloseButton }
