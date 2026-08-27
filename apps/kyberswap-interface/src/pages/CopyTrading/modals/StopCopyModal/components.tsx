import type { StopCopyPreview } from 'services/copyTrading/types/preparedActions'

import ScrollableWithSignal from 'components/ScrollableWithSignal'
import TableCellSkeleton from 'components/Skeleton/TableCellSkeleton'
import { Center, HStack, Stack } from 'components/Stack'
import { formatApproximateUsd, getSignedMetricClassName, signedUsd } from 'pages/CopyTrading/helpers'
import { PreparedActionFormActions, ReviewRow, ReviewSection } from 'pages/CopyTrading/modals/PreparedActionModal'
import PreparedActionSlippageControl from 'pages/CopyTrading/modals/PreparedActionModal/SlippageControl'
import { formatPreparedAmount, withMetricFallback } from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import { MAX_STOP_POSITIONS, type SelectableStopCopyPosition } from 'pages/CopyTrading/modals/StopCopyModal/positions'
import { cn } from 'utils/cn'

const withApproximateMetricFallback = (value: string) => (value === '—' ? 'N/A' : `~${value}`)

const groupStopCopyPositionsByToken = (positions: NonNullable<StopCopyPreview['positions']>) => {
  const groups = new Map<string, { count: number; label: string }>()

  positions.forEach((position, index) => {
    const address = position.baseToken?.address?.toLowerCase()
    const symbol = position.baseToken?.symbol
    const key = address || (symbol ? `symbol:${symbol.toLowerCase()}` : `unknown:${position.userPositionId || index}`)
    const current = groups.get(key)

    groups.set(key, {
      count: (current?.count || 0) + 1,
      label: current?.label || symbol || 'Unknown',
    })
  })

  return Array.from(groups, ([key, group]) => ({ key, ...group }))
}

export const StopCopyReview = ({ isLoading, preview }: { isLoading: boolean; preview?: StopCopyPreview }) => {
  const showSkeleton = isLoading && !preview
  const tokenGroups = groupStopCopyPositionsByToken(preview?.positions || [])

  return (
    <Stack className="gap-4">
      {!!preview?.positions?.length && (
        <Stack className="gap-3 rounded-xl bg-white-04 px-4 py-3">
          <HStack className="items-center justify-between gap-3 text-sm font-medium text-subText">
            <h3>Positions To Sell:</h3>
            <span>{preview.positions.length}</span>
          </HStack>
          <HStack className="flex-wrap gap-2">
            {tokenGroups.map(token => (
              <span
                key={token.key}
                className="relative inline-flex min-w-16 items-center justify-center rounded-lg bg-white-08 px-3 py-1 text-sm font-medium text-text"
              >
                {token.label}
                {token.count > 1 && (
                  <span className="absolute -right-1.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[11px] text-darkText">
                    {token.count}
                  </span>
                )}
              </span>
            ))}
          </HStack>
        </Stack>
      )}

      <ReviewSection>
        <ReviewRow
          isLoading={showSkeleton}
          label="Est. Positions Value"
          value={formatApproximateUsd(preview?.totalCurrentValueUsd?.value)}
        />
        <ReviewRow
          isLoading={showSkeleton}
          label="Est. Cashback"
          value={withApproximateMetricFallback(formatPreparedAmount(preview?.totalCashback, preview?.quoteToken))}
        />
        <ReviewRow
          isLoading={showSkeleton}
          label="Expected Received"
          value={withMetricFallback(formatPreparedAmount(preview?.totalSwapQuote?.expectedQuote, preview?.quoteToken))}
        />
        <ReviewRow
          isLoading={showSkeleton}
          label="Minimum Received"
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
  isSelected: (position: SelectableStopCopyPosition, index: number) => boolean
  onCancel: () => void
  onPrimaryAction: () => void
  onSlippageChange: (slippage: number) => void
  onTogglePosition: (position: SelectableStopCopyPosition, index: number) => void
  positions?: SelectableStopCopyPosition[]
  positionsError?: string
  primaryActionDisabled: boolean
  primaryActionLabel: string
  primaryActionLoading: boolean
  selectedPositionCount: number
  selectedPositionValueUsd?: string
  slippage: number
}

const StopCopyPositionSkeletons = ({ count }: { count: number }) => {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
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
      ))}
    </>
  )
}

type StopCopyPositionRowProps = {
  checked: boolean
  disabled: boolean
  onToggle: () => void
  position: SelectableStopCopyPosition
}

const StopCopyPositionRow = ({ checked, disabled, onToggle, position }: StopCopyPositionRowProps) => (
  <label
    className={cn(
      'grid grid-cols-[16px_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 rounded-lg px-3 py-2 transition-colors sm:grid-cols-[16px_minmax(60px,1fr)_140px_120px] sm:gap-2',
      disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-white-04',
    )}
  >
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={onToggle}
      className="size-3.5 shrink-0 accent-primary"
    />
    <span className="truncate text-sm font-medium text-text">{position.token.symbol}</span>
    <HStack className="col-span-2 col-start-2 row-start-2 min-w-0 items-center gap-1 sm:col-auto sm:row-auto">
      <span className="shrink-0 text-xs font-medium text-subText">P&amp;L</span>
      <span className={cn('truncate text-sm font-medium', getSignedMetricClassName(position.unrealizedPnlUsd))}>
        {signedUsd(position.unrealizedPnlUsd)}
      </span>
    </HStack>
    <span className="col-start-3 row-start-1 truncate text-right text-sm font-medium text-text sm:col-auto sm:row-auto">
      {formatApproximateUsd(position.valueUsd)}
    </span>
  </label>
)

type StopCopyPositionListProps = Pick<
  StopCopyFormProps,
  | 'expectedPositionCount'
  | 'isPreparing'
  | 'isSelected'
  | 'onTogglePosition'
  | 'positions'
  | 'positionsError'
  | 'selectedPositionCount'
>

const StopCopyPositionList = ({
  expectedPositionCount,
  isPreparing,
  isSelected,
  onTogglePosition,
  positions,
  positionsError,
  selectedPositionCount,
}: StopCopyPositionListProps) => {
  const loadingPositionCount =
    positions === undefined && !positionsError ? Math.min(6, Math.max(1, expectedPositionCount ?? 1)) : 0
  const displayedPositionCount = positions?.length ?? expectedPositionCount
  const hasPositionRows = (positions?.length ?? loadingPositionCount) > 0

  let positionRows = null
  if (positions === undefined && !positionsError) {
    positionRows = <StopCopyPositionSkeletons count={loadingPositionCount} />
  } else if (positions?.length) {
    positionRows = positions.map((position, index) => {
      const checked = isSelected(position, index)
      const selectionLimitReached = !checked && selectedPositionCount >= MAX_STOP_POSITIONS

      return (
        <StopCopyPositionRow
          key={position.userPositionId}
          checked={checked}
          disabled={isPreparing || selectionLimitReached}
          onToggle={() => onTogglePosition(position, index)}
          position={position}
        />
      )
    })
  } else if (positions) {
    positionRows = (
      <Center className="min-h-9">
        <p className="text-center text-sm text-subText">No open positions. You can still stop copying.</p>
      </Center>
    )
  }

  return (
    <Stack className="gap-2">
      <HStack className="items-center justify-between gap-3">
        <span className="text-sm text-subText">Select Positions To Sell:</span>
        <span className="shrink-0 text-sm font-medium text-subText">
          {displayedPositionCount === undefined ? '' : `${selectedPositionCount}/${displayedPositionCount}`}
        </span>
      </HStack>

      <ScrollableWithSignal
        data-open={hasPositionRows ? 'true' : 'false'}
        showArrow
        className={cn(
          'flex flex-col gap-1 rounded-xl bg-white-04 p-1',
          hasPositionRows && 'ks-scrollbar max-h-[244px] overflow-y-auto',
        )}
      >
        {positionRows}
      </ScrollableWithSignal>
    </Stack>
  )
}

export const StopCopyForm = ({
  availabilityMessage,
  expectedPositionCount,
  isPreparing,
  isSelected,
  onCancel,
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
  return (
    <Stack className="gap-4">
      <StopCopyPositionList
        expectedPositionCount={expectedPositionCount}
        isPreparing={isPreparing}
        isSelected={isSelected}
        onTogglePosition={onTogglePosition}
        positions={positions}
        positionsError={positionsError}
        selectedPositionCount={selectedPositionCount}
      />

      {!!positions && positions.length > MAX_STOP_POSITIONS && (
        <p className="text-xs text-warning">
          Select up to {MAX_STOP_POSITIONS} positions to sell in this Stop Copy request.
        </p>
      )}

      <Stack className="gap-2 rounded-xl border border-border px-4 py-3">
        <HStack className="items-center justify-between gap-3 text-sm">
          <span className="text-subText">Est. Value Selected</span>
          <span className="font-medium text-text">{formatApproximateUsd(selectedPositionValueUsd)}</span>
        </HStack>
        <PreparedActionSlippageControl disabled={isPreparing} onChange={onSlippageChange} value={slippage} />
      </Stack>

      {expectedPositionCount !== undefined && expectedPositionCount > 0 && (
        <p className="text-sm italic text-subText/80">
          Unchecked tokens stay in your wallet. You manage them manually after stopping.
        </p>
      )}

      <PreparedActionFormActions
        cancelDisabled={isPreparing}
        onCancel={onCancel}
        onPrimaryAction={onPrimaryAction}
        primaryActionDisabled={primaryActionDisabled}
        primaryActionLabel={primaryActionLabel}
        primaryActionLoading={primaryActionLoading}
        primaryActionTitle={availabilityMessage}
      />
    </Stack>
  )
}
