import { AlertTriangle, ArrowDown } from 'react-feather'
import type { PendingSellObligation } from 'services/copyTrading/types/copyRuns'
import type { PositionSummary } from 'services/copyTrading/types/positions'
import type { PositionSellPreview, PreparedToken, RawAmountMetric } from 'services/copyTrading/types/preparedActions'
import type { Metric } from 'services/copyTrading/types/primitives'

import Logo from 'components/Logo'
import Skeleton from 'components/Skeleton'
import TextSkeleton from 'components/Skeleton/TextSkeleton'
import { Stack } from 'components/Stack'
import { ShortenedId } from 'pages/CopyTrading/components/common/layout'
import { formatApproximateUsd } from 'pages/CopyTrading/helpers'
import type { PositionRecoveryContext } from 'pages/CopyTrading/modals/ManagePositionModal/positionSellFlow'
import { PreparedActionFormActions, ReviewRow, ReviewSection } from 'pages/CopyTrading/modals/PreparedActionModal'
import PreparedActionSlippageControl from 'pages/CopyTrading/modals/PreparedActionModal/SlippageControl'
import {
  formatPreparedAmount,
  formatPreparedAmountValue,
  formatPreparedRate,
  formatSlippage,
  formatWadPercent,
  withMetricFallback,
} from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import { formatDateTime } from 'utils/time'

const isMetricAvailable = (metric?: Metric) =>
  metric?.status !== 'METRIC_STATUS_UNAVAILABLE' &&
  metric?.status !== 'METRIC_STATUS_NOT_APPLICABLE' &&
  metric?.status !== 'METRIC_STATUS_UNSPECIFIED'

const formatSkippedSellRatio = (metric?: Metric) =>
  isMetricAvailable(metric) ? withMetricFallback(formatWadPercent(metric?.valueRaw)) : 'N/A'

const formatSkipReason = (value?: string) =>
  value
    ?.replace(/^.*_ERROR_/, '')
    .replaceAll('_', ' ')
    .toLowerCase() || 'N/A'

type TokenAmountPanelProps = {
  amount?: RawAmountMetric
  isLoading: boolean
  label: string
  token?: PreparedToken
}

const TokenAmountPanel = ({ amount, isLoading, label, token }: TokenAmountPanelProps) => (
  <Stack className="gap-2 rounded-xl bg-white-04 p-3">
    <span className="text-sm font-medium text-subText">{label}</span>
    <div className="flex min-w-0 items-center justify-between gap-4">
      <span className="min-w-0 flex-1 truncate text-xl font-medium text-text">
        {isLoading ? (
          <Skeleton width={112} height={28} variant="darkSubtle" />
        ) : (
          withMetricFallback(formatPreparedAmountValue(amount, token))
        )}
      </span>
      <div className="flex max-w-[45%] shrink-0 items-center gap-1.5 rounded-full bg-white-08 py-1 pl-1.5 pr-2.5">
        <Logo
          srcs={token?.logoUrl ? [token.logoUrl] : []}
          alt={`${token?.symbol || 'Token'} logo`}
          className="size-5 rounded-full object-contain"
        />
        <span className="truncate text-sm font-medium text-text">{token?.symbol || 'Token'}</span>
      </div>
    </div>
  </Stack>
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
  const baseToken =
    preview?.baseToken ??
    ({
      decimals: position.token.decimals,
      logoUrl: position.token.iconUrl,
      symbol: position.token.symbol,
    } as PreparedToken)
  const rate = withMetricFallback(
    formatPreparedRate(preview?.sellBase, preview?.baseToken, preview?.swapQuote?.expectedQuote, preview?.quoteToken),
  )

  return (
    <Stack className="gap-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-subText">Rate:</span>
        {showSkeleton ? (
          <TextSkeleton className="animate-pulse" width={96} size="sm" />
        ) : (
          <span className="font-medium text-text">{rate}</span>
        )}
      </div>

      <Stack className="relative gap-1">
        <TokenAmountPanel amount={preview?.sellBase} isLoading={showSkeleton} label="You sell" token={baseToken} />
        <div className="absolute left-1/2 top-1/2 z-[1] flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg border-4 border-tableHeader bg-white-08 text-subText">
          <ArrowDown size={14} />
        </div>
        <TokenAmountPanel
          amount={preview?.swapQuote?.expectedQuote}
          isLoading={showSkeleton}
          label="You receive"
          token={preview?.quoteToken}
        />
      </Stack>

      <ReviewSection>
        <ReviewRow
          isLoading={showSkeleton}
          label="Portion to sell"
          value={withMetricFallback(formatWadPercent(preview?.sellRatioRaw))}
        />
        <ReviewRow
          isLoading={showSkeleton}
          label="Minimum received"
          value={withMetricFallback(formatPreparedAmount(preview?.swapQuote?.minimumQuote, preview?.quoteToken))}
        />
        <ReviewRow
          isLoading={showSkeleton}
          label="Upfront fee returned"
          value={withMetricFallback(formatPreparedAmount(preview?.upfrontFeeReleasedBase, preview?.baseToken))}
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
    </Stack>
  )
}

type ManagePositionFormProps = {
  isPreparing: boolean
  onCancel: () => void
  onPrimaryAction: () => void
  onSlippageChange: (slippage: number) => void
  position: PositionSummary
  positionContext: PositionRecoveryContext
  pendingSellObligations?: PendingSellObligation[]
  pendingSellObligationsError?: string
  pendingSellObligationsLoading: boolean
  primaryActionDisabled: boolean
  primaryActionLabel: string
  primaryActionLoading: boolean
  slippage: number
  unavailableMessage?: string
}

export const ManagePositionTitle = ({
  actionLabel,
  isReview,
  showSkippedActions,
}: {
  actionLabel: string
  isReview: boolean
  showSkippedActions: boolean
}) => {
  if (isReview) return <>Review Sell</>
  if (!showSkippedActions) return <>{actionLabel}</>

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <AlertTriangle size={20} className="shrink-0 text-warning" />
      <h2 className="truncate text-xl font-medium leading-tight text-text" title="Sell actions skipped">
        Sell actions skipped
      </h2>
    </div>
  )
}

const PositionTrade = ({ position }: { position: PositionSummary }) => (
  <div className="flex min-w-0 items-center gap-2 text-sm">
    <span className="text-subText">Trade</span>
    <span className="truncate text-text">{position.token.symbol || 'Token'}</span>
    <span className="text-subText">•</span>
    <ShortenedId value={position.tradeId} />
  </div>
)

const PositionSellSummary = ({
  pendingSellObligations,
  pendingSellObligationsError,
  pendingSellObligationsLoading,
  position,
  positionContext,
}: Pick<
  ManagePositionFormProps,
  | 'pendingSellObligations'
  | 'pendingSellObligationsError'
  | 'pendingSellObligationsLoading'
  | 'position'
  | 'positionContext'
>) => {
  const token: PreparedToken = {
    decimals: position.token.decimals,
    logoUrl: position.token.iconUrl,
    symbol: position.token.symbol,
  }
  const remainingAmount = withMetricFallback(formatPreparedAmount(position.displayBaseRaw, token))
  const remainingValue = formatApproximateUsd(position.valueUsd)
  const remaining = (
    <>
      {remainingAmount} <span className="text-subText">{remainingValue}</span>
    </>
  )

  if (positionContext === 'leftover') {
    return (
      <Stack className="gap-2 rounded-xl bg-white-04 p-4">
        <PositionTrade position={position} />
        <Stack className="gap-2">
          <span className="text-sm font-medium text-text">Stopped Copy position:</span>
          <ReviewRow label="Portion to close" value="100%" />
          <ReviewRow label="Remaining" value={remaining} />
        </Stack>
      </Stack>
    )
  }

  const usesPendingSellActions =
    pendingSellObligationsLoading || pendingSellObligations !== undefined || pendingSellObligationsError !== undefined
  const loadingActionCount = pendingSellObligationsLoading ? Number(position.metrics.skippedSellCount?.value || 0) : 0

  return (
    <Stack className="gap-3">
      <Stack className="gap-2 rounded-xl bg-white-04 p-4">
        <PositionTrade position={position} />
        <Stack className="gap-2">
          <span className="text-sm font-medium text-text">Skipped actions:</span>
          {Array.from({ length: loadingActionCount }, (_, index) => (
            <ReviewRow
              key={index}
              label={<TextSkeleton className="animate-pulse" width={112} size="sm" />}
              value={<TextSkeleton className="ml-auto animate-pulse" width={80} size="sm" />}
            />
          ))}
          {pendingSellObligations?.map((obligation, index) => (
            <ReviewRow
              key={obligation.leaderPositionEventId || index}
              label={formatDateTime(obligation.skippedAt)}
              value={
                <span className="block truncate text-subText">
                  <span className="text-primary">
                    {withMetricFallback(formatWadPercent(obligation.currentRatioRaw))} sell
                  </span>
                  {' · ' + (obligation.publicErrorMessage || formatSkipReason(obligation.publicErrorCode))}
                </span>
              }
            />
          ))}
          {!usesPendingSellActions && (
            <ReviewRow label="Latest reason" value={formatSkipReason(position.latestSkipPublicErrorCode)} />
          )}
          {pendingSellObligationsError && (
            <p className="text-sm text-red" role="alert">
              Unable to load skipped sell actions.
            </p>
          )}
        </Stack>
      </Stack>

      <ReviewSection>
        <ReviewRow label="Total Skipped" value={formatSkippedSellRatio(position.metrics.cumulativeSkippedRatio)} />
        <ReviewRow label="Remaining" value={remaining} />
      </ReviewSection>
    </Stack>
  )
}

export const ManagePositionForm = ({
  isPreparing,
  onCancel,
  onPrimaryAction,
  onSlippageChange,
  position,
  positionContext,
  pendingSellObligations,
  pendingSellObligationsError,
  pendingSellObligationsLoading,
  primaryActionDisabled,
  primaryActionLabel,
  primaryActionLoading,
  slippage,
  unavailableMessage,
}: ManagePositionFormProps) => (
  <Stack className="gap-4">
    <PositionSellSummary
      pendingSellObligations={pendingSellObligations}
      pendingSellObligationsError={pendingSellObligationsError}
      pendingSellObligationsLoading={pendingSellObligationsLoading}
      position={position}
      positionContext={positionContext}
    />

    <PreparedActionSlippageControl disabled={isPreparing} onChange={onSlippageChange} value={slippage} />

    <PreparedActionFormActions
      cancelDisabled={isPreparing}
      onCancel={onCancel}
      onPrimaryAction={onPrimaryAction}
      primaryActionDisabled={primaryActionDisabled}
      primaryActionLabel={primaryActionLabel}
      primaryActionLoading={primaryActionLoading}
      primaryActionTitle={unavailableMessage}
    />
  </Stack>
)
