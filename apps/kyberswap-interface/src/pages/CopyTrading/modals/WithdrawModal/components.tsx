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
  quoteCurrency: Token
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

export const WithdrawTokensReview = ({
  preview,
  chainId,
  agentName,
}: {
  preview?: WithdrawTokensPreview
  chainId: number
  agentName?: string
}) => (
  <Stack className="gap-4">
    <ReviewSection>
      <p className="text-sm font-medium text-subText">{agentName}</p>
      <p className="text-sm">Withdraw your tokens directly without selling.</p>
      <ul className="m-0 list-disc pl-5 text-sm">
        <li>No swap will be executed.</li>
        <li>No rebates program applied.</li>
        <li>You can sell the tokens yourself at your discretion.</li>
      </ul>
    </ReviewSection>
    <ReviewSection title="Review Withdrawal">
      <ReviewRow label="Total Current Value" value={formatUsd(metricValue(preview?.totalCurrentValueUsd))} />
      <ReviewRow label="Estimated Rebates at Risk" value={formatUsd(metricValue(preview?.cashbackForfeitedUsd))} />
      <ReviewRow
        label="Recipient"
        value={preview?.recipientAddress ? shortenAddress(chainId, preview.recipientAddress) : 'N/A'}
      />
    </ReviewSection>
    <ErrorWarning type="warn" title="This withdrawal permanently stops copying. Pending rebates may be forfeited." />
  </Stack>
)
