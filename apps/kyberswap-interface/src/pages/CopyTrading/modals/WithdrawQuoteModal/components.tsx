import { Token } from '@kyberswap/ks-sdk-core'
import type { WithdrawQuotePreview } from 'services/copyTrading/types/preparedActions'

import { Stack } from 'components/Stack'
import CapitalAmountInput from 'pages/CopyTrading/modals/CapitalAmount'
import { PreparedActionFormActions, ReviewRow, ReviewSection } from 'pages/CopyTrading/modals/PreparedActionModal'
import { formatPreparedAmount, withMetricFallback } from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import { UINT256_MAX_RAW } from 'pages/CopyTrading/modals/WithdrawQuoteModal/withdrawQuote'
import { shortenAddress } from 'utils/address'

type WithdrawQuoteReviewProps = {
  chainId: number
  isLoading: boolean
  preview?: WithdrawQuotePreview
}

export const WithdrawQuoteReview = ({ chainId, isLoading, preview }: WithdrawQuoteReviewProps) => {
  const showSkeleton = isLoading && !preview
  const withdrawalAmount = withMetricFallback(
    formatPreparedAmount(
      preview?.sweepAmountRaw === UINT256_MAX_RAW ? preview.quoteBalance : preview?.sweepAmountRaw,
      preview?.quoteToken,
    ),
  )

  return (
    <ReviewSection title="Review Withdrawal">
      <ReviewRow
        isLoading={showSkeleton}
        label="Prepared Balance"
        value={withMetricFallback(formatPreparedAmount(preview?.quoteBalance, preview?.quoteToken))}
      />
      <ReviewRow isLoading={showSkeleton} label="Withdrawal Amount" value={withdrawalAmount} />
      <ReviewRow
        isLoading={showSkeleton}
        label="Recipient"
        value={preview?.recipientAddress ? shortenAddress(chainId, preview.recipientAddress) : 'N/A'}
      />
    </ReviewSection>
  )
}

type WithdrawQuoteFormProps = {
  amount: string
  amountError?: string
  availabilityMessage?: string
  isPreparing: boolean
  onAmountChange: (amount: string) => void
  onCancel: () => void
  onHalf: () => void
  onMax: () => void
  onPrimaryAction: () => void
  presetsEnabled: boolean
  primaryActionDisabled: boolean
  primaryActionLabel: string
  quoteCurrency?: Token
  selectedChainId: number
  walletBalanceLoading: boolean
  walletBalanceText: string
}

export const WithdrawQuoteForm = ({
  amount,
  amountError,
  availabilityMessage,
  isPreparing,
  onAmountChange,
  onCancel,
  onHalf,
  onMax,
  onPrimaryAction,
  presetsEnabled,
  primaryActionDisabled,
  primaryActionLabel,
  quoteCurrency,
  selectedChainId,
  walletBalanceLoading,
  walletBalanceText,
}: WithdrawQuoteFormProps) => (
  <Stack className="gap-4">
    <p className="text-sm text-subText">Withdraw quote tokens to the current owner without selling open positions.</p>
    <CapitalAmountInput
      amount={amount}
      amountError={amountError}
      inputId="copy-trading-withdraw-quote"
      isPreparing={isPreparing}
      label="Withdrawal Amount"
      onAmountChange={onAmountChange}
      onBalanceClick={onMax}
      presetActions={[
        { label: 'Half', onClick: onHalf },
        { label: 'Max', onClick: onMax },
      ]}
      presetsEnabled={presetsEnabled}
      quoteCurrency={quoteCurrency}
      selectedChainId={selectedChainId}
      walletBalanceLoading={walletBalanceLoading}
      walletBalanceText={walletBalanceText}
    />
    <PreparedActionFormActions
      cancelDisabled={isPreparing}
      onCancel={onCancel}
      onPrimaryAction={onPrimaryAction}
      primaryActionDisabled={primaryActionDisabled}
      primaryActionLabel={primaryActionLabel}
      primaryActionLoading={isPreparing}
      primaryActionTitle={amountError || availabilityMessage}
    />
  </Stack>
)
