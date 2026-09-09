import { Token } from '@kyberswap/ks-sdk-core'
import { metricValue } from 'services/copyTrading/adapters/shared'
import type { WithdrawQuotePreview, WithdrawTokensPreview } from 'services/copyTrading/types/preparedActions'

import { ErrorWarning } from 'components/ErrorWarning'
import { Stack } from 'components/Stack'
import { formatUsd } from 'pages/CopyTrading/helpers'
import CapitalAmountInput from 'pages/CopyTrading/modals/CapitalAmount'
import { ReviewRow, ReviewSection } from 'pages/CopyTrading/modals/PreparedActionModal'
import { formatPreparedAmount, withMetricFallback } from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import { UINT256_MAX_RAW } from 'pages/CopyTrading/modals/WithdrawModal/utils'
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

export const WithdrawQuoteInput = ({
  amount,
  amountError,
  isPreparing,
  onAmountChange,
  onHalf,
  onMax,
  presetsEnabled,
  quoteCurrency,
  selectedChainId,
  walletBalanceLoading,
  walletBalanceText,
}: {
  amount: string
  amountError?: string
  isPreparing: boolean
  onAmountChange: (amount: string) => void
  onHalf: () => void
  onMax: () => void
  presetsEnabled: boolean
  quoteCurrency?: Token
  selectedChainId: number
  walletBalanceLoading: boolean
  walletBalanceText: string
}) => (
  <CapitalAmountInput
    mode="compact"
    amount={amount}
    amountError={amountError}
    inputId="copy-trading-withdraw-quote"
    isPreparing={isPreparing}
    label="Withdrawal Amount"
    onAmountChange={onAmountChange}
    onBalanceClick={onMax}
    presetActions={[
      { label: '100%', onClick: onMax },
      { label: '50%', onClick: onHalf },
    ]}
    presetsEnabled={presetsEnabled}
    quoteCurrency={quoteCurrency}
    selectedChainId={selectedChainId}
    walletBalanceLoading={walletBalanceLoading}
    walletBalanceText={walletBalanceText}
  />
)

export const WithdrawTokensReview = ({ preview, chainId }: { preview?: WithdrawTokensPreview; chainId: number }) => (
  <Stack className="gap-4">
    <ErrorWarning
      type="warn"
      title="Withdrawing All Tokens permanently stops copying, even when all selected balances are zero. Pending rebates may be forfeited. Native tokens and tokens not yet indexed are excluded. The amounts received may differ from the prepared balances."
    />
    <ReviewSection title="Review Withdrawal">
      <div className="max-h-60 overflow-y-auto">
        {preview?.tokens?.map(({ token, balance }) => (
          <ReviewRow
            key={token?.address}
            label={token?.symbol || token?.address || 'Unknown token'}
            value={withMetricFallback(formatPreparedAmount(balance, token))}
          />
        ))}
      </div>
      <ReviewRow label="Total Current Value" value={formatUsd(metricValue(preview?.totalCurrentValueUsd))} />
      <ReviewRow label="Estimated Rebates at Risk" value={formatUsd(metricValue(preview?.cashbackForfeitedUsd))} />
      <ReviewRow
        label="Recipient"
        value={preview?.recipientAddress ? shortenAddress(chainId, preview.recipientAddress) : 'N/A'}
      />
    </ReviewSection>
  </Stack>
)
