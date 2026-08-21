import type { PositionSummary } from 'services/copyTrading/types/positions'
import type { PositionSellPreview } from 'services/copyTrading/types/preparedActions'

import { ButtonPrimary } from 'components/Button'
import Dots from 'components/Dots'
import { Stack } from 'components/Stack'
import { ShortenedId } from 'pages/CopyTrading/components/common/layout'
import { formatApproximateUsd } from 'pages/CopyTrading/helpers'
import { ReviewRow, ReviewSection } from 'pages/CopyTrading/modals/PreparedActionModal'
import PreparedActionSlippageControl from 'pages/CopyTrading/modals/PreparedActionModal/SlippageControl'
import {
  formatPreparedAmount,
  formatSlippage,
  formatWadPercent,
} from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'

const withMetricFallback = (value: string) => (value === '—' ? 'N/A' : value)

export const PositionValue = ({ symbol, tradeId }: { symbol?: string; tradeId: string }) => (
  <>
    {symbol || 'Token'} · <ShortenedId value={tradeId} />
  </>
)

export const ManagePositionReview = ({
  isClose,
  isLoading,
  position,
  preview,
}: {
  isClose: boolean
  isLoading: boolean
  position: PositionSummary
  preview?: PositionSellPreview
}) => {
  const showSkeleton = isLoading && !preview

  return (
    <ReviewSection title={isClose ? 'Review Close Position' : 'Review Manual Sell'}>
      <ReviewRow
        label="Position"
        value={
          <PositionValue symbol={preview?.baseToken?.symbol || position.token.symbol} tradeId={position.tradeId} />
        }
      />
      {!isClose && (
        <ReviewRow
          isLoading={showSkeleton}
          label="Portion to sell"
          value={withMetricFallback(formatWadPercent(preview?.sellRatioRaw))}
        />
      )}
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
  isPreparing: boolean
  onPrimaryAction: () => void
  onSlippageChange: (slippage: number) => void
  position: PositionSummary
  primaryActionDisabled: boolean
  primaryActionLabel: string
  slippage: number
  unavailableMessage?: string
}

export const ManagePositionForm = ({
  isPreparing,
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
      <ReviewSection>
        <ReviewRow
          label="Position"
          value={<PositionValue symbol={position.token.symbol} tradeId={position.tradeId} />}
        />
        <ReviewRow label="Current value" value={withMetricFallback(formatApproximateUsd(position.valueUsd))} />
      </ReviewSection>

      <PreparedActionSlippageControl disabled={isPreparing} onChange={onSlippageChange} value={slippage} />

      <ButtonPrimary
        type="button"
        disabled={primaryActionDisabled}
        title={unavailableMessage}
        onClick={onPrimaryAction}
      >
        {isPreparing ? <Dots>{primaryActionLabel}</Dots> : primaryActionLabel}
      </ButtonPrimary>
    </Stack>
  )
}
