import type { PositionSummary } from 'services/copyTrading/types/positions'
import type { StopCopyPreview } from 'services/copyTrading/types/preparedActions'

import { ButtonPrimary } from 'components/Button'
import Dots from 'components/Dots'
import ScrollableWithSignal from 'components/ScrollableWithSignal'
import TableCellSkeleton from 'components/Skeleton/TableCellSkeleton'
import { Center, HStack, Stack } from 'components/Stack'
import { formatApproximateUsd, getSignedMetricClassName, signedUsd } from 'pages/CopyTrading/helpers'
import { ReviewRow, ReviewSection } from 'pages/CopyTrading/modals/PreparedActionModal'
import PreparedActionSlippageControl from 'pages/CopyTrading/modals/PreparedActionModal/SlippageControl'
import { formatPreparedAmount } from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import { MAX_STOP_POSITIONS, getUserPositionId } from 'pages/CopyTrading/modals/StopCopyModal/positions'
import { cn } from 'utils/cn'

const withMetricFallback = (value: string) => (value === '—' ? 'N/A' : value)
const withApproximateMetricFallback = (value: string) => (value === '—' ? 'N/A' : `~${value}`)

export const StopCopyReview = ({ isLoading, preview }: { isLoading: boolean; preview?: StopCopyPreview }) => {
  const showSkeleton = isLoading && !preview

  return (
    <Stack className="gap-4">
      {!!preview?.positions?.length && (
        <Stack className="gap-3 rounded-xl bg-white-04 px-4 py-3">
          <h3 className="text-sm font-medium text-subText">Positions to sell</h3>
          <HStack className="flex-wrap gap-2">
            {preview.positions.map(position => (
              <span
                key={position.userPositionId}
                className="inline-flex min-w-16 items-center justify-center rounded-lg bg-white-08 px-3 py-1 text-sm font-medium text-text"
              >
                {position.baseToken?.symbol || 'Unknown'}
              </span>
            ))}
          </HStack>
        </Stack>
      )}

      <ReviewSection>
        <ReviewRow
          isLoading={showSkeleton}
          label="Est. positions value"
          value={formatApproximateUsd(preview?.totalCurrentValueUsd?.value)}
        />
        <ReviewRow
          isLoading={showSkeleton}
          label="Est. cashback"
          value={withApproximateMetricFallback(formatPreparedAmount(preview?.totalCashback, preview?.quoteToken))}
        />
        <ReviewRow
          isLoading={showSkeleton}
          label="Expected received"
          value={withMetricFallback(formatPreparedAmount(preview?.totalSwapQuote?.expectedQuote, preview?.quoteToken))}
        />
        <ReviewRow
          isLoading={showSkeleton}
          label="Minimum received"
          value={withMetricFallback(formatPreparedAmount(preview?.totalSwapQuote?.minimumQuote, preview?.quoteToken))}
        />
      </ReviewSection>
    </Stack>
  )
}

type StopCopyFormProps = {
  availabilityMessage?: string
  expectedPositionCount?: number
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
  selectedPositionValueUsd?: string
  slippage: number
}

export const StopCopyForm = ({
  availabilityMessage,
  expectedPositionCount,
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
  selectedPositionValueUsd,
  slippage,
}: StopCopyFormProps) => {
  const loadingPositionCount =
    positions === undefined && !positionsError ? Math.min(6, Math.max(1, expectedPositionCount ?? 1)) : 0
  const displayedPositionCount = positions?.length ?? expectedPositionCount
  const hasPositionRows = (positions?.length ?? loadingPositionCount) > 0

  return (
    <Stack className="gap-4">
      <Stack className="gap-2">
        <HStack className="items-center justify-between gap-3">
          <span className="text-sm text-subText">Select positions to sell:</span>
          <span className="shrink-0 text-sm font-medium text-subText">
            {displayedPositionCount === undefined ? '' : `${selectedPositionCount}/${displayedPositionCount}`}
          </span>
        </HStack>

        <ScrollableWithSignal
          data-open={hasPositionRows ? 'true' : 'false'}
          showArrow
          className={cn(
            'flex flex-col gap-1 rounded-xl bg-white-04  p-1',
            hasPositionRows && 'ks-scrollbar max-h-[244px] overflow-y-auto',
          )}
        >
          {positions === undefined ? (
            !positionsError ? (
              Array.from({ length: loadingPositionCount }, (_, index) => (
                <div
                  key={index}
                  className="grid min-h-9 animate-pulse grid-cols-[16px_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 rounded-lg px-3 py-2 sm:grid-cols-[16px_minmax(60px,1fr)_140px_120px] sm:gap-2"
                >
                  <TableCellSkeleton width={14} height={14} className="rounded-[3px]" />
                  <TableCellSkeleton width={48} height={16} />
                  <HStack className="col-span-2 col-start-2 row-start-2 items-center gap-1 sm:col-auto sm:row-auto">
                    <TableCellSkeleton width={28} height={14} />
                    <TableCellSkeleton width={72} height={16} />
                  </HStack>
                  <TableCellSkeleton
                    width={72}
                    height={16}
                    className="col-start-3 row-start-1 justify-self-end sm:col-auto sm:row-auto"
                  />
                </div>
              ))
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
                    'grid grid-cols-[16px_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 rounded-lg px-3 py-2 transition-colors sm:grid-cols-[16px_minmax(60px,1fr)_140px_120px] sm:gap-2',
                    isPreparing || selectionLimitReached
                      ? 'cursor-not-allowed opacity-50'
                      : 'cursor-pointer hover:bg-white-04',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={isPreparing || selectionLimitReached}
                    onChange={() => onTogglePosition(position, index)}
                    className="size-3.5 shrink-0 accent-primary"
                  />
                  <span className="truncate text-sm font-medium text-text">{position.token.symbol}</span>
                  <HStack className="col-span-2 col-start-2 row-start-2 min-w-0 items-center gap-1 sm:col-auto sm:row-auto">
                    <span className="shrink-0 text-xs font-medium text-subText">P&amp;L</span>
                    <span
                      className={cn(
                        'truncate text-sm font-medium',
                        getSignedMetricClassName(position.unrealizedPnlUsd),
                      )}
                    >
                      {signedUsd(position.unrealizedPnlUsd)}
                    </span>
                  </HStack>
                  <span className="col-start-3 row-start-1 truncate text-right text-sm font-medium text-text sm:col-auto sm:row-auto">
                    {formatApproximateUsd(position.valueUsd)}
                  </span>
                </label>
              )
            })
          ) : (
            <Center className="min-h-9">
              <p className="text-center text-sm text-subText">No open positions. You can still stop copying.</p>
            </Center>
          )}
        </ScrollableWithSignal>
      </Stack>

      {!!positions && positions.length > MAX_STOP_POSITIONS && (
        <p className="text-xs text-warning">
          Select up to {MAX_STOP_POSITIONS} positions to sell in this Stop Copy request.
        </p>
      )}

      <Stack className="gap-2 rounded-xl border border-border px-4 py-3">
        <HStack className="items-center justify-between gap-3 text-sm">
          <span className="text-subText">Est. value selected</span>
          <span className="font-medium text-text">{formatApproximateUsd(selectedPositionValueUsd)}</span>
        </HStack>
        <PreparedActionSlippageControl disabled={isPreparing} onChange={onSlippageChange} value={slippage} />
      </Stack>

      {expectedPositionCount !== undefined && expectedPositionCount > 0 && (
        <p className="text-sm italic text-subText/80">
          Unchecked tokens stay in your wallet. You manage them manually after stopping.
        </p>
      )}

      <ButtonPrimary
        type="button"
        disabled={primaryActionDisabled}
        title={availabilityMessage}
        onClick={onPrimaryAction}
      >
        {primaryActionLoading ? <Dots>{primaryActionLabel}</Dots> : primaryActionLabel}
      </ButtonPrimary>
    </Stack>
  )
}
