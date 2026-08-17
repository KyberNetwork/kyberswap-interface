import type { CopyRunSummary } from 'services/copyTrading/types/copyRuns'
import type { PositionSummary } from 'services/copyTrading/types/positions'
import type { StopCopyPreview } from 'services/copyTrading/types/preparedActions'

import { ButtonLight, ButtonWarning } from 'components/Button'
import Dots from 'components/Dots'
import Loader from 'components/Loader'
import { Center, HStack, Stack } from 'components/Stack'
import { ShortenedId } from 'pages/CopyTrading/components/common/layout'
import { formatUsd, getSignedMetricClassName, signedUsd } from 'pages/CopyTrading/helpers'
import { ReviewRow, ReviewSection } from 'pages/CopyTrading/modals/PreparedActionModal'
import { formatPreparedAmount, formatSlippage } from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import { MAX_STOP_POSITIONS, getUserPositionId } from 'pages/CopyTrading/modals/StopCopyModal/positions'
import { cn } from 'utils/cn'

const SLIPPAGE_OPTIONS = [0.5, 1, 2]

export const StopCopyReview = ({
  agentName,
  copyRun,
  preview,
}: {
  agentName?: string
  copyRun: CopyRunSummary
  preview?: StopCopyPreview
}) => {
  return (
    <Stack className="gap-4">
      <ReviewSection title="Review Stop Copy">
        <ReviewRow label="Agent" value={agentName || copyRun.agentSnapshot?.displayName || 'Copy Run'} />
        <ReviewRow label="Positions to sell" value={preview?.positions?.length || 0} />
        <ReviewRow label="Current value" value={formatUsd(preview?.totalCurrentValueUsd?.value)} />
        <ReviewRow
          label="Estimated cashback"
          value={formatPreparedAmount(preview?.totalCashback, preview?.quoteToken)}
        />
        <ReviewRow
          label="Minimum received"
          value={formatPreparedAmount(preview?.totalSwapQuote?.minimumQuote, preview?.quoteToken)}
        />
      </ReviewSection>

      {!!preview?.positions?.length && (
        <ReviewSection title="Prepared positions">
          {preview.positions.map(position => (
            <ReviewRow
              key={position.userPositionId || position.tradeId}
              label={position.baseToken?.symbol || <ShortenedId value={position.tradeId} />}
              value={formatPreparedAmount(position.swapQuote?.minimumQuote, preview.quoteToken)}
            />
          ))}
        </ReviewSection>
      )}
    </Stack>
  )
}

type StopCopyFormProps = {
  availabilityMessage?: string
  isPreparing: boolean
  isSelected: (position: PositionSummary, index: number) => boolean
  onPrimaryAction: () => void
  onRetryPositions: () => void
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
  onRetryPositions,
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
      <span className="text-sm text-subText">
        Select positions to sell while stopping. Leaving every position unchecked is valid and stops future copying
        without requesting an exit.
      </span>

      <Stack className="gap-1">
        {positions === undefined ? (
          positionsError ? (
            <Center className="min-h-24 flex-col gap-3 rounded-lg bg-white-04 px-3 py-4 text-center">
              <span className="text-sm text-red">{positionsError}</span>
              <ButtonLight type="button" padding="8px 12px" onClick={onRetryPositions}>
                Retry
              </ButtonLight>
            </Center>
          ) : (
            <Center className="min-h-24">
              <Loader />
            </Center>
          )
        ) : positions.length ? (
          positions.map((position, index) => {
            const userPositionId = getUserPositionId(position) as string
            const checked = isSelected(position, index)
            const selectionLimitReached = !checked && selectedPositionCount >= MAX_STOP_POSITIONS

            return (
              <label
                key={userPositionId}
                className={cn(
                  'flex items-center gap-3 rounded-lg bg-white-04 px-3 py-2',
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
                <HStack className="min-w-0 flex-1 items-center justify-between gap-2">
                  <Stack className="min-w-0 flex-1 gap-0.5">
                    <span className="truncate text-sm font-medium text-text">{position.token.symbol}</span>
                    <span className="text-xs text-subText">
                      <ShortenedId value={position.tradeId} />
                    </span>
                  </Stack>
                  <span
                    className={cn(
                      'shrink-0 whitespace-nowrap text-sm font-medium',
                      getSignedMetricClassName(position.unrealizedPnlUsd),
                    )}
                  >
                    {signedUsd(position.unrealizedPnlUsd)}
                  </span>
                </HStack>
              </label>
            )
          })
        ) : (
          <span className="text-center text-sm text-subText">No open positions. You can still stop copying.</span>
        )}
      </Stack>

      {!!positions && positions.length > MAX_STOP_POSITIONS && (
        <span className="text-xs text-warning">
          Select up to {MAX_STOP_POSITIONS} positions to sell in this Stop Copy request.
        </span>
      )}

      <HStack className="items-center justify-between gap-3">
        <span className="text-sm text-subText">Slippage tolerance</span>
        <HStack className="gap-2">
          {SLIPPAGE_OPTIONS.map(value => (
            <button
              key={value}
              type="button"
              disabled={isPreparing}
              onClick={() => onSlippageChange(value)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50',
                slippage === value
                  ? 'border-primary bg-primary-12 text-primary'
                  : 'border-darkBorder text-subText hover:text-text',
              )}
            >
              {formatSlippage(value * 100)}
            </button>
          ))}
        </HStack>
      </HStack>

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
