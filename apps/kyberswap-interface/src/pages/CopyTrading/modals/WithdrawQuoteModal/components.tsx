import type { WithdrawQuotePreview } from 'services/copyTrading/types/preparedActions'

import { ButtonPrimary } from 'components/Button'
import Dots from 'components/Dots'
import { Stack } from 'components/Stack'
import { ReviewRow, ReviewSection } from 'pages/CopyTrading/modals/PreparedActionModal'
import { formatPreparedAmount, withMetricFallback } from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import { shortenAddress } from 'utils/address'

type WithdrawQuoteReviewProps = {
  chainId: number
  isLoading: boolean
  preview?: WithdrawQuotePreview
}

export const WithdrawQuoteReview = ({ chainId, isLoading, preview }: WithdrawQuoteReviewProps) => {
  const showSkeleton = isLoading && !preview

  return (
    <ReviewSection title="Review Withdrawal">
      <ReviewRow
        isLoading={showSkeleton}
        label="Available balance"
        value={withMetricFallback(formatPreparedAmount(preview?.quoteBalance, preview?.quoteToken))}
      />
      <ReviewRow
        isLoading={showSkeleton}
        label="Withdrawal amount"
        value={withMetricFallback(formatPreparedAmount(preview?.sweepAmountRaw, preview?.quoteToken))}
      />
      <ReviewRow
        isLoading={showSkeleton}
        label="Recipient"
        value={preview?.recipientAddress ? shortenAddress(chainId, preview.recipientAddress) : 'N/A'}
      />
    </ReviewSection>
  )
}

type WithdrawQuoteFormProps = {
  availabilityMessage?: string
  isPreparing: boolean
  onPrimaryAction: () => void
  primaryActionDisabled: boolean
  primaryActionLabel: string
}

export const WithdrawQuoteForm = ({
  availabilityMessage,
  isPreparing,
  onPrimaryAction,
  primaryActionDisabled,
  primaryActionLabel,
}: WithdrawQuoteFormProps) => (
  <Stack className="gap-4">
    <p className="text-sm text-subText">
      Withdraw the prepared maximum quote-token balance to the current owner. The amount and recipient are fixed by the
      latest server evidence and cannot be edited.
    </p>
    <p className="rounded-xl bg-white-04 px-4 py-3 text-sm text-subText">
      Open positions are not sold by this action. Recover positions separately when the API advertises an action.
    </p>
    <ButtonPrimary type="button" disabled={primaryActionDisabled} title={availabilityMessage} onClick={onPrimaryAction}>
      {isPreparing ? <Dots>{primaryActionLabel}</Dots> : primaryActionLabel}
    </ButtonPrimary>
  </Stack>
)
