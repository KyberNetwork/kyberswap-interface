import { Token } from '@kyberswap/ks-sdk-core'
import { isValuationRenderable, metricValue } from 'services/copyTrading/adapters/shared'
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
    <ReviewSection title="Review Withdrawal">
      <ul
        className="m-0 max-h-52 list-none overflow-y-auto rounded-lg border border-border px-4 py-1"
        aria-label="Tokens to withdraw"
      >
        {preview?.tokens?.map(({ token, balance, currentValuation }) => {
          const valueUsd = formatUsd(isValuationRenderable(currentValuation) ? currentValuation?.valueUsd : undefined)
          const tokenLabel =
            token?.symbol && !/^0x[0-9a-f]{40}$/i.test(token.symbol)
              ? token.symbol
              : token?.address || token?.symbol
              ? shortenAddress(1, token.address || token.symbol || '', 4, false)
              : 'Unknown token'

          return (
            <li
              key={token?.address}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 py-2 text-sm font-medium sm:grid-cols-[minmax(60px,1fr)_140px_120px] sm:gap-2"
            >
              <span className="min-w-0 truncate" title={token?.address}>
                {tokenLabel}
              </span>
              <span className="col-start-1 row-start-2 min-w-0 truncate text-subText sm:col-auto sm:row-auto sm:text-right">
                {withMetricFallback(formatPreparedAmount(balance, token))}
              </span>
              <span className="col-start-2 row-start-1 min-w-0 truncate text-right sm:col-auto sm:row-auto">
                {valueUsd}
              </span>
            </li>
          )
        })}
      </ul>
      <ReviewRow label="Total Current Value" value={formatUsd(metricValue(preview?.totalCurrentValueUsd))} />
      <ReviewRow label="Estimated Rebates at Risk" value={formatUsd(metricValue(preview?.cashbackForfeitedUsd))} />
      <ReviewRow
        label="Recipient"
        value={preview?.recipientAddress ? shortenAddress(chainId, preview.recipientAddress) : 'N/A'}
      />
    </ReviewSection>
    <ErrorWarning
      type="warn"
      title="This withdrawal permanently stops copying, even with zero balances. Pending rebates may be forfeited."
    />
  </Stack>
)
