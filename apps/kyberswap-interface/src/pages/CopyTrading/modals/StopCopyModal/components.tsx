import type { PositionSummary } from 'services/copyTrading/types/positions'
import type { StopCopyPreview } from 'services/copyTrading/types/preparedActions'

import { ButtonWarning } from 'components/Button'
import CollapsiblePresetControl, { type CollapsiblePresetControlOption } from 'components/CollapsiblePresetControl'
import Dots from 'components/Dots'
import Loader from 'components/Loader'
import ScrollableWithSignal from 'components/ScrollableWithSignal'
import { Center, HStack, Stack } from 'components/Stack'
import { DEFAULT_SLIPPAGES } from 'constants/trade'
import { ShortenedId } from 'pages/CopyTrading/components/common/layout'
import { formatApproximateUsd, formatUsd, getSignedMetricClassName, signedUsd } from 'pages/CopyTrading/helpers'
import { ReviewRow, ReviewSection } from 'pages/CopyTrading/modals/PreparedActionModal'
import { formatPreparedAmount, formatSlippage } from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import { MAX_STOP_POSITIONS, getUserPositionId } from 'pages/CopyTrading/modals/StopCopyModal/positions'
import { cn } from 'utils/cn'

const SLIPPAGE_OPTIONS: CollapsiblePresetControlOption[] = DEFAULT_SLIPPAGES.map(value => ({
  label: formatSlippage(value),
  value: value / 100,
}))
const formatStopCopySlippage = (value: number) => formatSlippage(value * 100)
const isStopCopySlippageAllowed = (value: number) => value >= 0 && value <= 100
const withMetricFallback = (value: string) => (value === '—' ? 'N/A' : value)

export const StopCopyReview = ({
  isLoading,
  preview,
  totalPositionCount,
}: {
  isLoading: boolean
  preview?: StopCopyPreview
  totalPositionCount: number
}) => {
  const showSkeleton = isLoading && !preview

  return (
    <ReviewSection title="Review Stop Copy">
      <ReviewRow
        isLoading={showSkeleton}
        label="Positions to sell"
        value={preview ? `${preview.positions?.length || 0}/${totalPositionCount}` : 'N/A'}
      />
      <ReviewRow
        isLoading={showSkeleton}
        label="Current value"
        value={formatUsd(preview?.totalCurrentValueUsd?.value)}
      />
      <ReviewRow
        isLoading={showSkeleton}
        label="Estimated cashback"
        value={withMetricFallback(formatPreparedAmount(preview?.totalCashback, preview?.quoteToken))}
      />
      <ReviewRow
        isLoading={showSkeleton}
        label="Minimum received"
        value={withMetricFallback(formatPreparedAmount(preview?.totalSwapQuote?.minimumQuote, preview?.quoteToken))}
      />
    </ReviewSection>
  )
}

type StopCopyFormProps = {
  availabilityMessage?: string
  isPreparing: boolean
  isSelected: (position: PositionSummary, index: number) => boolean
  onPrimaryAction: () => void
  onSlippageChange: (slippage: number) => void
  onTogglePosition: (position: PositionSummary, index: number) => void
  positions?: PositionSummary[]
  positionsError?: string
  primaryActionDisabled: boolean
  primaryActionLabel: string
  primaryActionLoading: boolean
  selectedPositionCount: number
  slippage: number
}

export const StopCopyForm = ({
  availabilityMessage,
  isPreparing,
  isSelected,
  onPrimaryAction,
  onSlippageChange,
  onTogglePosition,
  positions,
  positionsError,
  primaryActionDisabled,
  primaryActionLabel,
  primaryActionLoading,
  selectedPositionCount,
  slippage,
}: StopCopyFormProps) => {
  return (
    <Stack className="gap-4">
      <HStack className="items-center justify-between gap-3">
        <span className="text-sm text-subText">Select positions to sell:</span>
        <span className="shrink-0 text-sm font-medium text-text">
          {positions ? `${selectedPositionCount}/${positions.length}` : ''}
        </span>
      </HStack>

      <ScrollableWithSignal
        data-open={positions?.length ? 'true' : 'false'}
        showArrow
        className={cn('flex flex-col gap-1', !!positions?.length && 'ks-scrollbar max-h-[286px] overflow-y-auto pr-1')}
      >
        {positions === undefined ? (
          !positionsError ? (
            <Center className="min-h-24">
              <Loader />
            </Center>
          ) : null
        ) : positions.length ? (
          positions.map((position, index) => {
            const userPositionId = getUserPositionId(position) as string
            const checked = isSelected(position, index)
            const selectionLimitReached = !checked && selectedPositionCount >= MAX_STOP_POSITIONS

            return (
              <label
                key={userPositionId}
                className={cn(
                  'grid grid-cols-[16px_96px_minmax(124px,1fr)_104px] items-center gap-3 rounded-lg bg-white-04 px-3 py-2',
                  isPreparing || selectionLimitReached ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={isPreparing || selectionLimitReached}
                  onChange={() => onTogglePosition(position, index)}
                  className="size-4 shrink-0 accent-warning"
                />
                <Stack className="min-w-0 gap-0.5">
                  <span className="truncate text-sm font-medium text-text">{position.token.symbol}</span>
                  <span className="text-xs text-subText">
                    <ShortenedId value={position.tradeId} />
                  </span>
                </Stack>
                <HStack className="min-w-0 items-center gap-1">
                  <span className="shrink-0 text-xs font-medium text-subText">P&amp;L</span>
                  <span
                    className={cn('truncate text-sm font-medium', getSignedMetricClassName(position.unrealizedPnlUsd))}
                  >
                    {signedUsd(position.unrealizedPnlUsd)}
                  </span>
                </HStack>
                <span className="truncate text-right text-sm font-medium text-text">
                  {formatApproximateUsd(position.valueUsd)}
                </span>
              </label>
            )
          })
        ) : (
          <span className="text-center text-sm text-subText">No open positions. You can still stop copying.</span>
        )}
      </ScrollableWithSignal>

      {!!positions && positions.length > MAX_STOP_POSITIONS && (
        <span className="text-xs text-warning">
          Select up to {MAX_STOP_POSITIONS} positions to sell in this Stop Copy request.
        </span>
      )}

      <CollapsiblePresetControl
        collapseButtonAriaLabel="Toggle slippage tolerance options"
        customInputAriaLabel="Custom slippage tolerance"
        customSuffix="%"
        disabled={isPreparing}
        formatValue={formatStopCopySlippage}
        isValueAllowed={isStopCopySlippageAllowed}
        label="Slippage tolerance"
        maxFractionDigits={2}
        maxIntegerDigits={3}
        onChange={onSlippageChange}
        options={SLIPPAGE_OPTIONS}
        value={slippage}
      />

      <ButtonWarning
        type="button"
        disabled={primaryActionDisabled}
        title={availabilityMessage}
        onClick={onPrimaryAction}
      >
        {primaryActionLoading ? <Dots>{primaryActionLabel}</Dots> : primaryActionLabel}
      </ButtonWarning>
    </Stack>
  )
}
