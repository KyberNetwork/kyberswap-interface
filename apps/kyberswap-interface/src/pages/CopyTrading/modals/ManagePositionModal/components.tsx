import type { PositionSummary } from 'services/copyTrading/types/positions'
import type { PositionSellPreview } from 'services/copyTrading/types/preparedActions'

import { Stack } from 'components/Stack'
import { ShortenedId } from 'pages/CopyTrading/components/common/layout'
import { formatApproximateUsd } from 'pages/CopyTrading/helpers'
import { PreparedActionFormActions, ReviewRow, ReviewSection } from 'pages/CopyTrading/modals/PreparedActionModal'
import PreparedActionSlippageControl from 'pages/CopyTrading/modals/PreparedActionModal/SlippageControl'
import {
  formatPreparedAmount,
  formatSlippage,
  formatWadPercent,
  withMetricFallback,
} from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'

export const PositionValue = ({ symbol, tradeId }: { symbol?: string; tradeId: string }) => (
  <>
    {symbol || 'Token'} · <ShortenedId value={tradeId} />
  </>
)

export const ManagePositionReview = ({
  isLoading,
  position,
  preview,
}: {
  isLoading: boolean
  position: PositionSummary
  preview?: PositionSellPreview
}) => {
  const showSkeleton = isLoading && !preview

  return (
    <ReviewSection title="Review Position">
      <ReviewRow
        label="Position"
        value={
          <PositionValue symbol={preview?.baseToken?.symbol || position.token.symbol} tradeId={position.tradeId} />
        }
      />
      <ReviewRow
        isLoading={showSkeleton}
        label="Portion to sell"
        value={withMetricFallback(formatWadPercent(preview?.sellRatioRaw))}
      />
      <ReviewRow
        isLoading={showSkeleton}
        label="Current position amount"
        value={withMetricFallback(formatPreparedAmount(preview?.remainingBaseBefore, preview?.baseToken))}
      />
      <ReviewRow
        isLoading={showSkeleton}
        label="Sell amount"
        value={withMetricFallback(formatPreparedAmount(preview?.sellBase, preview?.baseToken))}
      />
      <ReviewRow
        isLoading={showSkeleton}
        label="Upfront fee returned"
        value={withMetricFallback(formatPreparedAmount(preview?.upfrontFeeReleasedBase, preview?.baseToken))}
      />
      <ReviewRow
        isLoading={showSkeleton}
        label="Expected received"
        value={withMetricFallback(formatPreparedAmount(preview?.swapQuote?.expectedQuote, preview?.quoteToken))}
      />
      <ReviewRow
        isLoading={showSkeleton}
        label="Minimum received"
        value={withMetricFallback(formatPreparedAmount(preview?.swapQuote?.minimumQuote, preview?.quoteToken))}
      />
      <ReviewRow
        isLoading={showSkeleton}
        label="Estimated cashback"
        value={withMetricFallback(formatPreparedAmount(preview?.cashback, preview?.quoteToken))}
      />
      <ReviewRow
        isLoading={showSkeleton}
        label="Effective slippage"
        value={withMetricFallback(formatSlippage(preview?.swapQuote?.effectiveSlippageBps))}
      />
    </ReviewSection>
  )
}

type ManagePositionFormProps = {
  description: string
  isPreparing: boolean
  onCancel: () => void
  onPrimaryAction: () => void
  onSlippageChange: (slippage: number) => void
  position: PositionSummary
  primaryActionDisabled: boolean
  primaryActionLabel: string
  slippage: number
  unavailableMessage?: string
}

export const ManagePositionForm = ({
  description,
  isPreparing,
  onCancel,
  onPrimaryAction,
  onSlippageChange,
  position,
  primaryActionDisabled,
  primaryActionLabel,
  slippage,
  unavailableMessage,
}: ManagePositionFormProps) => {
  return (
    <Stack className="gap-4">
      <p className="text-sm text-subText">{description}</p>
      <ReviewSection>
        <ReviewRow
          label="Position"
          value={<PositionValue symbol={position.token.symbol} tradeId={position.tradeId} />}
        />
        <ReviewRow label="Current value" value={withMetricFallback(formatApproximateUsd(position.valueUsd))} />
      </ReviewSection>

      <PreparedActionSlippageControl disabled={isPreparing} onChange={onSlippageChange} value={slippage} />

      <PreparedActionFormActions
        cancelDisabled={isPreparing}
        onCancel={onCancel}
        onPrimaryAction={onPrimaryAction}
        primaryActionDisabled={primaryActionDisabled}
        primaryActionLabel={primaryActionLabel}
        primaryActionLoading={isPreparing}
        primaryActionTitle={unavailableMessage}
      />
    </Stack>
  )
}
